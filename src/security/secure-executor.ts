/**
 * 安全执行器
 * 
 * 封装所有操作，自动检测敏感操作并请求确认
 */

import { 
  detectSensitiveOperation,
  SensitiveOperationType,
  SENSITIVE_OPERATIONS
} from './sensitive-operations';

import {
  requestConfirmation,
  isKillSwitchActive,
  handleConfirmCallback
} from './feishu-confirm';

// 执行器配置
interface SecureExecutorConfig {
  feishuAppId: string;
  feishuAppSecret: string;
  defaultChatId: string;
  
  // 可选：自定义敏感度级别
  sensitivityOverrides?: Partial<Record<SensitiveOperationType, {
    requireConfirm?: boolean;
    timeout?: number;
  }>>;
  
  // 可选：白名单（跳过确认的操作）
  whitelist?: string[];
  
  // 可选：是否启用安全确认（默认 true）
  enabled?: boolean;
}

interface ExecuteResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * 创建安全执行器
 */
export function createSecureExecutor(config: SecureExecutorConfig) {
  const enabled = config.enabled ?? true;
  const whitelist = new Set(config.whitelist || []);
  
  /**
   * 安全执行操作
   */
  async function execute<T>(
    operation: string,
    executor: () => Promise<T>,
    options?: {
      description?: string;
      forceConfirm?: boolean;
      skipConfirm?: boolean;
      context?: Record<string, any>;
      chatId?: string;
    }
  ): Promise<ExecuteResult<T>> {
    // 检查是否启用
    if (!enabled) {
      const result = await executor();
      return { success: true, data: result };
    }
    
    // 检查全局终止开关
    if (isKillSwitchActive()) {
      return {
        success: false,
        skipped: true,
        reason: '精灵1号已被终止，等待恢复中...'
      };
    }
    
    // 检查白名单
    if (whitelist.has(operation)) {
      const result = await executor();
      return { success: true, data: result };
    }
    
    // 检测敏感操作
    const detection = detectSensitiveOperation(operation, options?.context);
    
    // 如果不敏感且不强制确认，直接执行
    if (!detection.isSensitive && !options?.forceConfirm) {
      const result = await executor();
      return { success: true, data: result };
    }
    
    // 如果指定跳过确认
    if (options?.skipConfirm) {
      const result = await executor();
      return { success: true, data: result };
    }
    
    const operationType = detection.type;
    const opConfig = SENSITIVE_OPERATIONS[operationType];
    
    // 应用自定义配置
    const customConfig = config.sensitivityOverrides?.[operationType];
    const requireConfirm = customConfig?.requireConfirm ?? opConfig.requireConfirm;
    
    if (!requireConfirm) {
      const result = await executor();
      return { success: true, data: result };
    }
    
    // 请求确认
    console.log(`[安全执行器] 检测到敏感操作: ${detection.reason}`);
    
    const approved = await requestConfirmation({
      type: operationType,
      command: operation,
      description: options?.description || detection.reason,
      context: options?.context,
      chatId: options?.chatId || config.defaultChatId,
      feishuAppId: config.feishuAppId,
      feishuAppSecret: config.feishuAppSecret
    });
    
    if (!approved) {
      return {
        success: false,
        skipped: true,
        reason: '操作未获得确认'
      };
    }
    
    // 执行操作
    try {
      const result = await executor();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * 安全执行 Shell 命令
   */
  async function executeShell(
    command: string,
    options?: { cwd?: string; timeout?: number; chatId?: string }
  ): Promise<ExecuteResult<{ stdout: string; stderr: string }>> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    return execute(
      command,
      async () => {
        const result = await execAsync(command, {
          cwd: options?.cwd,
          timeout: options?.timeout || 30000
        });
        return { stdout: result.stdout, stderr: result.stderr };
      },
      {
        description: `执行 Shell 命令: ${command}`,
        chatId: options?.chatId
      }
    );
  }
  
  /**
   * 安全删除文件
   */
  async function deleteFile(
    filePath: string,
    options?: { chatId?: string }
  ): Promise<ExecuteResult<void>> {
    const fs = await import('fs/promises');
    
    return execute(
      `delete ${filePath}`,
      async () => {
        await fs.unlink(filePath);
      },
      {
        description: `删除文件: ${filePath}`,
        chatId: options?.chatId
      }
    );
  }
  
  /**
   * 安全写入文件
   */
  async function writeFile(
    filePath: string,
    content: string,
    options?: { chatId?: string }
  ): Promise<ExecuteResult<void>> {
    const fs = await import('fs/promises');
    
    // 检查是否是重要文件
    const importantPaths = ['/etc', '/usr', '/bin', 'package.json', '.env', 'config'];
    const isImportant = importantPaths.some(p => filePath.includes(p));
    
    return execute(
      isImportant ? `modify important file ${filePath}` : `write ${filePath}`,
      async () => {
        await fs.writeFile(filePath, content, 'utf-8');
      },
      {
        description: `写入文件: ${filePath}`,
        forceConfirm: isImportant,
        chatId: options?.chatId
      }
    );
  }
  
  /**
   * 安全调用外部 API
   */
  async function callApi<T>(
    url: string,
    options?: RequestInit & { chatId?: string; sensitive?: boolean }
  ): Promise<ExecuteResult<T>> {
    return execute(
      `API call: ${url}`,
      async () => {
        const response = await fetch(url, options);
        return response.json() as Promise<T>;
      },
      {
        description: `调用 API: ${url}`,
        forceConfirm: options?.sensitive,
        chatId: options?.chatId
      }
    );
  }
  
  return {
    execute,
    executeShell,
    deleteFile,
    writeFile,
    callApi,
    handleCallback: handleConfirmCallback,
    isKillSwitchActive
  };
}

// 导出类型
export type SecureExecutor = ReturnType<typeof createSecureExecutor>;
