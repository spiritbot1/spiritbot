/**
 * 飞书安全确认系统
 * 
 * 功能：
 * 1. 发送确认卡片到飞书
 * 2. 等待用户确认/拒绝
 * 3. 支持超时自动拒绝
 * 4. 支持一键终止所有操作
 */

import { 
  SensitiveOperationType, 
  SENSITIVE_OPERATIONS,
  getSensitivityLevelEmoji,
  getSensitivityLevelText 
} from './sensitive-operations';

// 待确认操作存储
interface PendingOperation {
  id: string;
  type: SensitiveOperationType;
  description: string;
  command: string;
  context: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  resolve?: (approved: boolean) => void;
}

// 待确认操作队列
const pendingOperations = new Map<string, PendingOperation>();

// 全局终止标志
let globalKillSwitch = false;

/**
 * 生成操作 ID
 */
function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 创建飞书确认卡片
 */
export function createFeishuConfirmCard(operation: PendingOperation): object {
  const config = SENSITIVE_OPERATIONS[operation.type];
  const emoji = getSensitivityLevelEmoji(config.level);
  const levelText = getSensitivityLevelText(config.level);
  
  return {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: `${emoji} 精灵1号请求确认操作`
      },
      template: config.level === 'critical' ? 'red' : 
                config.level === 'high' ? 'orange' : 
                config.level === 'medium' ? 'yellow' : 'green'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**操作类型**: ${config.description}\n**风险等级**: ${emoji} ${levelText}\n**操作ID**: \`${operation.id}\``
        }
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**操作详情**:\n\`\`\`\n${operation.command.slice(0, 500)}${operation.command.length > 500 ? '...' : ''}\n\`\`\``
        }
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**说明**: ${operation.description}`
        }
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `⏰ 请在 ${config.timeout} 秒内确认，超时将自动取消`
          }
        ]
      },
      {
        tag: 'hr'
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '✅ 确认执行'
            },
            type: 'primary',
            value: JSON.stringify({
              action: 'approve',
              operationId: operation.id
            })
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '❌ 拒绝'
            },
            type: 'danger',
            value: JSON.stringify({
              action: 'reject',
              operationId: operation.id
            })
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '🛑 终止所有操作'
            },
            type: 'danger',
            value: JSON.stringify({
              action: 'kill_all',
              operationId: operation.id
            })
          }
        ]
      }
    ]
  };
}

/**
 * 发送飞书确认卡片
 */
async function sendFeishuConfirmCard(
  operation: PendingOperation,
  chatId: string,
  accessToken: string
): Promise<boolean> {
  const card = createFeishuConfirmCard(operation);
  
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(card)
      })
    });
    
    const data = await response.json() as { code?: number };
    return data.code === 0;
  } catch (error) {
    console.error('[飞书确认] 发送卡片失败:', error);
    return false;
  }
}

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string | null> {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    });
    
    const data = await response.json() as { tenant_access_token?: string };
    return data.tenant_access_token || null;
  } catch (error) {
    console.error('[飞书确认] 获取 access_token 失败:', error);
    return null;
  }
}

/**
 * 请求确认敏感操作
 * 
 * @returns Promise<boolean> - true 表示用户确认，false 表示拒绝或超时
 */
export async function requestConfirmation(params: {
  type: SensitiveOperationType;
  command: string;
  description: string;
  context?: Record<string, any>;
  chatId: string;
  feishuAppId: string;
  feishuAppSecret: string;
}): Promise<boolean> {
  // 检查全局终止开关
  if (globalKillSwitch) {
    console.log('[安全确认] 全局终止开关已启用，拒绝所有操作');
    return false;
  }
  
  const config = SENSITIVE_OPERATIONS[params.type];
  
  // 如果不需要确认，直接返回 true
  if (!config.requireConfirm) {
    return true;
  }
  
  const operationId = generateOperationId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.timeout * 1000);
  
  const operation: PendingOperation = {
    id: operationId,
    type: params.type,
    description: params.description,
    command: params.command,
    context: params.context || {},
    createdAt: now,
    expiresAt,
    status: 'pending'
  };
  
  pendingOperations.set(operationId, operation);
  
  console.log(`[安全确认] 创建待确认操作: ${operationId}`);
  console.log(`[安全确认] 类型: ${params.type}, 超时: ${config.timeout}秒`);
  
  // 获取 access_token
  const accessToken = await getFeishuAccessToken(params.feishuAppId, params.feishuAppSecret);
  if (!accessToken) {
    console.error('[安全确认] 无法获取飞书 access_token');
    pendingOperations.delete(operationId);
    return false;
  }
  
  // 发送确认卡片
  const sent = await sendFeishuConfirmCard(operation, params.chatId, accessToken);
  if (!sent) {
    console.error('[安全确认] 发送确认卡片失败');
    pendingOperations.delete(operationId);
    return false;
  }
  
  // 等待用户确认
  return new Promise<boolean>((resolve) => {
    operation.resolve = resolve;
    
    // 设置超时
    setTimeout(() => {
      if (operation.status === 'pending') {
        operation.status = 'expired';
        pendingOperations.delete(operationId);
        console.log(`[安全确认] 操作 ${operationId} 已超时`);
        resolve(false);
      }
    }, config.timeout * 1000);
  });
}

/**
 * 处理用户确认回调
 */
export function handleConfirmCallback(payload: {
  action: 'approve' | 'reject' | 'kill_all';
  operationId: string;
}): { success: boolean; message: string } {
  const { action, operationId } = payload;
  
  // 处理全局终止
  if (action === 'kill_all') {
    globalKillSwitch = true;
    
    // 取消所有待确认操作
    for (const [id, op] of pendingOperations) {
      if (op.status === 'pending') {
        op.status = 'cancelled';
        op.resolve?.(false);
      }
    }
    pendingOperations.clear();
    
    console.log('[安全确认] 🛑 全局终止开关已启用，所有操作已取消');
    
    // 5分钟后自动恢复
    setTimeout(() => {
      globalKillSwitch = false;
      console.log('[安全确认] 全局终止开关已自动关闭');
    }, 5 * 60 * 1000);
    
    return { success: true, message: '🛑 已终止所有操作，精灵1号将在5分钟后恢复' };
  }
  
  // 处理单个操作确认
  const operation = pendingOperations.get(operationId);
  
  if (!operation) {
    return { success: false, message: '操作不存在或已过期' };
  }
  
  if (operation.status !== 'pending') {
    return { success: false, message: `操作状态已变更为: ${operation.status}` };
  }
  
  if (action === 'approve') {
    operation.status = 'approved';
    operation.resolve?.(true);
    pendingOperations.delete(operationId);
    console.log(`[安全确认] ✅ 操作 ${operationId} 已批准`);
    return { success: true, message: '✅ 操作已批准，正在执行...' };
  } else {
    operation.status = 'rejected';
    operation.resolve?.(false);
    pendingOperations.delete(operationId);
    console.log(`[安全确认] ❌ 操作 ${operationId} 已拒绝`);
    return { success: true, message: '❌ 操作已拒绝' };
  }
}

/**
 * 检查全局终止状态
 */
export function isKillSwitchActive(): boolean {
  return globalKillSwitch;
}

/**
 * 手动恢复精灵1号（关闭终止开关）
 */
export function resumeOperations(): void {
  globalKillSwitch = false;
  console.log('[安全确认] 精灵1号已恢复运行');
}

/**
 * 获取待确认操作列表
 */
export function getPendingOperations(): PendingOperation[] {
  return Array.from(pendingOperations.values()).filter(op => op.status === 'pending');
}

/**
 * 清理过期操作
 */
export function cleanupExpiredOperations(): number {
  let cleaned = 0;
  const now = new Date();
  
  for (const [id, op] of pendingOperations) {
    if (op.expiresAt < now && op.status === 'pending') {
      op.status = 'expired';
      op.resolve?.(false);
      pendingOperations.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}

// 定期清理过期操作
setInterval(cleanupExpiredOperations, 10000);
