/**
 * API Key 验证中间件
 * 
 * 功能：
 * 1. 验证请求的 API Key 是否有效
 * 2. 检查配额和权限
 * 3. 记录 API 使用情况
 */

import { Request, Response, NextFunction } from 'express';
import * as db from './database';
import { createHash } from 'crypto';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        keyId: string;
        ownerType: string;
        permissions: string[];
        quotaRemaining: number | null;
      };
    }
  }
}

// 内部系统 API Key（硬编码，用于管理后台）
const INTERNAL_API_KEY = 'brain-internal-secret-2026';
const INTERNAL_KEY_ID = 'sk-internal-admin';

/**
 * 计算密钥哈希
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * API Key 验证中间件
 */
export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 从 header 获取 API Key
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];
  
  let keyId: string | undefined;
  let keySecret: string | undefined;
  
  // 支持两种格式：
  // 1. Authorization: Bearer sk-xxx:secret
  // 2. X-API-Key: sk-xxx:secret
  const rawKey = (authHeader?.replace('Bearer ', '') || apiKeyHeader) as string | undefined;
  
  if (!rawKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Use Authorization: Bearer <key> or X-API-Key header.',
    });
    return;
  }
  
  // 解析 key_id:secret 格式
  if (rawKey.includes(':')) {
    [keyId, keySecret] = rawKey.split(':');
  } else {
    // 兼容只传 secret 的情况（用于内部系统）
    keySecret = rawKey;
    keyId = INTERNAL_KEY_ID;
  }
  
  if (!keyId || !keySecret) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key format. Expected format: key_id:secret',
    });
    return;
  }
  
  try {
    // 快速验证内部 key（不走数据库）
    if (keyId === INTERNAL_KEY_ID && keySecret === INTERNAL_API_KEY) {
      req.apiKey = {
        id: 'internal',
        keyId: INTERNAL_KEY_ID,
        ownerType: 'internal',
        permissions: ['chat', 'tools', 'admin'],
        quotaRemaining: null, // 无限
      };
      next();
      return;
    }
    
    // 计算密钥哈希
    const keyHash = hashApiKey(keySecret);
    
    // 从数据库验证
    const { data: keyData, error: keyError } = await db.getDb()
      .from('brain_api_keys')
      .select('*')
      .eq('key_id', keyId)
      .single();
    
    if (keyError || !keyData) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key not found',
      });
      return;
    }
    
    // 验证哈希
    if (keyData.key_hash !== keyHash) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }
    
    // 检查状态
    if (keyData.status !== 'active') {
      res.status(403).json({
        error: 'Forbidden',
        message: `API key is ${keyData.status}`,
        reason: keyData.suspended_reason,
      });
      return;
    }
    
    // 检查过期
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'API key has expired',
      });
      return;
    }
    
    // 检查配额
    if (keyData.quota_type !== 'unlimited' && keyData.quota_used >= keyData.quota_limit) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'API quota exceeded',
        quota: {
          limit: keyData.quota_limit,
          used: keyData.quota_used,
          reset_at: keyData.quota_reset_at,
        },
      });
      return;
    }
    
    // 设置请求上下文
    req.apiKey = {
      id: keyData.id,
      keyId: keyData.key_id,
      ownerType: keyData.owner_type,
      permissions: keyData.permissions || ['chat'],
      quotaRemaining: keyData.quota_type === 'unlimited' 
        ? null 
        : keyData.quota_limit - keyData.quota_used,
    };
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate API key',
    });
  }
}

/**
 * 记录 API 使用情况
 */
export async function recordApiUsage(
  req: Request,
  endpoint: string,
  options: {
    toolUsed?: string;
    inputTokens?: number;
    outputTokens?: number;
    responseTimeMs?: number;
    status?: 'success' | 'error';
    errorMessage?: string;
  } = {}
): Promise<void> {
  if (!req.apiKey || req.apiKey.ownerType === 'internal') {
    // 内部调用不记录
    return;
  }
  
  try {
    await db.getDb().from('brain_usage_logs').insert({
      api_key_id: req.apiKey.id,
      key_id: req.apiKey.keyId,
      endpoint,
      tool_used: options.toolUsed,
      input_tokens: options.inputTokens || 0,
      output_tokens: options.outputTokens || 0,
      response_time_ms: options.responseTimeMs || 0,
      status: options.status || 'success',
      error_message: options.errorMessage,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });
    
    // 更新配额使用量和最后使用时间
    await db.getDb()
      .from('brain_api_keys')
      .update({
        quota_used: db.getDb().rpc('increment', { x: 1 }),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', req.apiKey.id);
  } catch (error) {
    // 记录失败不影响正常业务
    console.error('Failed to record API usage:', error);
  }
}

/**
 * 检查权限中间件
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required',
      });
      return;
    }
    
    if (!req.apiKey.permissions.includes(permission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`,
        your_permissions: req.apiKey.permissions,
      });
      return;
    }
    
    next();
  };
}

/**
 * 公开端点列表（不需要 API Key）
 * 
 * 注意：Central Brain 是 B2B API 服务，所有端点都需要 API Key
 * 商家通过授权的 API Key 在他们的系统中接入使用
 */
export const PUBLIC_ENDPOINTS: string[] = [
  // 全部端点都需要 API Key，没有公开端点
];

/**
 * 可选验证中间件（某些端点允许匿名访问）
 */
export function optionalApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const path = req.path;
  
  // 公开端点直接放行
  if (PUBLIC_ENDPOINTS.includes(path)) {
    next();
    return;
  }
  
  // 其他端点需要验证
  validateApiKey(req, res, next);
}

