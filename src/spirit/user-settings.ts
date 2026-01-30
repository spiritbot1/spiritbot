/**
 * 用户设置管理
 * User Settings Manager
 * 
 * 存储和管理每个用户的精灵设置
 */

import { 
  SpiritPersona, 
  SpiritStyle, 
  SpeechStyle, 
  createSpiritPersona,
  getDefaultPersona 
} from './spirit-persona';

// 用户设置
export interface UserSettings {
  userId: string;           // 用户 ID（飞书 open_id 等）
  channel: string;          // 来源渠道
  
  // 精灵设置
  spiritName: string;       // 精灵名字
  spiritStyle: SpiritStyle; // 精灵形象
  speechStyle: SpeechStyle; // 说话风格
  
  // API Key 设置（可选，用户自带）
  customApiKeys?: {
    provider: string;       // openai, anthropic, deepseek, siliconflow...
    apiKey: string;         // 加密存储
    models?: string[];      // 可用模型列表
  }[];
  
  // 偏好设置
  preferences: {
    confirmSensitiveOps: boolean;  // 敏感操作是否确认
    confirmTimeout: number;         // 确认超时（秒）
    language: 'zh' | 'en';          // 界面语言
    timezone: string;               // 时区
  };
  
  // 统计数据
  stats: {
    totalMessages: number;
    totalTasks: number;
    memberSince: Date;
    lastActive: Date;
  };
  
  // 订阅信息
  subscription?: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    expiresAt?: Date;
    quotaUsed: number;
    quotaLimit: number;
  };
}

// 内存存储（生产环境应该用数据库）
const userSettingsStore = new Map<string, UserSettings>();

/**
 * 获取用户设置
 */
export function getUserSettings(userId: string, channel: string = 'feishu'): UserSettings | null {
  const key = `${channel}:${userId}`;
  return userSettingsStore.get(key) || null;
}

/**
 * 创建默认用户设置
 */
export function createDefaultSettings(userId: string, channel: string = 'feishu'): UserSettings {
  const now = new Date();
  
  return {
    userId,
    channel,
    spiritName: '小精灵',
    spiritStyle: 'cute',
    speechStyle: 'lively',
    preferences: {
      confirmSensitiveOps: true,
      confirmTimeout: 60,
      language: 'zh',
      timezone: 'Asia/Shanghai'
    },
    stats: {
      totalMessages: 0,
      totalTasks: 0,
      memberSince: now,
      lastActive: now
    },
    subscription: {
      plan: 'free',
      quotaUsed: 0,
      quotaLimit: 100  // 免费用户每日 100 次
    }
  };
}

/**
 * 保存用户设置
 */
export function saveUserSettings(settings: UserSettings): void {
  const key = `${settings.channel}:${settings.userId}`;
  userSettingsStore.set(key, settings);
  
  // TODO: 持久化到数据库
  console.log(`[用户设置] 已保存: ${key}`);
}

/**
 * 获取或创建用户设置
 */
export function getOrCreateUserSettings(userId: string, channel: string = 'feishu'): UserSettings {
  let settings = getUserSettings(userId, channel);
  
  if (!settings) {
    settings = createDefaultSettings(userId, channel);
    saveUserSettings(settings);
    console.log(`[用户设置] 新用户: ${userId} (${channel})`);
  }
  
  return settings;
}

/**
 * 更新精灵设置
 */
export function updateSpiritSettings(
  userId: string, 
  channel: string,
  updates: {
    spiritName?: string;
    spiritStyle?: SpiritStyle;
    speechStyle?: SpeechStyle;
  }
): UserSettings {
  const settings = getOrCreateUserSettings(userId, channel);
  
  if (updates.spiritName !== undefined) {
    settings.spiritName = updates.spiritName;
  }
  if (updates.spiritStyle !== undefined) {
    settings.spiritStyle = updates.spiritStyle;
  }
  if (updates.speechStyle !== undefined) {
    settings.speechStyle = updates.speechStyle;
  }
  
  saveUserSettings(settings);
  return settings;
}

/**
 * 获取用户的精灵人格
 */
export function getUserSpiritPersona(userId: string, channel: string = 'feishu'): SpiritPersona {
  const settings = getUserSettings(userId, channel);
  
  if (!settings) {
    return getDefaultPersona();
  }
  
  return createSpiritPersona(
    settings.spiritName,
    settings.spiritStyle,
    settings.speechStyle
  );
}

/**
 * 记录用户活动
 */
export function recordUserActivity(
  userId: string, 
  channel: string, 
  type: 'message' | 'task'
): void {
  const settings = getOrCreateUserSettings(userId, channel);
  
  settings.stats.lastActive = new Date();
  
  if (type === 'message') {
    settings.stats.totalMessages++;
  } else {
    settings.stats.totalTasks++;
  }
  
  // 更新配额
  if (settings.subscription) {
    settings.subscription.quotaUsed++;
  }
  
  saveUserSettings(settings);
}

/**
 * 检查配额
 */
export function checkQuota(userId: string, channel: string = 'feishu'): {
  hasQuota: boolean;
  remaining: number;
  message?: string;
} {
  const settings = getOrCreateUserSettings(userId, channel);
  
  if (!settings.subscription) {
    return { hasQuota: true, remaining: Infinity };
  }
  
  const remaining = settings.subscription.quotaLimit - settings.subscription.quotaUsed;
  
  if (remaining <= 0) {
    return {
      hasQuota: false,
      remaining: 0,
      message: '今日配额已用完，请明天再来，或升级到付费计划~'
    };
  }
  
  if (remaining <= 10) {
    return {
      hasQuota: true,
      remaining,
      message: `提示：今日剩余配额 ${remaining} 次`
    };
  }
  
  return { hasQuota: true, remaining };
}

/**
 * 添加用户 API Key
 */
export function addUserApiKey(
  userId: string,
  channel: string,
  provider: string,
  apiKey: string,
  models?: string[]
): void {
  const settings = getOrCreateUserSettings(userId, channel);
  
  if (!settings.customApiKeys) {
    settings.customApiKeys = [];
  }
  
  // 检查是否已存在该 provider
  const existingIndex = settings.customApiKeys.findIndex(k => k.provider === provider);
  
  const keyEntry = {
    provider,
    apiKey: encryptApiKey(apiKey),  // 加密存储
    models
  };
  
  if (existingIndex >= 0) {
    settings.customApiKeys[existingIndex] = keyEntry;
  } else {
    settings.customApiKeys.push(keyEntry);
  }
  
  saveUserSettings(settings);
  console.log(`[用户设置] 添加 API Key: ${provider} for ${userId}`);
}

/**
 * 获取用户 API Key
 */
export function getUserApiKey(userId: string, channel: string, provider: string): string | null {
  const settings = getUserSettings(userId, channel);
  
  if (!settings?.customApiKeys) {
    return null;
  }
  
  const keyEntry = settings.customApiKeys.find(k => k.provider === provider);
  
  if (!keyEntry) {
    return null;
  }
  
  return decryptApiKey(keyEntry.apiKey);
}

/**
 * 简单加密（生产环境应该用更强的加密）
 */
function encryptApiKey(apiKey: string): string {
  // TODO: 使用 AES-256 等强加密
  return Buffer.from(apiKey).toString('base64');
}

/**
 * 解密 API Key
 */
function decryptApiKey(encrypted: string): string {
  // TODO: 对应解密
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

/**
 * 判断用户是否是新用户
 */
export function isNewUser(userId: string, channel: string = 'feishu'): boolean {
  const settings = getUserSettings(userId, channel);
  return !settings || settings.stats.totalMessages === 0;
}

/**
 * 获取所有活跃用户数
 */
export function getActiveUserCount(): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  let count = 0;
  
  for (const settings of userSettingsStore.values()) {
    if (settings.stats.lastActive > oneHourAgo) {
      count++;
    }
  }
  
  return count;
}

/**
 * 导出统计数据
 */
export function getStats() {
  let totalUsers = 0;
  let totalMessages = 0;
  let totalTasks = 0;
  
  for (const settings of userSettingsStore.values()) {
    totalUsers++;
    totalMessages += settings.stats.totalMessages;
    totalTasks += settings.stats.totalTasks;
  }
  
  return {
    totalUsers,
    totalMessages,
    totalTasks,
    activeUsers: getActiveUserCount()
  };
}
