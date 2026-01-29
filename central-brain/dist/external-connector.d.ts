/**
 * 外部连接器
 *
 * 让中心大脑可以"邀请"到任何系统：
 * 1. HTTP/REST 接口 - 通用 API 调用
 * 2. 数据库连接 - 直接操作数据
 * 3. MCP 协议 - Agent 间通信
 * 4. 系统分析 - 理解和监控外部系统
 */
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
export type SystemType = 'api' | 'database' | 'service' | 'platform' | 'external';
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
/**
 * 注册外部系统
 */
export declare function registerSystem(system: ExternalSystem): Promise<boolean>;
/**
 * 获取已注册的系统
 */
export declare function getRegisteredSystems(): ExternalSystem[];
/**
 * 获取系统信息
 */
export declare function getSystem(systemId: string): ExternalSystem | undefined;
/**
 * 调用外部 API
 */
export declare function callApi(systemId: string, endpoint: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}>;
/**
 * 分析外部系统
 */
export declare function analyzeSystem(systemId: string): Promise<{
    status: string;
    insights: string[];
    recommendations: string[];
}>;
/**
 * 发现系统能力
 */
export declare function discoverCapabilities(systemId: string): Promise<string[]>;
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
export declare function sendMcpMessage(systemId: string, message: McpMessage): Promise<McpMessage | null>;
/**
 * 注册 MCP 能力
 */
export declare function registerMcpCapability(capability: {
    name: string;
    description: string;
    handler: (params: any) => Promise<any>;
}): void;
/**
 * 处理 MCP 请求
 */
export declare function handleMcpRequest(message: McpMessage): Promise<McpMessage>;
/**
 * 执行系统管控指令
 */
export declare function executeSystemCommand(systemId: string, command: string, params?: any): Promise<{
    success: boolean;
    result?: any;
    error?: string;
}>;
/**
 * 注册 FlashTour 平台
 */
export declare function registerFlashTourPlatform(config: {
    apiUrl: string;
    supabaseUrl: string;
    supabaseKey: string;
}): Promise<void>;
/**
 * 初始化外部连接器
 */
export declare function initExternalConnector(): Promise<void>;
