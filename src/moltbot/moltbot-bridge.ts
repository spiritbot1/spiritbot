/**
 * Moltbot 桥接器
 * Moltbot Bridge
 * 
 * 连接精灵1号核心与 Moltbot 执行能力
 */

// Moltbot Gateway 配置
export interface MoltbotConfig {
  gatewayUrl: string;       // Gateway URL
  hookPath: string;         // Hook 路径
  hookToken: string;        // 认证 Token
  defaultAgent: string;     // 默认 Agent 名称
  defaultChannel: string;   // 默认频道
}

// Agent 调用参数
export interface AgentCallParams {
  message: string;          // 要执行的任务/消息
  name?: string;            // Agent 名称
  sessionKey?: string;      // 会话标识
  channel?: string;         // 频道
  wakeMode?: 'now' | 'scheduled';
  deliver?: boolean;        // 是否投递结果
}

// Agent 调用结果
export interface AgentCallResult {
  ok: boolean;
  runId?: string;
  error?: string;
  output?: string;
}

// 工具执行参数
export interface ToolExecuteParams {
  tool: string;             // 工具名称
  args: Record<string, any>; // 工具参数
  sessionKey?: string;
}

// 工具执行结果
export interface ToolExecuteResult {
  ok: boolean;
  result?: any;
  error?: string;
}

/**
 * Moltbot 桥接器类
 */
export class MoltbotBridge {
  private config: MoltbotConfig;
  private sessionStore = new Map<string, {
    agentName: string;
    lastActivity: Date;
    messageCount: number;
  }>();
  
  constructor(config: MoltbotConfig) {
    this.config = config;
    console.log(`[MoltbotBridge] 初始化完成`);
    console.log(`  - Gateway: ${config.gatewayUrl}`);
    console.log(`  - Default Agent: ${config.defaultAgent}`);
  }
  
  /**
   * 调用 Agent 执行任务
   */
  async callAgent(params: AgentCallParams): Promise<AgentCallResult> {
    const url = this.buildUrl('/agent');
    
    const payload = {
      message: params.message,
      name: params.name || this.config.defaultAgent,
      sessionKey: params.sessionKey,
      channel: params.channel || this.config.defaultChannel,
      wakeMode: params.wakeMode || 'now',
      deliver: params.deliver ?? true
    };
    
    console.log(`[MoltbotBridge] 调用 Agent: ${payload.name}`);
    console.log(`[MoltbotBridge] 任务: ${payload.message.slice(0, 100)}...`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.hookToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json() as AgentCallResult;
      
      if (response.ok && data.ok) {
        console.log(`[MoltbotBridge] Agent 调用成功, RunId: ${data.runId}`);
        
        // 更新会话记录
        if (params.sessionKey) {
          this.updateSession(params.sessionKey, payload.name);
        }
        
        return { ok: true, runId: data.runId };
      }
      
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    } catch (error) {
      console.error('[MoltbotBridge] Agent 调用失败:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * 执行工具
   */
  async executeTool(params: ToolExecuteParams): Promise<ToolExecuteResult> {
    const url = this.buildUrl('/tool');
    
    const payload = {
      tool: params.tool,
      args: params.args,
      sessionKey: params.sessionKey
    };
    
    console.log(`[MoltbotBridge] 执行工具: ${params.tool}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.hookToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json() as ToolExecuteResult;
      
      if (response.ok && data.ok) {
        console.log(`[MoltbotBridge] 工具执行成功`);
        return { ok: true, result: data.result };
      }
      
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    } catch (error) {
      console.error('[MoltbotBridge] 工具执行失败:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * 搜索网络
   */
  async searchWeb(query: string, sessionKey?: string): Promise<ToolExecuteResult> {
    return this.executeTool({
      tool: 'web_search',
      args: { query },
      sessionKey
    });
  }
  
  /**
   * 浏览网页
   */
  async browseWeb(url: string, sessionKey?: string): Promise<ToolExecuteResult> {
    return this.executeTool({
      tool: 'browse',
      args: { url },
      sessionKey
    });
  }
  
  /**
   * 执行 Shell 命令
   */
  async executeShell(command: string, cwd?: string, sessionKey?: string): Promise<ToolExecuteResult> {
    return this.executeTool({
      tool: 'bash',
      args: { command, cwd },
      sessionKey
    });
  }
  
  /**
   * 读取文件
   */
  async readFile(path: string, sessionKey?: string): Promise<ToolExecuteResult> {
    return this.executeTool({
      tool: 'read_file',
      args: { path },
      sessionKey
    });
  }
  
  /**
   * 写入文件
   */
  async writeFile(path: string, content: string, sessionKey?: string): Promise<ToolExecuteResult> {
    return this.executeTool({
      tool: 'write_file',
      args: { path, content },
      sessionKey
    });
  }
  
  /**
   * 创建 Agent（动态配置新 Agent）
   */
  async createAgent(config: {
    name: string;
    systemPrompt: string;
    model?: string;
    tools?: string[];
  }): Promise<{ ok: boolean; error?: string }> {
    const url = this.buildUrl('/agent/create');
    
    console.log(`[MoltbotBridge] 创建 Agent: ${config.name}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.hookToken}`
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json() as { ok: boolean; error?: string };
      
      if (response.ok && data.ok) {
        console.log(`[MoltbotBridge] Agent 创建成功: ${config.name}`);
        return { ok: true };
      }
      
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    } catch (error) {
      console.error('[MoltbotBridge] Agent 创建失败:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * 获取 Agent 列表
   */
  async listAgents(): Promise<{ ok: boolean; agents?: string[]; error?: string }> {
    const url = this.buildUrl('/agents');
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.hookToken}`
        }
      });
      
      const data = await response.json() as { ok: boolean; agents?: string[]; error?: string };
      return data;
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * 获取会话信息
   */
  getSession(sessionKey: string) {
    return this.sessionStore.get(sessionKey);
  }
  
  /**
   * 更新会话
   */
  private updateSession(sessionKey: string, agentName: string) {
    const existing = this.sessionStore.get(sessionKey);
    
    this.sessionStore.set(sessionKey, {
      agentName,
      lastActivity: new Date(),
      messageCount: (existing?.messageCount || 0) + 1
    });
  }
  
  /**
   * 清理过期会话
   */
  cleanupSessions(maxAge: number = 3600000) { // 默认 1 小时
    const now = Date.now();
    
    for (const [key, session] of this.sessionStore) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.sessionStore.delete(key);
      }
    }
  }
  
  /**
   * 构建 URL
   */
  private buildUrl(path: string): string {
    const base = this.config.gatewayUrl.replace(/\/+$/, '');
    const hookPath = this.config.hookPath.startsWith('/') 
      ? this.config.hookPath 
      : `/${this.config.hookPath}`;
    
    return `${base}${hookPath}${path}`;
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.config.gatewayUrl + '/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * 创建 Moltbot 桥接器实例
 */
export function createMoltbotBridge(config: Partial<MoltbotConfig> = {}): MoltbotBridge {
  const finalConfig: MoltbotConfig = {
    gatewayUrl: config.gatewayUrl || process.env.MOLTBOT_GATEWAY_URL || 'http://localhost:3000',
    hookPath: config.hookPath || process.env.MOLTBOT_HOOK_PATH || '/hooks',
    hookToken: config.hookToken || process.env.MOLTBOT_HOOK_TOKEN || '',
    defaultAgent: config.defaultAgent || process.env.MOLTBOT_DEFAULT_AGENT || 'SpiritAgent',
    defaultChannel: config.defaultChannel || process.env.MOLTBOT_HOOK_CHANNEL || 'last'
  };
  
  return new MoltbotBridge(finalConfig);
}

// 预定义的 Agent 模板
export const AGENT_TEMPLATES = {
  // 红包猎手
  redPacketHunter: {
    name: 'RedPacketHunter',
    systemPrompt: `你是红包猎手，专门帮用户抢微信红包。
    
规则：
1. 监控指定群聊
2. 检测到红包立即点击
3. 记录抢到的金额
4. 定期汇报战绩`,
    tools: ['wechat_monitor', 'click', 'screenshot']
  },
  
  // 票务专员
  ticketAgent: {
    name: 'TicketAgent',
    systemPrompt: `你是票务专员，帮用户抢火车票和机票。
    
规则：
1. 登录用户授权的 12306/携程账号
2. 按用户要求监控票务
3. 有票时立即下单
4. 发送确认给用户`,
    tools: ['browser', 'click', 'input', 'screenshot']
  },
  
  // 内容创作者
  contentCreator: {
    name: 'ContentCreator',
    systemPrompt: `你是内容创作者，帮用户创作和发布内容。
    
能力：
1. 分析热门内容趋势
2. 生成文案和脚本
3. 协助发布到各平台`,
    tools: ['web_search', 'browse', 'write_file']
  },
  
  // 运维助手
  devopsHelper: {
    name: 'DevOpsHelper',
    systemPrompt: `你是运维助手，帮用户管理服务器和代码。
    
能力：
1. 查看服务器状态
2. 分析日志
3. 修复简单问题
4. 执行部署脚本

安全：敏感操作必须确认！`,
    tools: ['bash', 'read_file', 'write_file', 'ssh']
  }
};
