/**
 * Spirit One 统一网关服务器
 * 接收来自企业微信、钉钉、飞书的消息，转发给精灵1号处理
 */

import express from 'express';
import { WeComChannel, createWeComCallbackServer, type WeComConfig, type WeComMessage } from './wecom/wecom-channel';
import { DingTalkChannel, createDingTalkCallbackHandler, type DingTalkConfig, type DingTalkMessage } from './dingtalk/dingtalk-channel';
import { FeishuChannel, createFeishuEventHandler, type FeishuConfig, type FeishuMessage } from './feishu/feishu-channel';

export interface GatewayConfig {
  port: number;
  
  // 各平台配置（可选，配置哪个启用哪个）
  wecom?: WeComConfig;
  dingtalk?: DingTalkConfig;
  feishu?: FeishuConfig;
  
  // 精灵1号回调
  onMessage: (platform: 'wecom' | 'dingtalk' | 'feishu', message: string, context: Record<string, unknown>) => Promise<string>;
}

/**
 * 创建统一网关服务器
 */
export function createGatewayServer(config: GatewayConfig) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // ============================
  // 企业微信回调
  // ============================
  if (config.wecom) {
    const wecomChannel = new WeComChannel(config.wecom);
    const wecomHandler = createWeComCallbackServer(wecomChannel, async (msg: WeComMessage) => {
      return await config.onMessage('wecom', msg.content, {
        userId: msg.fromUser,
        msgId: msg.msgId,
        msgType: msg.msgType
      });
    });
    
    // GET - 验证回调 URL
    app.get('/callback/wecom', (req, res) => {
      try {
        const result = wecomHandler.handleVerify(req.query as {
          msg_signature: string;
          timestamp: string;
          nonce: string;
          echostr: string;
        });
        res.send(result);
      } catch (error) {
        console.error('[企业微信] 验证失败:', error);
        res.status(400).send('验证失败');
      }
    });
    
    // POST - 接收消息
    app.post('/callback/wecom', async (req, res) => {
      try {
        const result = await wecomHandler.handleMessage(
          req.query as { msg_signature: string; timestamp: string; nonce: string },
          req.body
        );
        res.send(result);
      } catch (error) {
        console.error('[企业微信] 处理消息失败:', error);
        res.status(500).send('处理失败');
      }
    });
    
    console.log('✅ 企业微信渠道已启用: /callback/wecom');
  }
  
  // ============================
  // 钉钉回调
  // ============================
  if (config.dingtalk) {
    const dingtalkChannel = new DingTalkChannel(config.dingtalk);
    const dingtalkHandler = createDingTalkCallbackHandler(dingtalkChannel, async (msg: DingTalkMessage, sessionWebhook: string) => {
      return await config.onMessage('dingtalk', msg.content, {
        userId: msg.senderId,
        userNick: msg.senderNick,
        conversationType: msg.conversationType,
        conversationId: msg.conversationId,
        sessionWebhook
      });
    });
    
    app.post('/callback/dingtalk', async (req, res) => {
      try {
        const result = await dingtalkHandler(req.body);
        res.json(result);
      } catch (error) {
        console.error('[钉钉] 处理消息失败:', error);
        res.status(500).json({ success: false, error: '处理失败' });
      }
    });
    
    console.log('✅ 钉钉渠道已启用: /callback/dingtalk');
  }
  
  // ============================
  // 飞书回调
  // ============================
  if (config.feishu) {
    const feishuChannel = new FeishuChannel(config.feishu);
    const feishuHandler = createFeishuEventHandler(feishuChannel, async (msg: FeishuMessage) => {
      // 解析消息内容
      let textContent = '';
      try {
        const content = JSON.parse(msg.content);
        textContent = content.text || '';
      } catch {
        textContent = msg.content;
      }
      
      return await config.onMessage('feishu', textContent, {
        userId: msg.senderId,
        chatId: msg.chatId,
        chatType: msg.chatType,
        messageId: msg.messageId
      });
    });
    
    app.post('/callback/feishu', async (req, res) => {
      try {
        const result = await feishuHandler(req.body);
        res.json(result);
      } catch (error) {
        console.error('[飞书] 处理消息失败:', error);
        res.status(500).json({ code: -1, msg: '处理失败' });
      }
    });
    
    console.log('✅ 飞书渠道已启用: /callback/feishu');
  }
  
  // ============================
  // 健康检查
  // ============================
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      channels: {
        wecom: !!config.wecom,
        dingtalk: !!config.dingtalk,
        feishu: !!config.feishu
      },
      timestamp: new Date().toISOString()
    });
  });
  
  // 启动服务器
  const server = app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🧠 精灵1号 - 统一消息网关                            ║
╠══════════════════════════════════════════════════════════════╣
║  端口: ${config.port}                                              ║
║                                                              ║
║  回调地址:                                                    ║
║  - 企业微信: http://your-domain:${config.port}/callback/wecom       ║
║  - 钉钉:     http://your-domain:${config.port}/callback/dingtalk    ║
║  - 飞书:     http://your-domain:${config.port}/callback/feishu      ║
║                                                              ║
║  健康检查: http://localhost:${config.port}/health                   ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
  
  return { app, server };
}

// 示例：如何启动网关
export const exampleUsage = `
// 启动精灵1号统一网关

import { createGatewayServer } from './gateway-server';

const gateway = createGatewayServer({
  port: 8080,
  
  // 企业微信配置
  wecom: {
    corpId: 'YOUR_CORP_ID',
    agentId: 'YOUR_AGENT_ID',
    secret: 'YOUR_SECRET',
    token: 'YOUR_TOKEN',
    encodingAESKey: 'YOUR_ENCODING_AES_KEY'
  },
  
  // 钉钉配置
  dingtalk: {
    appKey: 'YOUR_APP_KEY',
    appSecret: 'YOUR_APP_SECRET',
    webhookUrl: 'YOUR_WEBHOOK_URL',
    webhookSecret: 'YOUR_WEBHOOK_SECRET'
  },
  
  // 飞书配置
  feishu: {
    appId: 'YOUR_APP_ID',
    appSecret: 'YOUR_APP_SECRET',
    verificationToken: 'YOUR_VERIFICATION_TOKEN',
    encryptKey: 'YOUR_ENCRYPT_KEY'
  },
  
  // 精灵1号消息处理
  onMessage: async (platform, message, context) => {
    console.log(\`[\${platform}] 收到消息: \${message}\`);
    
    // 调用 Moltbot Agent 处理消息
    // const result = await moltbotAgent.chat(message);
    
    return \`[精灵1号] 收到你的消息: \${message}\`;
  }
});
`;

