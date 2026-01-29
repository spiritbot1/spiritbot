/**
 * 外部连接器
 * 
 * 让中心大脑可以"邀请"到任何系统：
 * 1. HTTP/REST 接口 - 通用 API 调用
 * 2. 数据库连接 - 直接操作数据
 * 3. MCP 协议 - Agent 间通信
 * 4. 系统分析 - 理解和监控外部系统
 */

import { getDatabase } from './database';
import * as ai from './ai';

// ========== 类型定义 ==========

export interface ExternalSystem {
  id: string;
  name: string;
  type: SystemType;
  description?: string;
  connection: ConnectionConfig;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  last_connected?: string;
  metadata?: Record<string, any>;
}

export type SystemType = 
  | 'api'        // REST/GraphQL API
  | 'database'   // 数据库
  | 'service'    // 微服务
  | 'platform'   // 平台（如我们的系统）
  | 'external';  // 外部服务

export interface ConnectionConfig {
  type: 'http' | 'websocket' | 'database' | 'mcp';
  endpoint?: string;
  auth?: {
    type: 'bearer' | 'api_key' | 'basic' | 'none';
    credentials?: Record<string, string>;
  };
  options?: Record<string, any>;
}

export interface SystemAction {
  system_id: string;
  action: string;
  params?: Record<string, any>;
  executed_at: string;
  result?: any;
  success: boolean;
  error?: string;
}

// ========== 系统注册 ==========

const registeredSystems: Map<string, ExternalSystem> = new Map();

/**
 * 注册外部系统
 */
export async function registerSystem(system: ExternalSystem): Promise<boolean> {
  console.log(`📡 注册外部系统: ${system.name}`);
  
  // 测试连接
  const canConnect = await testConnection(system);
  system.status = canConnect ? 'active' : 'error';
  system.last_connected = canConnect ? new Date().toISOString() : undefined;
  
  // 存入内存和数据库
  registeredSystems.set(system.id, system);
  
  const db = getDatabase();
  await db.from('central_brain_systems').upsert({
    id: system.id,
    name: system.name,
    type: system.type,
    description: system.description,
    connection: system.connection,
    status: system.status,
    capabilities: system.capabilities,
    last_connected: system.last_connected,
    metadata: system.metadata,
  });
  
  if (canConnect) {
    console.log(`   ✅ 连接成功`);
  } else {
    console.log(`   ❌ 连接失败`);
  }
  
  return canConnect;
}

/**
 * 获取已注册的系统
 */
export function getRegisteredSystems(): ExternalSystem[] {
  return Array.from(registeredSystems.values());
}

/**
 * 获取系统信息
 */
export function getSystem(systemId: string): ExternalSystem | undefined {
  return registeredSystems.get(systemId);
}

// ========== 连接测试 ==========

/**
 * 测试系统连接
 */
async function testConnection(system: ExternalSystem): Promise<boolean> {
  try {
    switch (system.connection.type) {
      case 'http':
        return await testHttpConnection(system);
      case 'database':
        return await testDatabaseConnection(system);
      case 'mcp':
        return await testMcpConnection(system);
      default:
        return false;
    }
  } catch (error) {
    console.error(`连接测试失败 (${system.name}):`, error);
    return false;
  }
}

async function testHttpConnection(system: ExternalSystem): Promise<boolean> {
  if (!system.connection.endpoint) return false;
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 添加认证
    if (system.connection.auth) {
      switch (system.connection.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${system.connection.auth.credentials?.token}`;
          break;
        case 'api_key':
          headers['X-API-Key'] = system.connection.auth.credentials?.key || '';
          break;
      }
    }
    
    const response = await fetch(system.connection.endpoint, {
      method: 'HEAD',
      headers,
    });
    
    return response.ok || response.status === 401;  // 401 也说明能连接
  } catch {
    return false;
  }
}

async function testDatabaseConnection(system: ExternalSystem): Promise<boolean> {
  // 数据库连接测试（简化版）
  return true;  // 假设总是成功
}

async function testMcpConnection(system: ExternalSystem): Promise<boolean> {
  // MCP 连接测试
  return true;  // 假设总是成功
}

// ========== HTTP API 调用 ==========

/**
 * 调用外部 API
 */
export async function callApi(
  systemId: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  const system = registeredSystems.get(systemId);
  
  if (!system) {
    return { success: false, error: '系统未注册' };
  }
  
  if (system.connection.type !== 'http') {
    return { success: false, error: '不是 HTTP 类型的系统' };
  }
  
  try {
    const baseUrl = system.connection.endpoint || '';
    const url = `${baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 添加认证
    if (system.connection.auth) {
      switch (system.connection.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${system.connection.auth.credentials?.token}`;
          break;
        case 'api_key':
          headers['X-API-Key'] = system.connection.auth.credentials?.key || '';
          break;
      }
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => null);
    
    // 记录操作
    await logAction({
      system_id: systemId,
      action: `${method} ${endpoint}`,
      params: data,
      executed_at: new Date().toISOString(),
      result: responseData,
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    });
    
    return {
      success: response.ok,
      data: responseData,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ========== 系统分析 ==========

/**
 * 分析外部系统
 */
export async function analyzeSystem(systemId: string): Promise<{
  status: string;
  insights: string[];
  recommendations: string[];
}> {
  const system = registeredSystems.get(systemId);
  
  if (!system) {
    return { status: 'unknown', insights: [], recommendations: [] };
  }
  
  console.log(`🔍 分析系统: ${system.name}`);
  
  const insights: string[] = [];
  const recommendations: string[] = [];
  
  // 基础信息
  insights.push(`系统类型: ${system.type}`);
  insights.push(`连接方式: ${system.connection.type}`);
  insights.push(`能力: ${system.capabilities.join(', ')}`);
  
  // 状态检查
  const isActive = await testConnection(system);
  system.status = isActive ? 'active' : 'error';
  
  if (!isActive) {
    recommendations.push('系统当前不可用，建议检查连接配置');
  }
  
  return {
    status: system.status,
    insights,
    recommendations,
  };
}

/**
 * 发现系统能力
 */
export async function discoverCapabilities(systemId: string): Promise<string[]> {
  const system = registeredSystems.get(systemId);
  
  if (!system) return [];
  
  // 如果是 HTTP API，尝试获取 OpenAPI 文档
  if (system.connection.type === 'http') {
    try {
      // 尝试常见的 API 文档路径
      const docPaths = ['/api/docs', '/swagger.json', '/openapi.json', '/api'];
      
      for (const path of docPaths) {
        const result = await callApi(systemId, path, 'GET');
        if (result.success && result.data) {
          // 解析 API 文档，提取能力
          return extractCapabilitiesFromApiDoc(result.data);
        }
      }
    } catch {
      // 忽略错误
    }
  }
  
  return system.capabilities;
}

function extractCapabilitiesFromApiDoc(doc: any): string[] {
  const capabilities: string[] = [];
  
  if (doc.paths) {
    for (const path of Object.keys(doc.paths)) {
      capabilities.push(`API: ${path}`);
    }
  }
  
  return capabilities.slice(0, 20);  // 限制数量
}

// ========== MCP 协议支持 ==========

export interface McpMessage {
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  id?: string;
}

/**
 * 发送 MCP 消息
 */
export async function sendMcpMessage(
  systemId: string,
  message: McpMessage
): Promise<McpMessage | null> {
  const system = registeredSystems.get(systemId);
  
  if (!system || system.connection.type !== 'mcp') {
    return null;
  }
  
  // MCP 实现（简化版，实际需要 WebSocket 或其他传输）
  console.log(`📤 MCP -> ${system.name}:`, message.method);
  
  // 这里应该实现实际的 MCP 通信
  // 目前返回模拟响应
  
  return {
    type: 'response',
    id: message.id,
    result: { status: 'ok' },
  };
}

/**
 * 注册 MCP 能力
 */
export function registerMcpCapability(capability: {
  name: string;
  description: string;
  handler: (params: any) => Promise<any>;
}): void {
  mcpCapabilities.set(capability.name, capability);
  console.log(`🔧 注册 MCP 能力: ${capability.name}`);
}

const mcpCapabilities: Map<string, {
  name: string;
  description: string;
  handler: (params: any) => Promise<any>;
}> = new Map();

/**
 * 处理 MCP 请求
 */
export async function handleMcpRequest(message: McpMessage): Promise<McpMessage> {
  if (message.type !== 'request' || !message.method) {
    return {
      type: 'response',
      id: message.id,
      error: { code: -32600, message: 'Invalid request' },
    };
  }
  
  const capability = mcpCapabilities.get(message.method);
  
  if (!capability) {
    return {
      type: 'response',
      id: message.id,
      error: { code: -32601, message: 'Method not found' },
    };
  }
  
  try {
    const result = await capability.handler(message.params);
    return {
      type: 'response',
      id: message.id,
      result,
    };
  } catch (error: any) {
    return {
      type: 'response',
      id: message.id,
      error: { code: -32603, message: error.message },
    };
  }
}

// ========== 系统管控 ==========

/**
 * 执行系统管控指令
 */
export async function executeSystemCommand(
  systemId: string,
  command: string,
  params?: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  const system = registeredSystems.get(systemId);
  
  if (!system) {
    return { success: false, error: '系统未注册' };
  }
  
  console.log(`⚡ 执行指令: ${command} -> ${system.name}`);
  
  // 根据系统类型和命令执行不同操作
  switch (command) {
    case 'status':
      return { success: true, result: await analyzeSystem(systemId) };
    
    case 'health_check':
      const isHealthy = await testConnection(system);
      return { success: true, result: { healthy: isHealthy } };
    
    case 'get_metrics':
      // 获取系统指标
      if (system.type === 'platform' && system.connection.type === 'http') {
        return await callApi(systemId, '/api/metrics', 'GET');
      }
      return { success: false, error: '不支持的操作' };
    
    case 'restart':
      // 重启服务（需要特殊权限）
      console.log(`   ⚠️ 重启请求已记录，等待人工审批`);
      return { success: false, error: '需要人工审批' };
    
    default:
      // 尝试作为 API 调用
      if (system.connection.type === 'http') {
        return await callApi(systemId, command, 'POST', params);
      }
      return { success: false, error: '未知命令' };
  }
}

// ========== 日志 ==========

async function logAction(action: SystemAction): Promise<void> {
  const db = getDatabase();
  
  await db.from('central_brain_system_actions').insert({
    system_id: action.system_id,
    action: action.action,
    params: action.params,
    result: action.result,
    success: action.success,
    error: action.error,
  });
}

// ========== 预置连接器 ==========

/**
 * 注册 FlashTour 平台
 */
export async function registerFlashTourPlatform(config: {
  apiUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
}): Promise<void> {
  // 注册 API 系统
  await registerSystem({
    id: 'flashtour-api',
    name: 'FlashTour API',
    type: 'platform',
    description: 'FlashTour 旅业平台 API',
    connection: {
      type: 'http',
      endpoint: config.apiUrl,
      auth: {
        type: 'bearer',
        credentials: { token: config.supabaseKey },
      },
    },
    status: 'inactive',
    capabilities: [
      'user_management',
      'order_management',
      'product_management',
      'analytics',
    ],
  });
  
  // 注册数据库
  await registerSystem({
    id: 'flashtour-db',
    name: 'FlashTour Database',
    type: 'database',
    description: 'FlashTour 数据库（Supabase）',
    connection: {
      type: 'database',
      endpoint: config.supabaseUrl,
      auth: {
        type: 'api_key',
        credentials: { key: config.supabaseKey },
      },
    },
    status: 'inactive',
    capabilities: [
      'read_data',
      'write_data',
      'query',
    ],
  });
  
  console.log('🎯 FlashTour 平台已注册');
}

/**
 * 初始化外部连接器
 */
export async function initExternalConnector(): Promise<void> {
  // 从数据库加载已注册的系统
  const db = getDatabase();
  const { data: systems } = await db
    .from('central_brain_systems')
    .select('*');
  
  if (systems) {
    for (const sys of systems) {
      registeredSystems.set(sys.id, sys as ExternalSystem);
    }
  }
  
  // 注册默认 MCP 能力
  registerMcpCapability({
    name: 'brain/status',
    description: '获取大脑状态',
    handler: async () => {
      return { status: 'online', timestamp: new Date().toISOString() };
    },
  });
  
  registerMcpCapability({
    name: 'brain/query',
    description: '向大脑提问',
    handler: async (params: { question: string }) => {
      const response = await ai.chat([{ role: 'user', content: params.question }]);
      return { answer: response };
    },
  });
  
  registerMcpCapability({
    name: 'brain/learn',
    description: '让大脑学习知识',
    handler: async (params: { content: string; source?: string }) => {
      // 调用知识图谱学习
      const kg = await import('./knowledge-graph');
      const result = await kg.learnFromText(params.content, params.source);
      return result;
    },
  });
  
  console.log('🌐 外部连接器已初始化');
}

