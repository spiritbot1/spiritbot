/**
 * 精灵1号 - 统一网关服务启动入口
 * Spirit One Gateway Service Entry Point
 */

import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ============================
// 调用硅基流动 AI
// ============================
async function callAI(message: string): Promise<string> {
  if (!config.ai.apiKey) {
    return '[精灵1号] AI 服务未配置';
  }
  
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: '你是精灵1号，一个友好、智能的AI助手，是用户的数字生命伴侣。你的回复要简洁、有帮助、有温度。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500
      })
    });
    
    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    } else if (data.error) {
      console.error('[AI] 错误:', data.error);
      return `[精灵1号] AI 服务暂时不可用`;
    }
    
    return '[精灵1号] AI 返回异常';
  } catch (error) {
    console.error('[AI] 调用失败:', error);
    return '[精灵1号] AI 服务连接失败';
  }
}

// ============================
// 调用 Moltbot Gateway Hook
// ============================
type MoltbotAgentResult = {
  ok: boolean;
  runId?: string;
  error?: string;
};

async function callMoltbotAgent(params: {
  message: string;
  name?: string;
  sessionKey?: string;
}): Promise<MoltbotAgentResult> {
  if (!config.moltbot.gatewayUrl || !config.moltbot.hookToken) {
    return { ok: false, error: 'Moltbot 未配置' };
  }

  const base = config.moltbot.gatewayUrl.replace(/\/+$/, '');
  const path = config.moltbot.hookPath.startsWith('/')
    ? config.moltbot.hookPath
    : `/${config.moltbot.hookPath}`;
  const url = `${base}${path}/agent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.moltbot.hookToken}`
      },
      body: JSON.stringify({
        message: params.message,
        name: params.name || config.moltbot.defaultAgentName,
        sessionKey: params.sessionKey,
        channel: config.moltbot.defaultChannel,
        wakeMode: 'now',
        deliver: true
      })
    });

    const data = await response.json() as { ok?: boolean; runId?: string; error?: string };
    if (response.ok && data.ok) {
      return { ok: true, runId: data.runId };
    }
    return { ok: false, error: data.error || `HTTP ${response.status}` };
  } catch (error) {
    console.error('[Moltbot] 调用失败:', error);
    return { ok: false, error: 'Moltbot 连接失败' };
  }
}

// ============================
// 健康检查
// ============================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'spirit-fusion-gateway',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// ============================
// 飞书回调处理
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
      
      // 解析消息内容
      let textContent = '';
      try {
        const content = JSON.parse(message?.content || '{}');
        textContent = content.text || '';
      } catch {
        textContent = message?.content || '';
      }
      
      console.log(`[飞书] 收到消息: "${textContent}" 来自用户: ${sender?.sender_id?.open_id}`);
      
      // === Moltbot 指令 ===
      const senderId = sender?.sender_id?.open_id || 'unknown';
      if (textContent.startsWith('/agent ') || textContent.startsWith('/molt ')) {
        const raw = textContent.replace(/^\/(agent|molt)\s+/i, '').trim();
        const [maybeName, ...rest] = raw.split(/\s+/);
        const hasExplicitName = textContent.startsWith('/agent ') && rest.length > 0;
        const agentName = hasExplicitName ? maybeName : config.moltbot.defaultAgentName;
        const agentMessage = hasExplicitName ? rest.join(' ') : raw;
        const sessionKey = `feishu:${senderId}:${agentName}`;

        const result = await callMoltbotAgent({
          message: agentMessage,
          name: agentName,
          sessionKey
        });

        const reply = result.ok
          ? `✅ 已派发给 Moltbot Agent: ${agentName}\nRunId: ${result.runId || 'N/A'}`
          : `⚠️ Moltbot 调用失败：${result.error || '未知错误'}`;

        await replyFeishuMessage(message.message_id, reply);
        res.json({ code: 0 });
        return;
      }

      // 调用 AI 生成回复
      console.log('[飞书] 调用 AI 生成回复...');
      const reply = await callAI(textContent);
      console.log('[飞书] AI 回复:', reply);
      
      await replyFeishuMessage(message.message_id, reply);
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
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🧠 精灵1号 - 统一消息网关                            ║
╠══════════════════════════════════════════════════════════════╣
║  端口: ${config.port}                                              ║
║                                                              ║
║  回调地址:                                                    ║
║  - 飞书:     /callback/feishu                                ║
║  - 企业微信: /callback/wecom                                  ║
║  - 钉钉:     /callback/dingtalk                              ║
║                                                              ║
║  健康检查: /health                                            ║
║                                                              ║
║  飞书 App ID: ${config.feishu.appId || '未配置'}
╚══════════════════════════════════════════════════════════════╝
  `);
});

