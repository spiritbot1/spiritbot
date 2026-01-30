/**
 * AI 模型调度器
 * AI Model Dispatcher
 * 
 * 支持多模型、多服务商的智能调度
 */

// 支持的 AI 服务商
export type AIProvider = 
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'siliconflow'
  | 'moonshot'
  | 'zhipu'
  | 'qwen'
  | 'baichuan'
  | 'minimax';

// 模型配置
export interface ModelConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

// 任务类型
export type TaskType = 
  | 'chat'          // 普通对话
  | 'reasoning'     // 深度推理
  | 'coding'        // 代码生成
  | 'creative'      // 创意写作
  | 'analysis'      // 数据分析
  | 'fast';         // 快速响应

// 服务商 API 端点
const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
  moonshot: 'https://api.moonshot.cn/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  baichuan: 'https://api.baichuan-ai.com/v1',
  minimax: 'https://api.minimax.chat/v1'
};

// 推荐模型配置
const RECOMMENDED_MODELS: Record<TaskType, { provider: AIProvider; model: string }[]> = {
  chat: [
    { provider: 'siliconflow', model: 'Qwen/Qwen2.5-72B-Instruct' },
    { provider: 'deepseek', model: 'deepseek-chat' },
    { provider: 'openai', model: 'gpt-4o-mini' }
  ],
  reasoning: [
    { provider: 'deepseek', model: 'deepseek-reasoner' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    { provider: 'openai', model: 'o1-mini' }
  ],
  coding: [
    { provider: 'deepseek', model: 'deepseek-coder' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    { provider: 'openai', model: 'gpt-4o' }
  ],
  creative: [
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'moonshot', model: 'moonshot-v1-128k' }
  ],
  analysis: [
    { provider: 'deepseek', model: 'deepseek-chat' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    { provider: 'siliconflow', model: 'Qwen/Qwen2.5-72B-Instruct' }
  ],
  fast: [
    { provider: 'siliconflow', model: 'Qwen/Qwen2.5-7B-Instruct' },
    { provider: 'deepseek', model: 'deepseek-chat' },
    { provider: 'openai', model: 'gpt-4o-mini' }
  ]
};

// 消息格式
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 调用结果
export interface AICallResult {
  success: boolean;
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  provider?: AIProvider;
  error?: string;
  latency?: number;
}

/**
 * AI 模型调度器类
 */
export class ModelDispatcher {
  private configs: Map<AIProvider, ModelConfig> = new Map();
  private defaultProvider: AIProvider;
  
  constructor(defaultProvider: AIProvider = 'siliconflow') {
    this.defaultProvider = defaultProvider;
    console.log(`[ModelDispatcher] 初始化，默认服务商: ${defaultProvider}`);
  }
  
  /**
   * 注册服务商配置
   */
  registerProvider(config: ModelConfig): void {
    this.configs.set(config.provider, config);
    console.log(`[ModelDispatcher] 注册服务商: ${config.provider} (${config.model})`);
  }
  
  /**
   * 从环境变量加载配置
   */
  loadFromEnv(): void {
    // SiliconFlow
    if (process.env.SILICONFLOW_API_KEY) {
      this.registerProvider({
        provider: 'siliconflow',
        model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V3',
        apiKey: process.env.SILICONFLOW_API_KEY
      });
    }
    
    // DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      this.registerProvider({
        provider: 'deepseek',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY
      });
    }
    
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.registerProvider({
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.registerProvider({
        provider: 'anthropic',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    
    // Moonshot
    if (process.env.MOONSHOT_API_KEY) {
      this.registerProvider({
        provider: 'moonshot',
        model: process.env.MOONSHOT_MODEL || 'moonshot-v1-8k',
        apiKey: process.env.MOONSHOT_API_KEY
      });
    }
    
    // 智谱
    if (process.env.ZHIPU_API_KEY) {
      this.registerProvider({
        provider: 'zhipu',
        model: process.env.ZHIPU_MODEL || 'glm-4',
        apiKey: process.env.ZHIPU_API_KEY
      });
    }
    
    console.log(`[ModelDispatcher] 从环境变量加载了 ${this.configs.size} 个服务商`);
  }
  
  /**
   * 根据任务类型选择最佳模型
   */
  selectModel(taskType: TaskType): ModelConfig | null {
    const recommendations = RECOMMENDED_MODELS[taskType];
    
    for (const rec of recommendations) {
      const config = this.configs.get(rec.provider);
      if (config) {
        return { ...config, model: rec.model };
      }
    }
    
    // 回退到任何可用的服务商
    const firstConfig = this.configs.values().next().value;
    return firstConfig || null;
  }
  
  /**
   * 分析任务类型
   */
  analyzeTaskType(message: string): TaskType {
    const lowerMsg = message.toLowerCase();
    
    // 代码相关
    if (/代码|code|编程|函数|function|class|bug|debug|实现|开发/.test(lowerMsg)) {
      return 'coding';
    }
    
    // 推理相关
    if (/为什么|分析|原因|推理|证明|逻辑|思考|explain|why|how/.test(lowerMsg)) {
      return 'reasoning';
    }
    
    // 创意相关
    if (/写|创作|故事|文案|标题|slogan|创意|想象/.test(lowerMsg)) {
      return 'creative';
    }
    
    // 数据分析
    if (/数据|统计|分析|报表|趋势|对比|总结/.test(lowerMsg)) {
      return 'analysis';
    }
    
    // 简短问题用快速模型
    if (message.length < 20) {
      return 'fast';
    }
    
    return 'chat';
  }
  
  /**
   * 智能调用 AI
   */
  async chat(
    messages: ChatMessage[],
    options?: {
      taskType?: TaskType;
      provider?: AIProvider;
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<AICallResult> {
    const startTime = Date.now();
    
    // 确定使用的模型
    let config: ModelConfig | null = null;
    
    if (options?.provider) {
      config = this.configs.get(options.provider) || null;
      if (config && options.model) {
        config = { ...config, model: options.model };
      }
    } else {
      const taskType = options?.taskType || this.analyzeTaskType(messages[messages.length - 1]?.content || '');
      config = this.selectModel(taskType);
      console.log(`[ModelDispatcher] 任务类型: ${taskType}`);
    }
    
    if (!config) {
      return {
        success: false,
        error: '没有可用的 AI 服务商，请配置 API Key'
      };
    }
    
    console.log(`[ModelDispatcher] 使用模型: ${config.provider}/${config.model}`);
    
    try {
      const result = await this.callProvider(config, messages, {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature
      });
      
      result.latency = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error(`[ModelDispatcher] 调用失败:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      };
    }
  }
  
  /**
   * 调用具体服务商
   */
  private async callProvider(
    config: ModelConfig,
    messages: ChatMessage[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AICallResult> {
    // Anthropic 使用不同的 API 格式
    if (config.provider === 'anthropic') {
      return this.callAnthropic(config, messages, options);
    }
    
    // 其他服务商使用 OpenAI 兼容格式
    const baseUrl = config.baseUrl || PROVIDER_ENDPOINTS[config.provider];
    const url = `${baseUrl}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: options?.maxTokens || config.maxTokens || 2048,
        temperature: options?.temperature ?? config.temperature ?? 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    
    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
    
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      model: config.model,
      provider: config.provider
    };
  }
  
  /**
   * 调用 Anthropic
   */
  private async callAnthropic(
    config: ModelConfig,
    messages: ChatMessage[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<AICallResult> {
    const url = `${PROVIDER_ENDPOINTS.anthropic}/messages`;
    
    // 分离 system 消息
    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: options?.maxTokens || config.maxTokens || 2048,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic Error: ${response.status} - ${error}`);
    }
    
    const data = await response.json() as {
      content?: Array<{ text?: string }>;
      usage?: {
        input_tokens: number;
        output_tokens: number;
      };
    };
    
    return {
      success: true,
      content: data.content?.[0]?.text || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      } : undefined,
      model: config.model,
      provider: config.provider
    };
  }
  
  /**
   * 获取已注册的服务商列表
   */
  getRegisteredProviders(): AIProvider[] {
    return Array.from(this.configs.keys());
  }
  
  /**
   * 检查服务商是否可用
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return this.configs.has(provider);
  }
}

/**
 * 创建模型调度器实例
 */
export function createModelDispatcher(): ModelDispatcher {
  const dispatcher = new ModelDispatcher();
  dispatcher.loadFromEnv();
  return dispatcher;
}

// 单例
let dispatcherInstance: ModelDispatcher | null = null;

export function getModelDispatcher(): ModelDispatcher {
  if (!dispatcherInstance) {
    dispatcherInstance = createModelDispatcher();
  }
  return dispatcherInstance;
}
