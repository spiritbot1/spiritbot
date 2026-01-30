/**
 * 精灵1号 - 统一网关服务启动入口
 * Spirit One Gateway Service Entry Point
 * 
 * 整合：Core + Moltbot + Feishu + 安全确认 + 人格系统
 */

import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

// 安全模块
import { 
  handleConfirmCallback, 
  isKillSwitchActive, 
  resumeOperations,
  getPendingOperations 
} from './security/feishu-confirm';
import { createSecureExecutor } from './security/secure-executor';

// 精灵人格模块
import {
  getOrCreateUserSettings,
  getUserSpiritPersona,
  updateSpiritSettings,
  recordUserActivity,
  checkQuota,
  isNewUser,
  getStats
} from './spirit/user-settings';
import {
  createWelcomeCard,
  createStyleSelectionCard,
  createNamingCard,
  createSetupCompleteCard,
  createSettingsCard,
  createStatsCard,
  createGuideCard,
  createErrorCard
} from './spirit/feishu-cards';
import { generateSystemPrompt, SpiritStyle } from './spirit/spirit-persona';

// AI 模型调度
import { getModelDispatcher, ChatMessage } from './ai/model-dispatcher';

// Moltbot 桥接
import { createMoltbotBridge, AGENT_TEMPLATES } from './moltbot/moltbot-bridge';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建安全执行器（延迟初始化，等待配置加载）
let secureExecutor: ReturnType<typeof createSecureExecutor> | null = null;

// 从环境变量读取配置
const config = {
  port: parseInt(process.env.GATEWAY_PORT || '3100'),
  feishu: {
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || '',
    encryptKey: process.env.FEISHU_ENCRYPT_KEY || ''
  },
  ai: {
    apiKey: process.env.SILICONFLOW_API_KEY || '',
    model: 'deepseek-ai/DeepSeek-V3'
  },
  moltbot: {
    gatewayUrl: process.env.MOLTBOT_GATEWAY_URL || '',
    hookPath: process.env.MOLTBOT_HOOK_PATH || '/hooks',
    hookToken: process.env.MOLTBOT_HOOK_TOKEN || '',
    defaultAgentName: process.env.MOLTBOT_DEFAULT_AGENT || 'SpiritAgent',
    defaultChannel: process.env.MOLTBOT_HOOK_CHANNEL || 'last'
  }
};

// 初始化 AI 模型调度器
const modelDispatcher = getModelDispatcher();

// 初始化 Moltbot 桥接器
const moltbotBridge = createMoltbotBridge(config.moltbot);

// 用户设置流程状态（简单状态机）
const userSetupState = new Map<string, {
  step: 'select_style' | 'set_name' | 'complete';
  selectedStyle?: SpiritStyle;
}>();

// ============================
// 智能 AI 调用（使用模型调度器）
// ============================
async function callAI(message: string, userId: string, channel: string = 'feishu'): Promise<string> {
  // 获取用户人格
  const persona = getUserSpiritPersona(userId, channel);
  const systemPrompt = generateSystemPrompt(persona);
  
  // 构建消息
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];
  
  // 调用 AI
  const result = await modelDispatcher.chat(messages);
  
  if (!result.success) {
    console.error('[AI] 调用失败:', result.error);
    return `${persona.emoji} 哎呀，我的大脑暂时有点卡顿... 请稍后再试~`;
  }
  
  console.log(`[AI] 使用模型: ${result.provider}/${result.model}, 延迟: ${result.latency}ms`);
  
  return result.content || `${persona.emoji} 嗯...让我想想...`;
}

// ============================
// 发送飞书卡片
// ============================
async function sendFeishuCard(chatId: string, card: object): Promise<void> {
  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.feishu.appId,
        app_secret: config.feishu.appSecret
      })
    });
    const tokenData = await tokenRes.json() as { tenant_access_token?: string };
    
    if (tokenData.tenant_access_token) {
      await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.tenant_access_token}`
        },
        body: JSON.stringify({
          receive_id: chatId,
          msg_type: 'interactive',
          content: JSON.stringify(card)
        })
      });
      console.log('[飞书] 卡片已发送');
    }
  } catch (error) {
    console.error('[飞书] 发送卡片失败:', error);
  }
}

// ============================
// 初始化安全执行器
// ============================
function initSecureExecutor() {
  if (!secureExecutor && config.feishu.appId && config.feishu.appSecret) {
    secureExecutor = createSecureExecutor({
      feishuAppId: config.feishu.appId,
      feishuAppSecret: config.feishu.appSecret,
      defaultChatId: '', // 将在运行时从消息中获取
      enabled: true
    });
    console.log('[安全] 安全执行器已初始化');
  }
}

// ============================
// 健康检查
// ============================
app.get('/health', (req, res) => {
  const pendingOps = getPendingOperations();
  res.json({
    status: 'ok',
    service: 'spirit-fusion-gateway',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    security: {
      killSwitchActive: isKillSwitchActive(),
      pendingConfirmations: pendingOps.length
    }
  });
});

// ============================
// 精灵1号控制接口
// ============================
app.get('/spirit/status', (req, res) => {
  res.json({
    active: !isKillSwitchActive(),
    pendingOperations: getPendingOperations().map(op => ({
      id: op.id,
      type: op.type,
      description: op.description,
      createdAt: op.createdAt,
      expiresAt: op.expiresAt
    }))
  });
});

app.post('/spirit/resume', (req, res) => {
  resumeOperations();
  res.json({ success: true, message: '精灵1号已恢复运行' });
});

// ============================
// 飞书卡片交互回调（安全确认 + 精灵设置）
// ============================
app.post('/callback/feishu/card', async (req, res) => {
  console.log('[飞书卡片] 收到交互回调');
  
  try {
    const body = req.body;
    
    // 验证 token
    if (body.token !== config.feishu.verificationToken) {
      console.error('[飞书卡片] Token 验证失败');
      return res.status(400).json({ error: 'Token 验证失败' });
    }
    
    const userId = body.open_id || '';
    const chatId = body.open_chat_id || '';
    
    // 解析 action
    const action = body.action;
    if (action?.value) {
      try {
        const actionData = JSON.parse(action.value);
        console.log('[飞书卡片] Action:', actionData.action);
        
        // ====== 安全确认相关 ======
        if (['approve', 'reject', 'kill_all'].includes(actionData.action)) {
          const result = handleConfirmCallback(actionData);
          return res.json({
            toast: {
              type: result.success ? 'success' : 'warning',
              content: result.message
            }
          });
        }
        
        // ====== 精灵设置相关 ======
        if (actionData.action === 'start_setup') {
          // 开始设置，显示形象选择
          await sendFeishuCard(chatId, createStyleSelectionCard());
          userSetupState.set(userId, { step: 'select_style' });
          return res.json({
            toast: { type: 'success', content: '开始设置精灵~' }
          });
        }
        
        if (actionData.action === 'select_style') {
          // 选择了形象，显示命名界面
          const selectedStyle = actionData.style as SpiritStyle;
          await sendFeishuCard(chatId, createNamingCard(selectedStyle));
          userSetupState.set(userId, { step: 'set_name', selectedStyle });
          return res.json({
            toast: { type: 'success', content: '好眼光！现在给精灵取个名字吧~' }
          });
        }
        
        if (actionData.action === 'set_name') {
          // 使用默认名字
          const name = actionData.name;
          const style = actionData.style as SpiritStyle;
          
          updateSpiritSettings(userId, 'feishu', { spiritName: name, spiritStyle: style });
          
          const persona = getUserSpiritPersona(userId, 'feishu');
          await sendFeishuCard(chatId, createSetupCompleteCard(name, style, persona.emoji));
          
          userSetupState.delete(userId);
          recordUserActivity(userId, 'feishu', 'message');
          
          return res.json({
            toast: { type: 'success', content: `${name}已就绪！` }
          });
        }
        
        if (actionData.action === 'change_style') {
          await sendFeishuCard(chatId, createStyleSelectionCard());
          userSetupState.set(userId, { step: 'select_style' });
          return res.json({});
        }
        
        if (actionData.action === 'change_name') {
          const settings = getOrCreateUserSettings(userId, 'feishu');
          await sendFeishuCard(chatId, createNamingCard(settings.spiritStyle));
          userSetupState.set(userId, { step: 'set_name', selectedStyle: settings.spiritStyle });
          return res.json({});
        }
        
        if (actionData.action === 'change_speech') {
          const speech = actionData.speech;
          updateSpiritSettings(userId, 'feishu', { speechStyle: speech });
          return res.json({
            toast: { type: 'success', content: '说话风格已更新~' }
          });
        }
        
        if (actionData.action === 'open_settings') {
          const settings = getOrCreateUserSettings(userId, 'feishu');
          await sendFeishuCard(chatId, createSettingsCard(
            settings.spiritName,
            settings.spiritStyle,
            settings.speechStyle
          ));
          return res.json({});
        }
        
        if (actionData.action === 'show_stats') {
          const settings = getOrCreateUserSettings(userId, 'feishu');
          await sendFeishuCard(chatId, createStatsCard({
            totalMessages: settings.stats.totalMessages,
            totalTasks: settings.stats.totalTasks,
            memberSince: settings.stats.memberSince,
            quotaUsed: settings.subscription?.quotaUsed,
            quotaLimit: settings.subscription?.quotaLimit
          }));
          return res.json({});
        }
        
        if (actionData.action === 'show_guide') {
          const persona = getUserSpiritPersona(userId, 'feishu');
          await sendFeishuCard(chatId, createGuideCard(persona.name));
          return res.json({});
        }
        
      } catch (parseError) {
        console.error('[飞书卡片] 解析 action 失败:', parseError);
      }
    }
    
    res.json({});
  } catch (error) {
    console.error('[飞书卡片] 处理失败:', error);
    res.status(500).json({ error: '处理失败' });
  }
});

// ============================
// 飞书消息回调处理
// ============================
app.post('/callback/feishu', async (req, res) => {
  console.log('[飞书] 收到回调请求:', JSON.stringify(req.body, null, 2));
  
  try {
    const body = req.body;
    
    // 1. 先解密（如果是加密消息）
    let eventBody = body;
    if (body.encrypt && config.feishu.encryptKey) {
      console.log('[飞书] 解密加密消息...');
      const key = crypto.createHash('sha256').update(config.feishu.encryptKey).digest();
      const encryptedBuffer = Buffer.from(body.encrypt, 'base64');
      const iv = encryptedBuffer.slice(0, 16);
      const encrypted = encryptedBuffer.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      eventBody = JSON.parse(decrypted.toString('utf8'));
      console.log('[飞书] 解密后:', JSON.stringify(eventBody, null, 2));
    }
    
    // 2. URL 验证请求（解密后检查）
    if (eventBody.type === 'url_verification') {
      console.log('[飞书] URL 验证请求');
      if (eventBody.token !== config.feishu.verificationToken) {
        console.error('[飞书] Token 验证失败');
        return res.status(400).json({ error: 'Token 验证失败' });
      }
      console.log('[飞书] 验证成功，返回 challenge');
      return res.json({ challenge: eventBody.challenge });
    }
    
    // 3. 处理事件消息
    const header = eventBody.header;
    const event = eventBody.event;
    
    if (header?.event_type === 'im.message.receive_v1' && event) {
      const message = event.message;
      const sender = event.sender;
      const chatId = message?.chat_id || '';
      
      // 解析消息内容
      let textContent = '';
      try {
        const content = JSON.parse(message?.content || '{}');
        textContent = content.text || '';
      } catch {
        textContent = message?.content || '';
      }
      
      const senderId = sender?.sender_id?.open_id || 'unknown';
      console.log(`[飞书] 收到消息: "${textContent}" 来自用户: ${senderId}`);
      
      // 获取用户设置和人格
      const userSettings = getOrCreateUserSettings(senderId, 'feishu');
      const persona = getUserSpiritPersona(senderId, 'feishu');
      
      // ====== 新用户引导流程 ======
      if (isNewUser(senderId, 'feishu')) {
        // 发送欢迎卡片
        await sendFeishuCard(chatId, createWelcomeCard());
        userSetupState.set(senderId, { step: 'select_style' });
        res.json({ code: 0 });
        return;
      }
      
      // 检查是否在设置流程中（处理名字输入）
      const setupState = userSetupState.get(senderId);
      if (setupState?.step === 'set_name' && !textContent.startsWith('/')) {
        // 用户输入了精灵名字
        const spiritName = textContent.trim().slice(0, 20); // 限制长度
        const style = setupState.selectedStyle || 'cute';
        
        updateSpiritSettings(senderId, 'feishu', { 
          spiritName,
          spiritStyle: style 
        });
        
        const newPersona = getUserSpiritPersona(senderId, 'feishu');
        await sendFeishuCard(chatId, createSetupCompleteCard(spiritName, style, newPersona.emoji));
        
        userSetupState.delete(senderId);
        recordUserActivity(senderId, 'feishu', 'message');
        res.json({ code: 0 });
        return;
      }
      
      // ====== 精灵1号控制指令 ======
      if (textContent === '/stop' || textContent === '/kill' || textContent === '/终止') {
        const result = handleConfirmCallback({ action: 'kill_all', operationId: '' });
        await replyFeishuMessage(message.message_id, result.message);
        res.json({ code: 0 });
        return;
      }
      
      if (textContent === '/resume' || textContent === '/恢复') {
        resumeOperations();
        await replyFeishuMessage(message.message_id, `✅ ${persona.name}已恢复运行 ${persona.emoji}`);
        res.json({ code: 0 });
        return;
      }
      
      if (textContent === '/status' || textContent === '/状态') {
        const pendingOps = getPendingOperations();
        const status = isKillSwitchActive() 
          ? '🛑 已终止' 
          : `✅ 运行中\n待确认操作: ${pendingOps.length}`;
        await replyFeishuMessage(message.message_id, `${persona.name}状态: ${status} ${persona.emoji}`);
        res.json({ code: 0 });
        return;
      }
      
      // ====== 设置和帮助指令 ======
      if (textContent === '/设置' || textContent === '/settings') {
        await sendFeishuCard(chatId, createSettingsCard(
          userSettings.spiritName,
          userSettings.spiritStyle,
          userSettings.speechStyle
        ));
        res.json({ code: 0 });
        return;
      }
      
      if (textContent === '/统计' || textContent === '/stats') {
        await sendFeishuCard(chatId, createStatsCard({
          totalMessages: userSettings.stats.totalMessages,
          totalTasks: userSettings.stats.totalTasks,
          memberSince: userSettings.stats.memberSince,
          quotaUsed: userSettings.subscription?.quotaUsed,
          quotaLimit: userSettings.subscription?.quotaLimit
        }));
        res.json({ code: 0 });
        return;
      }
      
      if (textContent === '/帮助' || textContent === '/help') {
        await sendFeishuCard(chatId, createGuideCard(persona.name));
        res.json({ code: 0 });
        return;
      }
      
      // ====== 检查配额 ======
      const quota = checkQuota(senderId, 'feishu');
      if (!quota.hasQuota) {
        await replyFeishuMessage(message.message_id, 
          `${persona.emoji} ${quota.message}`);
        res.json({ code: 0 });
        return;
      }
      
      // ====== 检查是否被终止 ======
      if (isKillSwitchActive()) {
        await replyFeishuMessage(message.message_id, 
          `🛑 ${persona.name}已被终止，发送 /恢复 来重新启用`);
        res.json({ code: 0 });
        return;
      }
      
      // ====== Moltbot Agent 指令 ======
      if (textContent.startsWith('/agent ') || textContent.startsWith('/molt ')) {
        const raw = textContent.replace(/^\/(agent|molt)\s+/i, '').trim();
        const [maybeName, ...rest] = raw.split(/\s+/);
        const hasExplicitName = textContent.startsWith('/agent ') && rest.length > 0;
        const agentName = hasExplicitName ? maybeName : config.moltbot.defaultAgentName;
        const agentMessage = hasExplicitName ? rest.join(' ') : raw;
        const sessionKey = `feishu:${senderId}:${agentName}`;

        const result = await moltbotBridge.callAgent({
          message: agentMessage,
          name: agentName,
          sessionKey
        });

        const reply = result.ok
          ? `✅ ${persona.name}已派发任务给 ${agentName} ${persona.emoji}\nRunId: ${result.runId || 'N/A'}`
          : `⚠️ 任务派发失败：${result.error || '未知错误'}`;

        await replyFeishuMessage(message.message_id, reply);
        recordUserActivity(senderId, 'feishu', 'task');
        res.json({ code: 0 });
        return;
      }

      // ====== 普通对话 - 调用 AI ======
      console.log('[飞书] 调用 AI 生成回复...');
      const reply = await callAI(textContent, senderId, 'feishu');
      console.log('[飞书] AI 回复:', reply.slice(0, 100) + '...');
      
      await replyFeishuMessage(message.message_id, reply);
      recordUserActivity(senderId, 'feishu', 'message');
      
      // 配额提醒
      if (quota.message) {
        await replyFeishuMessage(message.message_id, `💡 ${quota.message}`);
      }
    }
    
    // 返回成功
    res.json({ code: 0 });
    
  } catch (error) {
    console.error('[飞书] 处理回调失败:', error);
    res.status(500).json({ code: -1, msg: '处理失败' });
  }
});

// ============================
// 飞书回复封装
// ============================
async function replyFeishuMessage(messageId: string, reply: string): Promise<void> {
  try {
        const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: config.feishu.appId,
            app_secret: config.feishu.appSecret
          })
        });
        const tokenData = await tokenRes.json() as { tenant_access_token?: string };
        
        if (tokenData.tenant_access_token) {
      await fetch(`https://open.feishu.cn/open-apis/im/v1/messages/${messageId}/reply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenData.tenant_access_token}`
            },
            body: JSON.stringify({
              msg_type: 'text',
              content: JSON.stringify({ text: reply })
            })
          });
          console.log('[飞书] 已回复消息');
        }
      } catch (replyError) {
        console.error('[飞书] 回复消息失败:', replyError);
      }
    }

// ============================
// 企业微信回调（预留）
// ============================
app.all('/callback/wecom', (req, res) => {
  console.log('[企业微信] 收到回调请求');
  res.json({ code: 0, msg: '企业微信渠道待配置' });
});

// ============================
// 钉钉回调（预留）
// ============================
app.post('/callback/dingtalk', (req, res) => {
  console.log('[钉钉] 收到回调请求');
  res.json({ success: true, msg: '钉钉渠道待配置' });
});

// ============================
// 启动服务
// ============================
app.listen(config.port, '0.0.0.0', () => {
  // 初始化安全执行器
  initSecureExecutor();
  
  // 获取已注册的 AI 服务商
  const providers = modelDispatcher.getRegisteredProviders();
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           ✨ 精灵1号 - Spirit One Gateway v0.3.0             ║
╠══════════════════════════════════════════════════════════════╣
║  端口: ${String(config.port).padEnd(56)}║
║                                                              ║
║  🤖 AI 服务商: ${providers.length > 0 ? providers.join(', ').padEnd(44) : '未配置'.padEnd(44)}║
║  🔌 Moltbot:   ${config.moltbot.gatewayUrl ? '已连接'.padEnd(44) : '未配置'.padEnd(44)}║
║  🔐 安全确认:  ${config.feishu.appId ? '已启用'.padEnd(44) : '未配置'.padEnd(44)}║
║                                                              ║
║  📱 消息回调:                                                 ║
║     飞书消息:   POST /callback/feishu                        ║
║     飞书卡片:   POST /callback/feishu/card                   ║
║     企业微信:   POST /callback/wecom                         ║
║     钉钉:       POST /callback/dingtalk                      ║
║                                                              ║
║  🎮 控制接口:                                                 ║
║     健康检查:   GET  /health                                 ║
║     精灵状态:   GET  /spirit/status                          ║
║     全局统计:   GET  /spirit/stats                           ║
║                                                              ║
║  💬 飞书指令:                                                 ║
║     /设置     打开设置菜单     /帮助     显示使用指南         ║
║     /状态     查询精灵状态     /统计     查看使用统计         ║
║     /终止     紧急停止所有     /恢复     恢复精灵运行         ║
║     /agent    派发 AI 任务                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

  精灵1号已就绪，等待用户召唤... 🌱
  `);
});

// ============================
// 全局统计接口
// ============================
app.get('/spirit/stats', (req, res) => {
  const stats = getStats();
  res.json({
    ...stats,
    aiProviders: modelDispatcher.getRegisteredProviders(),
    moltbotConnected: !!config.moltbot.gatewayUrl
  });
});
