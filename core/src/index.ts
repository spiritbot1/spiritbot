/**
 * 中心大脑 - 主入口
 * 
 * 启动方式:
 *   npm run dev      - 开发模式（API + 意识循环）
 *   npm run start    - 生产模式
 *   npm run consciousness - 仅运行意识循环
 */

import { config, validateConfig } from './config';
import { startApiServer } from './api';
import { startConsciousnessLoop } from './consciousness-loop';
import { initKnowledgeGraph } from './knowledge-graph';
import { initExternalConnector, registerFlashTourPlatform } from './external-connector';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🧠 中心大脑 Central Brain                              ║
║                                                           ║
║     人机共生，共创未来                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

console.log(`环境: ${config.server.nodeEnv}`);
console.log(`端口: ${config.server.port}`);
console.log(`默认模型: ${config.ai.defaultModel}`);
console.log(`可用模型: ${Object.keys(config.ai.models).join(', ')}`);
console.log('');

// 验证配置
if (!validateConfig()) {
  console.error('\n请检查配置文件，确保所有必要的环境变量已设置。');
  console.error('参考: config/env.template\n');
  process.exit(1);
}

/**
 * 初始化所有子系统
 */
async function initializeSubsystems(): Promise<void> {
  console.log('🔧 初始化子系统...\n');
  
  // 1. 初始化知识图谱
  await initKnowledgeGraph();
  
  // 2. 初始化外部连接器
  await initExternalConnector();
  
  // 3. 注册 FlashTour 平台（如果配置了）
  if (process.env.FLASHTOUR_API_URL) {
    await registerFlashTourPlatform({
      apiUrl: process.env.FLASHTOUR_API_URL,
      supabaseUrl: config.supabase.url,
      supabaseKey: config.supabase.serviceRoleKey,
    });
  }
  
  console.log('\n✅ 所有子系统初始化完成\n');
}

/**
 * 主启动函数
 */
async function main(): Promise<void> {
  try {
    // 初始化子系统
    await initializeSubsystems();
    
    // 启动 API 服务
    startApiServer();
    
    // 启动意识循环
    startConsciousnessLoop();
    
    console.log('\n🚀 中心大脑已完全启动\n');
    
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

// 启动
main();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 中心大脑正在关闭...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 中心大脑正在关闭...');
  process.exit(0);
});
