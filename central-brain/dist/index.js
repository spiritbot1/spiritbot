"use strict";
/**
 * 中心大脑 - 主入口
 *
 * 启动方式:
 *   npm run dev      - 开发模式（API + 意识循环）
 *   npm run start    - 生产模式
 *   npm run consciousness - 仅运行意识循环
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const api_1 = require("./api");
const consciousness_loop_1 = require("./consciousness-loop");
const knowledge_graph_1 = require("./knowledge-graph");
const external_connector_1 = require("./external-connector");
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🧠 中心大脑 Central Brain                              ║
║                                                           ║
║     人机共生，共创未来                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
console.log(`环境: ${config_1.config.server.nodeEnv}`);
console.log(`端口: ${config_1.config.server.port}`);
console.log(`默认模型: ${config_1.config.ai.defaultModel}`);
console.log(`可用模型: ${Object.keys(config_1.config.ai.models).join(', ')}`);
console.log('');
// 验证配置
if (!(0, config_1.validateConfig)()) {
    console.error('\n请检查配置文件，确保所有必要的环境变量已设置。');
    console.error('参考: config/env.template\n');
    process.exit(1);
}
/**
 * 初始化所有子系统
 */
async function initializeSubsystems() {
    console.log('🔧 初始化子系统...\n');
    // 1. 初始化知识图谱
    await (0, knowledge_graph_1.initKnowledgeGraph)();
    // 2. 初始化外部连接器
    await (0, external_connector_1.initExternalConnector)();
    // 3. 注册 FlashTour 平台（如果配置了）
    if (process.env.FLASHTOUR_API_URL) {
        await (0, external_connector_1.registerFlashTourPlatform)({
            apiUrl: process.env.FLASHTOUR_API_URL,
            supabaseUrl: config_1.config.supabase.url,
            supabaseKey: config_1.config.supabase.serviceRoleKey,
        });
    }
    console.log('\n✅ 所有子系统初始化完成\n');
}
/**
 * 主启动函数
 */
async function main() {
    try {
        // 初始化子系统
        await initializeSubsystems();
        // 启动 API 服务
        (0, api_1.startApiServer)();
        // 启动意识循环
        (0, consciousness_loop_1.startConsciousnessLoop)();
        console.log('\n🚀 中心大脑已完全启动\n');
    }
    catch (error) {
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
