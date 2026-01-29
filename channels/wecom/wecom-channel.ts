/**
 * 企业微信渠道集成
 * WeChat Work (WeCom) Channel for Spirit One
 * 
 * 让精灵1号可以通过企业微信接收和发送消息
 */

import crypto from 'crypto';

export interface WeComConfig {
  // 企业信息
  corpId: string;           // 企业ID
  
  // 应用信息
  agentId: string;          // 应用ID
  secret: string;           // 应用Secret
  
  // 回调配置
  token: string;            // 用于验证回调
  encodingAESKey: string;   // 消息加解密密钥
  
  // 可选配置
  webhookUrl?: string;      // 群机器人 Webhook（如果使用群机器人）
}

export interface WeComMessage {
  msgId: string;
  fromUser: string;         // 发送者企业微信ID
  createTime: number;
  msgType: 'text' | 'image' | 'voice' | 'video' | 'file';
  content: string;
  agentId: string;
}

/**
 * 企业微信渠道类
 */
export class WeComChannel {
  private config: WeComConfig;
  private accessToken: string = '';
  private tokenExpiry: number = 0;
  
  constructor(config: WeComConfig) {
    this.config = config;
  }
  
  /**
   * 获取 Access Token
   */
  async getAccessToken(): Promise<string> {
    // 检查缓存的 token 是否有效
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.config.corpId}&corpsecret=${this.config.secret}`;
    
    const response = await fetch(url);
    const data = await response.json() as { access_token: string; expires_in: number; errcode?: number };
    
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`获取 access_token 失败: ${JSON.stringify(data)}`);
    }
    
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 提前5分钟过期
    
    return this.accessToken;
  }
  
  /**
   * 验证回调 URL（用于企业微信配置时的验证）
   */
  verifyCallback(msgSignature: string, timestamp: string, nonce: string, echostr: string): string {
    // 1. 验证签名
    const sortedStr = [this.config.token, timestamp, nonce, echostr].sort().join('');
    const signature = crypto.createHash('sha1').update(sortedStr).digest('hex');
    
    if (signature !== msgSignature) {
      throw new Error('签名验证失败');
    }
    
    // 2. 解密 echostr
    return this.decryptMessage(echostr);
  }
  
  /**
   * 解密消息
   */
  decryptMessage(encryptedMsg: string): string {
    const aesKey = Buffer.from(this.config.encodingAESKey + '=', 'base64');
    const iv = aesKey.slice(0, 16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    decipher.setAutoPadding(false);
    
    let decrypted = decipher.update(encryptedMsg, 'base64');
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // 去除补位
    const pad = decrypted[decrypted.length - 1];
    const content = decrypted.slice(20, decrypted.length - pad);
    
    // 解析消息长度和内容
    const msgLen = content.readUInt32BE(0);
    const message = content.slice(4, 4 + msgLen).toString('utf8');
    
    return message;
  }
  
  /**
   * 加密消息
   */
  encryptMessage(message: string): string {
    const aesKey = Buffer.from(this.config.encodingAESKey + '=', 'base64');
    const iv = aesKey.slice(0, 16);
    
    // 构建消息体
    const randomBytes = crypto.randomBytes(16);
    const msgLenBuf = Buffer.alloc(4);
    msgLenBuf.writeUInt32BE(Buffer.byteLength(message), 0);
    const corpIdBuf = Buffer.from(this.config.corpId);
    const msgBuf = Buffer.from(message);
    
    let plaintext = Buffer.concat([randomBytes, msgLenBuf, msgBuf, corpIdBuf]);
    
    // PKCS7 补位
    const blockSize = 32;
    const padLen = blockSize - (plaintext.length % blockSize);
    const padBuf = Buffer.alloc(padLen, padLen);
    plaintext = Buffer.concat([plaintext, padBuf]);
    
    // 加密
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    cipher.setAutoPadding(false);
    
    let encrypted = cipher.update(plaintext);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return encrypted.toString('base64');
  }
  
  /**
   * 发送文本消息给用户
   */
  async sendTextMessage(userId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
    
    const payload = {
      touser: userId,
      msgtype: 'text',
      agentid: this.config.agentId,
      text: {
        content: content
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
    
    console.log(`[企业微信] 消息已发送给 ${userId}`);
  }
  
  /**
   * 发送 Markdown 消息
   */
  async sendMarkdownMessage(userId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
    
    const payload = {
      touser: userId,
      msgtype: 'markdown',
      agentid: this.config.agentId,
      markdown: {
        content: content
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
  }
  
  /**
   * 通过群机器人 Webhook 发送消息
   */
  async sendWebhookMessage(content: string, mentionedList?: string[]): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('未配置群机器人 Webhook');
    }
    
    const payload: Record<string, unknown> = {
      msgtype: 'text',
      text: {
        content: content,
        mentioned_list: mentionedList || []
      }
    };
    
    const response = await fetch(this.config.webhookUrl, {
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
   * 解析回调消息
   */
  parseCallbackMessage(encryptedXml: string): WeComMessage {
    const decrypted = this.decryptMessage(encryptedXml);
    
    // 解析 XML（简化版，实际应使用 XML 解析库）
    const getMsgValue = (xml: string, tag: string): string => {
      const match = xml.match(new RegExp(`<${tag}><\\!\\[CDATA\\[(.+?)\\]\\]></${tag}>`));
      return match ? match[1] : '';
    };
    
    return {
      msgId: getMsgValue(decrypted, 'MsgId'),
      fromUser: getMsgValue(decrypted, 'FromUserName'),
      createTime: parseInt(getMsgValue(decrypted, 'CreateTime')) || Date.now(),
      msgType: getMsgValue(decrypted, 'MsgType') as WeComMessage['msgType'],
      content: getMsgValue(decrypted, 'Content'),
      agentId: getMsgValue(decrypted, 'AgentID')
    };
  }
}

/**
 * 创建企业微信渠道回调服务器
 */
export function createWeComCallbackServer(channel: WeComChannel, onMessage: (msg: WeComMessage) => Promise<string>) {
  return {
    // GET 请求用于验证
    handleVerify: (query: { msg_signature: string; timestamp: string; nonce: string; echostr: string }) => {
      return channel.verifyCallback(query.msg_signature, query.timestamp, query.nonce, query.echostr);
    },
    
    // POST 请求用于接收消息
    handleMessage: async (query: { msg_signature: string; timestamp: string; nonce: string }, body: { Encrypt: string }) => {
      const message = channel.parseCallbackMessage(body.Encrypt);
      console.log(`[企业微信] 收到消息: ${message.content} (来自 ${message.fromUser})`);
      
      // 调用精灵1号处理消息
      const reply = await onMessage(message);
      
      // 发送回复
      await channel.sendTextMessage(message.fromUser, reply);
      
      return 'success';
    }
  };
}

// 导出默认配置模板
export const wecomConfigTemplate: WeComConfig = {
  corpId: 'YOUR_CORP_ID',
  agentId: 'YOUR_AGENT_ID',
  secret: 'YOUR_SECRET',
  token: 'YOUR_TOKEN',
  encodingAESKey: 'YOUR_ENCODING_AES_KEY',
  webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY'
};

