/**
 * 中心大脑配置管理
 */
import 'dotenv/config';

export const config = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // AI 模型 - 多模型智能调度
  ai: {
    apiKey: process.env.SILICONFLOW_API_KEY || '',
    baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
    // 默认模型（轻量快速）
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    // 模型能力映射
    models: {
      // 轻量级 - 简单问答、闲聊
      light: 'Qwen/Qwen2.5-7B-Instruct',
      // 标准级 - 一般任务
      standard: 'Qwen/Qwen2.5-32B-Instruct',
      // 强力级 - 复杂分析、长文本
      powerful: 'Qwen/Qwen2.5-72B-Instruct',
      // 推理级 - 数学、逻辑、深度思考
      reasoning: 'deepseek-ai/DeepSeek-R1',
      // 代码级 - 编程任务
      coding: 'deepseek-ai/DeepSeek-V2.5',
    },
  },

  // 意识循环
  consciousness: {
    intervalMinutes: parseInt(process.env.CONSCIOUSNESS_INTERVAL || '30'),
    enableLearning: process.env.ENABLE_AUTONOMOUS_LEARNING !== 'false',
    enableCuriosity: process.env.ENABLE_CURIOSITY_ENGINE !== 'false',
  },

  // 服务
  server: {
    port: parseInt(process.env.PORT || '3100'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // 创造者
  creator: {
    userId: process.env.CREATOR_USER_ID || '',
  },
};

// 验证必要配置
export function validateConfig(): boolean {
  const errors: string[] = [];

  if (!config.supabase.url) errors.push('SUPABASE_URL is required');
  if (!config.supabase.serviceRoleKey) errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  if (!config.ai.apiKey) errors.push('SILICONFLOW_API_KEY is required');

  if (errors.length > 0) {
    console.error('❌ 配置错误:');
    errors.forEach(e => console.error(`   - ${e}`));
    return false;
  }

  return true;
}

