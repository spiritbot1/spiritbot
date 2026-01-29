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
  }
};

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
    
    // 1. URL 验证请求（飞书首次配置时发送）
    if (body.type === 'url_verification') {
      console.log('[飞书] URL 验证请求');
      
      // 验证 token
      if (body.token !== config.feishu.verificationToken) {
        console.error('[飞书] Token 验证失败');
        return res.status(400).json({ error: 'Token 验证失败' });
      }
      
      // 返回 challenge 完成验证
      console.log('[飞书] 验证成功，返回 challenge');
      return res.json({ challenge: body.challenge });
    }
    
    // 2. 处理加密消息
    let eventBody = body;
    if (body.encrypt && config.feishu.encryptKey) {
      console.log('[飞书] 解密加密消息');
      const key = crypto.createHash('sha256').update(config.feishu.encryptKey).digest();
      const encryptedBuffer = Buffer.from(body.encrypt, 'base64');
      const iv = encryptedBuffer.slice(0, 16);
      const encrypted = encryptedBuffer.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      eventBody = JSON.parse(decrypted.toString('utf8'));
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
      
      // TODO: 调用精灵1号处理消息
      // 目前先返回简单回复
      const reply = `[精灵1号] 收到你的消息: ${textContent}`;
      
      // 回复消息（需要 tenant_access_token）
      try {
        // 获取 token
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
          // 回复消息
          await fetch(`https://open.feishu.cn/open-apis/im/v1/messages/${message.message_id}/reply`, {
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
    
    // 返回成功
    res.json({ code: 0 });
    
  } catch (error) {
    console.error('[飞书] 处理回调失败:', error);
    res.status(500).json({ code: -1, msg: '处理失败' });
  }
});

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

