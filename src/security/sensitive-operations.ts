/**
 * 敏感操作管理器
 * 
 * 功能：
 * 1. 检测敏感操作
 * 2. 发送飞书确认卡片
 * 3. 等待用户确认
 * 4. 支持一键终止
 */

// 敏感操作类型
export type SensitiveOperationType = 
  | 'file_delete'      // 删除文件
  | 'file_modify'      // 修改重要文件
  | 'shell_command'    // 执行 Shell 命令
  | 'api_call'         // 调用外部 API
  | 'send_message'     // 发送消息到其他平台
  | 'database_write'   // 写入数据库
  | 'system_config'    // 修改系统配置
  | 'payment'          // 涉及金钱操作
  | 'unknown';         // 未知操作

// 敏感操作配置
export interface SensitiveOperationConfig {
  type: SensitiveOperationType;
  level: 'low' | 'medium' | 'high' | 'critical';  // 敏感级别
  requireConfirm: boolean;        // 是否需要确认
  timeout: number;                // 确认超时（秒）
  description: string;            // 操作描述
}

// 默认敏感操作配置
export const SENSITIVE_OPERATIONS: Record<SensitiveOperationType, SensitiveOperationConfig> = {
  file_delete: {
    type: 'file_delete',
    level: 'critical',
    requireConfirm: true,
    timeout: 120,
    description: '删除文件'
  },
  file_modify: {
    type: 'file_modify',
    level: 'high',
    requireConfirm: true,
    timeout: 60,
    description: '修改文件'
  },
  shell_command: {
    type: 'shell_command',
    level: 'high',
    requireConfirm: true,
    timeout: 60,
    description: '执行命令'
  },
  api_call: {
    type: 'api_call',
    level: 'medium',
    requireConfirm: false,  // 普通 API 调用不需要确认
    timeout: 30,
    description: '调用 API'
  },
  send_message: {
    type: 'send_message',
    level: 'medium',
    requireConfirm: true,
    timeout: 60,
    description: '发送消息'
  },
  database_write: {
    type: 'database_write',
    level: 'high',
    requireConfirm: true,
    timeout: 60,
    description: '写入数据库'
  },
  system_config: {
    type: 'system_config',
    level: 'critical',
    requireConfirm: true,
    timeout: 120,
    description: '修改系统配置'
  },
  payment: {
    type: 'payment',
    level: 'critical',
    requireConfirm: true,
    timeout: 180,
    description: '涉及金钱操作'
  },
  unknown: {
    type: 'unknown',
    level: 'high',
    requireConfirm: true,
    timeout: 60,
    description: '未知操作'
  }
};

// 危险命令关键词
const DANGEROUS_COMMANDS = [
  'rm -rf',
  'rm -r',
  'rmdir',
  'del /f',
  'format',
  'sudo',
  'chmod 777',
  'drop table',
  'delete from',
  'truncate',
  'shutdown',
  'reboot',
  'kill -9',
  'pkill',
];

// 危险路径
const DANGEROUS_PATHS = [
  '/',
  '/etc',
  '/usr',
  '/bin',
  '/sbin',
  '/var',
  '/root',
  '/home',
  'C:\\',
  'C:\\Windows',
  'C:\\Program Files',
];

/**
 * 检测操作是否敏感
 */
export function detectSensitiveOperation(
  operation: string,
  context?: Record<string, any>
): { isSensitive: boolean; type: SensitiveOperationType; reason: string } {
  const lowerOp = operation.toLowerCase();
  
  // 检测删除操作
  if (/delete|remove|rm |del /i.test(lowerOp)) {
    return { isSensitive: true, type: 'file_delete', reason: '检测到删除操作' };
  }
  
  // 检测危险命令
  for (const cmd of DANGEROUS_COMMANDS) {
    if (lowerOp.includes(cmd.toLowerCase())) {
      return { isSensitive: true, type: 'shell_command', reason: `检测到危险命令: ${cmd}` };
    }
  }
  
  // 检测危险路径
  for (const path of DANGEROUS_PATHS) {
    if (lowerOp.includes(path.toLowerCase())) {
      return { isSensitive: true, type: 'file_modify', reason: `检测到危险路径: ${path}` };
    }
  }
  
  // 检测数据库写操作
  if (/insert|update|delete|drop|alter|truncate/i.test(lowerOp)) {
    return { isSensitive: true, type: 'database_write', reason: '检测到数据库写操作' };
  }
  
  // 检测支付相关
  if (/pay|payment|transfer|withdraw|charge/i.test(lowerOp)) {
    return { isSensitive: true, type: 'payment', reason: '检测到支付相关操作' };
  }
  
  // 检测系统配置
  if (/config|setting|env|environment/i.test(lowerOp) && /modify|change|set|update/i.test(lowerOp)) {
    return { isSensitive: true, type: 'system_config', reason: '检测到系统配置修改' };
  }
  
  return { isSensitive: false, type: 'unknown', reason: '' };
}

/**
 * 获取操作的敏感级别描述
 */
export function getSensitivityLevelEmoji(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🟠';
    case 'critical': return '🔴';
  }
}

/**
 * 获取操作的敏感级别中文描述
 */
export function getSensitivityLevelText(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'low': return '低风险';
    case 'medium': return '中等风险';
    case 'high': return '高风险';
    case 'critical': return '极高风险';
  }
}
