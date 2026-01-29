/**
 * 钉钉渠道集成
 * DingTalk Channel for Spirit One
 * 
 * 让精灵1号可以通过钉钉接收和发送消息
 */

import crypto from 'crypto';

export interface DingTalkConfig {
  // 应用信息
  appKey: string;           // AppKey
  appSecret: string;        // AppSecret
  
  // 机器人配置
  robotCode?: string;       // 企业内部机器人 Code
  webhookUrl?: string;      // 群机器人 Webhook URL
  webhookSecret?: string;   // 群机器人签名密钥
  
  // 可选配置
  coolAppCode?: string;     // 酷应用 Code
}

export interface DingTalkMessage {
  msgId: string;
  senderId: string;         // 发送者的钉钉ID
  senderNick: string;       // 发送者昵称
  conversationType: '1' | '2';  // 1=单聊, 2=群聊
  conversationId: string;   // 会话ID
  content: string;          // 消息内容
  msgType: 'text' | 'richText' | 'picture' | 'audio' | 'video' | 'file';
  createAt: number;
  // 群聊相关
  isInAtList?: boolean;     // 是否被@
  chatbotCorpId?: string;
  chatbotUserId?: string;
}

/**
 * 钉钉渠道类
 */
export class DingTalkChannel {
  private config: DingTalkConfig;
  private accessToken: string = '';
  private tokenExpiry: number = 0;
  
  constructor(config: DingTalkConfig) {
    this.config = config;
  }
  
  /**
   * 获取 Access Token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    
    const url = 'https://oapi.dingtalk.com/gettoken';
    const params = new URLSearchParams({
      appkey: this.config.appKey,
      appsecret: this.config.appSecret
    });
    
    const response = await fetch(`${url}?${params}`);
    const data = await response.json() as { 
      access_token: string; 
      expires_in: number; 
      errcode?: number;
      errmsg?: string;
    };
    
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`获取 access_token 失败: ${data.errmsg}`);
    }
    
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    
    return this.accessToken;
  }
  
  /**
   * 生成 Webhook 签名
   */
  generateWebhookSign(timestamp: number): string {
    if (!this.config.webhookSecret) {
      return '';
    }
    
    const stringToSign = `${timestamp}\n${this.config.webhookSecret}`;
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    hmac.update(stringToSign);
    return encodeURIComponent(hmac.digest('base64'));
  }
  
  /**
   * 通过 Webhook 发送文本消息
   */
  async sendWebhookText(content: string, atMobiles?: string[], atAll?: boolean): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置 Webhook URL');
    }
    
    let url = this.config.webhookUrl;
    
    // 添加签名
    if (this.config.webhookSecret) {
      const timestamp = Date.now();
      const sign = this.generateWebhookSign(timestamp);
      url += `&timestamp=${timestamp}&sign=${sign}`;
    }
    
    const payload = {
      msgtype: 'text',
      text: {
        content: content
      },
      at: {
        atMobiles: atMobiles || [],
        isAtAll: atAll || false
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { errcode?: number; errmsg?: string };
    
    if (result.errcode && result.errcode !== 0) {
      throw new Error(`Webhook 发送失败: ${result.errmsg}`);
    }
    
    console.log('[钉钉] Webhook 消息已发送');
  }
  
  /**
   * 通过 Webhook 发送 Markdown 消息
   */
  async sendWebhookMarkdown(title: string, text: string, atMobiles?: string[]): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置 Webhook URL');
    }
    
    let url = this.config.webhookUrl;
    
    if (this.config.webhookSecret) {
      const timestamp = Date.now();
      const sign = this.generateWebhookSign(timestamp);
      url += `&timestamp=${timestamp}&sign=${sign}`;
    }
    
    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: title,
        text: text
      },
      at: {
        atMobiles: atMobiles || [],
        isAtAll: false
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { errcode?: number; errmsg?: string };
    
    if (result.errcode && result.errcode !== 0) {
      throw new Error(`Webhook 发送失败: ${result.errmsg}`);
    }
  }
  
  /**
   * 通过 Webhook 发送 ActionCard 消息
   */
  async sendWebhookActionCard(
    title: string, 
    text: string, 
    buttons: Array<{ title: string; actionURL: string }>
  ): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置 Webhook URL');
    }
    
    let url = this.config.webhookUrl;
    
    if (this.config.webhookSecret) {
      const timestamp = Date.now();
      const sign = this.generateWebhookSign(timestamp);
      url += `&timestamp=${timestamp}&sign=${sign}`;
    }
    
    const payload = {
      msgtype: 'actionCard',
      actionCard: {
        title: title,
        text: text,
        btnOrientation: '0',
        btns: buttons
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { errcode?: number; errmsg?: string };
    
    if (result.errcode && result.errcode !== 0) {
      throw new Error(`Webhook 发送失败: ${result.errmsg}`);
    }
  }
  
  /**
   * 通过企业内部应用发送消息
   */
  async sendCorpMessage(userId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();
    
    const url = `https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${token}`;
    
    const payload = {
      agent_id: this.config.robotCode,
      userid_list: userId,
      msg: {
        msgtype: 'text',
        text: {
          content: content
        }
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { errcode?: number; errmsg?: string };
    
    if (result.errcode && result.errcode !== 0) {
      throw new Error(`发送消息失败: ${result.errmsg}`);
    }
    
    console.log(`[钉钉] 消息已发送给 ${userId}`);
  }
  
  /**
   * 回复机器人消息（Stream 模式）
   */
  async replyMessage(
    sessionWebhook: string, 
    content: string
  ): Promise<void> {
    const payload = {
      msgtype: 'text',
      text: {
        content: content
      }
    };
    
    const response = await fetch(sessionWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json() as { errcode?: number; errmsg?: string };
    
    if (result.errcode && result.errcode !== 0) {
      throw new Error(`回复消息失败: ${result.errmsg}`);
    }
  }
  
  /**
   * 解析回调消息
   */
  parseCallbackMessage(body: Record<string, unknown>): DingTalkMessage {
    return {
      msgId: body.msgId as string || '',
      senderId: body.senderStaffId as string || body.senderId as string || '',
      senderNick: body.senderNick as string || '',
      conversationType: body.conversationType as '1' | '2' || '1',
      conversationId: body.conversationId as string || '',
      content: (body.text as { content?: string })?.content || '',
      msgType: body.msgtype as DingTalkMessage['msgType'] || 'text',
      createAt: body.createAt as number || Date.now(),
      isInAtList: body.isInAtList as boolean,
      chatbotCorpId: body.chatbotCorpId as string,
      chatbotUserId: body.chatbotUserId as string
    };
  }
}

/**
 * 创建钉钉机器人回调处理器
 */
export function createDingTalkCallbackHandler(
  channel: DingTalkChannel, 
  onMessage: (msg: DingTalkMessage, sessionWebhook: string) => Promise<string>
) {
  return async (body: Record<string, unknown>) => {
    const message = channel.parseCallbackMessage(body);
    const sessionWebhook = body.sessionWebhook as string;
    
    console.log(`[钉钉] 收到消息: ${message.content} (来自 ${message.senderNick})`);
    
    // 调用精灵1号处理消息
    const reply = await onMessage(message, sessionWebhook);
    
    // 通过 sessionWebhook 回复
    if (sessionWebhook) {
      await channel.replyMessage(sessionWebhook, reply);
    }
    
    return { success: true };
  };
}

// 导出默认配置模板
export const dingtalkConfigTemplate: DingTalkConfig = {
  appKey: 'YOUR_APP_KEY',
  appSecret: 'YOUR_APP_SECRET',
  robotCode: 'YOUR_ROBOT_CODE',
  webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN',
  webhookSecret: 'YOUR_WEBHOOK_SECRET'
};

