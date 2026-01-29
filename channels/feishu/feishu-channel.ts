/**
 * 飞书渠道集成
 * Feishu/Lark Channel for Spirit One
 * 
 * 让精灵1号可以通过飞书接收和发送消息
 */

import crypto from 'crypto';

export interface FeishuConfig {
  // 应用信息
  appId: string;            // App ID
  appSecret: string;        // App Secret
  
  // 事件订阅配置
  verificationToken: string;   // 验证 Token
  encryptKey?: string;         // 加密密钥（可选）
  
  // 机器人配置
  webhookUrl?: string;      // 群机器人 Webhook URL
  webhookSecret?: string;   // 签名密钥
}

export interface FeishuMessage {
  messageId: string;
  rootId?: string;          // 根消息ID（回复场景）
  parentId?: string;        // 父消息ID
  chatId: string;           // 会话ID
  chatType: 'p2p' | 'group'; // 单聊/群聊
  messageType: 'text' | 'post' | 'image' | 'file' | 'audio' | 'media' | 'sticker';
  content: string;          // 消息内容（JSON 字符串）
  senderId: string;         // 发送者 open_id
  senderType: 'user' | 'app';
  createTime: string;
  mentions?: Array<{
    key: string;
    id: { open_id: string };
    name: string;
  }>;
}

/**
 * 飞书渠道类
 */
export class FeishuChannel {
  private config: FeishuConfig;
  private tenantAccessToken: string = '';
  private tokenExpiry: number = 0;
  
  constructor(config: FeishuConfig) {
    this.config = config;
  }
  
  /**
   * 获取 Tenant Access Token
   */
  async getTenantAccessToken(): Promise<string> {
    if (this.tenantAccessToken && Date.now() < this.tokenExpiry) {
      return this.tenantAccessToken;
    }
    
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.config.appId,
        app_secret: this.config.appSecret
      })
    });
    
    const data = await response.json() as {
      code: number;
      msg: string;
      tenant_access_token: string;
      expire: number;
    };
    
    if (data.code !== 0) {
      throw new Error(`获取 tenant_access_token 失败: ${data.msg}`);
    }
    
    this.tenantAccessToken = data.tenant_access_token;
    this.tokenExpiry = Date.now() + (data.expire - 300) * 1000;
    
    return this.tenantAccessToken;
  }
  
  /**
   * 验证事件回调
   */
  verifyCallback(body: { challenge?: string; token?: string; type?: string }): string | null {
    // URL 验证请求
    if (body.type === 'url_verification' && body.challenge) {
      if (body.token === this.config.verificationToken) {
        return body.challenge;
      }
      throw new Error('Token 验证失败');
    }
    return null;
  }
  
  /**
   * 解密消息（如果配置了加密）
   */
  decryptMessage(encrypt: string): string {
    if (!this.config.encryptKey) {
      throw new Error('未配置 encryptKey');
    }
    
    const key = crypto.createHash('sha256').update(this.config.encryptKey).digest();
    const encryptedBuffer = Buffer.from(encrypt, 'base64');
    
    const iv = encryptedBuffer.slice(0, 16);
    const encrypted = encryptedBuffer.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }
  
  /**
   * 生成 Webhook 签名
   */
  generateWebhookSign(timestamp: number): string {
    if (!this.config.webhookSecret) {
      return '';
    }
    
    const stringToSign = `${timestamp}\n${this.config.webhookSecret}`;
    const hmac = crypto.createHmac('sha256', '');
    hmac.update(Buffer.from(stringToSign));
    return hmac.digest('base64');
  }
  
  /**
   * 通过 Webhook 发送文本消息
   */
  async sendWebhookText(text: string): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置 Webhook URL');
    }
    
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    const payload: Record<string, unknown> = {
      msg_type: 'text',
      content: {
        text: text
      }
    };
    
    // 添加签名
    if (this.config.webhookSecret) {
      const stringToSign = `${timestamp}\n${this.config.webhookSecret}`;
      const sign = crypto.createHmac('sha256', Buffer.from(stringToSign)).digest('base64');
      payload.timestamp = timestamp;
      payload.sign = sign;
    }
    
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { code?: number; msg?: string };
    
    if (result.code && result.code !== 0) {
      throw new Error(`Webhook 发送失败: ${result.msg}`);
    }
    
    console.log('[飞书] Webhook 消息已发送');
  }
  
  /**
   * 通过 Webhook 发送富文本消息
   */
  async sendWebhookPost(title: string, content: Array<Array<{ tag: string; text?: string; href?: string }>>): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置 Webhook URL');
    }
    
    const payload = {
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: title,
            content: content
          }
        }
      }
    };
    
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { code?: number; msg?: string };
    
    if (result.code && result.code !== 0) {
      throw new Error(`Webhook 发送失败: ${result.msg}`);
    }
  }
  
  /**
   * 通过 Webhook 发送卡片消息
   */
  async sendWebhookCard(card: Record<string, unknown>): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置 Webhook URL');
    }
    
    const payload = {
      msg_type: 'interactive',
      card: card
    };
    
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { code?: number; msg?: string };
    
    if (result.code && result.code !== 0) {
      throw new Error(`Webhook 发送失败: ${result.msg}`);
    }
  }
  
  /**
   * 通过 API 发送消息
   */
  async sendMessage(receiveId: string, receiveIdType: 'open_id' | 'user_id' | 'chat_id', content: string, msgType: string = 'text'): Promise<void> {
    const token = await this.getTenantAccessToken();
    
    const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`;
    
    const payload = {
      receive_id: receiveId,
      msg_type: msgType,
      content: content
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { code?: number; msg?: string };
    
    if (result.code && result.code !== 0) {
      throw new Error(`发送消息失败: ${result.msg}`);
    }
    
    console.log(`[飞书] 消息已发送给 ${receiveId}`);
  }
  
  /**
   * 回复消息
   */
  async replyMessage(messageId: string, content: string, msgType: string = 'text'): Promise<void> {
    const token = await this.getTenantAccessToken();
    
    const url = `https://open.feishu.cn/open-apis/im/v1/messages/${messageId}/reply`;
    
    const payload = {
      msg_type: msgType,
      content: content
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { code?: number; msg?: string };
    
    if (result.code && result.code !== 0) {
      throw new Error(`回复消息失败: ${result.msg}`);
    }
  }
  
  /**
   * 解析事件消息
   */
  parseEventMessage(event: Record<string, unknown>): FeishuMessage | null {
    const message = event.message as Record<string, unknown> | undefined;
    if (!message) return null;
    
    const sender = event.sender as Record<string, unknown> | undefined;
    
    return {
      messageId: message.message_id as string || '',
      rootId: message.root_id as string,
      parentId: message.parent_id as string,
      chatId: message.chat_id as string || '',
      chatType: message.chat_type as 'p2p' | 'group' || 'p2p',
      messageType: message.message_type as FeishuMessage['messageType'] || 'text',
      content: message.content as string || '',
      senderId: (sender?.sender_id as Record<string, string>)?.open_id || '',
      senderType: sender?.sender_type as 'user' | 'app' || 'user',
      createTime: message.create_time as string || '',
      mentions: message.mentions as FeishuMessage['mentions']
    };
  }
}

/**
 * 创建飞书事件回调处理器
 */
export function createFeishuEventHandler(
  channel: FeishuChannel,
  onMessage: (msg: FeishuMessage) => Promise<string>
) {
  return async (body: Record<string, unknown>) => {
    // 1. 先解密消息（如果加密）- 必须先解密才能验证 challenge
    let eventBody = body;
    if (body.encrypt) {
      console.log('[飞书] 解密加密消息...');
      const decrypted = channel.decryptMessage(body.encrypt as string);
      console.log('[飞书] 解密结果:', decrypted);
      eventBody = JSON.parse(decrypted);
    }
    
    // 2. 处理 URL 验证（解密后）
    const challenge = channel.verifyCallback(eventBody as { challenge?: string; token?: string; type?: string });
    if (challenge) {
      console.log('[飞书] URL 验证成功，返回 challenge');
      return { challenge };
    }
    
    // 3. 处理事件
    const header = eventBody.header as Record<string, unknown> | undefined;
    const event = eventBody.event as Record<string, unknown> | undefined;
    
    if (header?.event_type === 'im.message.receive_v1' && event) {
      const message = channel.parseEventMessage(event);
      
      if (message) {
        // 解析消息内容
        let textContent = '';
        try {
          const content = JSON.parse(message.content);
          textContent = content.text || '';
        } catch {
          textContent = message.content;
        }
        
        console.log(`[飞书] 收到消息: ${textContent} (来自 ${message.senderId})`);
        
        // 调用精灵1号处理消息
        const reply = await onMessage(message);
        
        // 回复消息
        const replyContent = JSON.stringify({ text: reply });
        await channel.replyMessage(message.messageId, replyContent, 'text');
      }
    }
    
    return { code: 0 };
  };
}

// 导出默认配置模板
export const feishuConfigTemplate: FeishuConfig = {
  appId: 'YOUR_APP_ID',
  appSecret: 'YOUR_APP_SECRET',
  verificationToken: 'YOUR_VERIFICATION_TOKEN',
  encryptKey: 'YOUR_ENCRYPT_KEY',
  webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_HOOK_ID',
  webhookSecret: 'YOUR_WEBHOOK_SECRET'
};

