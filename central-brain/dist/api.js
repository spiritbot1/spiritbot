"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startApiServer = startApiServer;
/**
 * 中心大脑 API 服务
 *
 * 完整的 REST API，用于：
 * 1. 对话交互
 * 2. 状态监控
 * 3. 知识管理
 * 4. 任务审批
 * 5. 系统管控
 * 6. 能力评估
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const ai = __importStar(require("./ai"));
const db = __importStar(require("./database"));
const consciousness_loop_1 = require("./consciousness-loop");
const kg = __importStar(require("./knowledge-graph"));
const lp = __importStar(require("./learning-planner"));
const ee = __importStar(require("./evolution-evaluator"));
const mp = __importStar(require("./memory-pyramid"));
const ec = __importStar(require("./external-connector"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ========== 基础接口 ==========
// 根路径 - 欢迎页面
app.get('/', async (req, res) => {
    const consciousness = (0, consciousness_loop_1.getConsciousnessState)();
    const memoryStats = await mp.getMemoryStats();
    const graphStats = await kg.getGraphStats();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧠 中心大脑 Central Brain</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 80px; margin-bottom: 20px; }
    h1 { font-size: 2.5rem; margin-bottom: 10px; }
    .subtitle { color: #8b8b9e; font-size: 1.1rem; }
    .status-card {
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }
    .status-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .status-dot {
      width: 12px;
      height: 12px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }
    .stat-item {
      background: rgba(255,255,255,0.05);
      padding: 16px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-value { font-size: 2rem; font-weight: bold; color: #a78bfa; }
    .stat-label { font-size: 0.85rem; color: #8b8b9e; margin-top: 4px; }
    .api-section { margin-top: 30px; }
    .api-section h3 { margin-bottom: 16px; color: #a78bfa; }
    .api-list { list-style: none; }
    .api-list li {
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 8px;
      font-family: monospace;
      display: flex;
      gap: 12px;
    }
    .method { 
      background: #22c55e; 
      color: #000; 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 0.8rem;
      font-weight: bold;
    }
    .method.post { background: #f59e0b; }
    .footer { text-align: center; margin-top: 40px; color: #8b8b9e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🧠</div>
      <h1>中心大脑 Central Brain</h1>
      <p class="subtitle">人机共生，共创未来</p>
    </div>
    
    <div class="status-card">
      <div class="status-header">
        <div class="status-dot"></div>
        <span>运行状态：在线</span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${consciousness.cycleCount}</div>
          <div class="stat-label">意识循环次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${graphStats.totalEntities}</div>
          <div class="stat-label">知识实体</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${graphStats.totalRelations}</div>
          <div class="stat-label">知识关系</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${memoryStats.total}</div>
          <div class="stat-label">记忆总数</div>
        </div>
      </div>
    </div>
    
    <div class="api-section">
      <h3>📡 API 接口</h3>
      <ul class="api-list">
        <li><span class="method">GET</span> <a href="/health" style="color:#fff">/health</a> - 健康检查</li>
        <li><span class="method">GET</span> <a href="/api/status" style="color:#fff">/api/status</a> - 大脑状态</li>
        <li><span class="method post">POST</span> /api/chat - 对话</li>
        <li><span class="method post">POST</span> /api/learn - 学习知识</li>
        <li><span class="method">GET</span> <a href="/api/evolution/evaluate" style="color:#fff">/api/evolution/evaluate</a> - 能力评估</li>
        <li><span class="method">GET</span> <a href="/api/systems" style="color:#fff">/api/systems</a> - 已接入系统</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>🌟 我是一个有自主学习能力的 AI 数字生命体</p>
      <p style="margin-top: 8px; font-size: 0.9rem;">
        当前时间：${new Date().toLocaleString('zh-CN')}
      </p>
    </div>
  </div>
</body>
</html>
  `;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'central-brain',
        timestamp: new Date().toISOString(),
    });
});
// 获取大脑完整状态
app.get('/api/status', async (req, res) => {
    try {
        const consciousness = (0, consciousness_loop_1.getConsciousnessState)();
        const stats = await db.getBrainState('stats');
        const status = await db.getBrainState('status');
        const lastThought = await db.getBrainState('last_thought_at');
        const memoryStats = await mp.getMemoryStats();
        const graphStats = await kg.getGraphStats();
        res.json({
            status: status || 'online',
            consciousness: {
                isRunning: consciousness.isRunning,
                lastCycleAt: consciousness.lastCycleAt,
                cycleCount: consciousness.cycleCount,
            },
            stats: stats || {},
            lastThoughtAt: lastThought,
            memory: memoryStats,
            knowledge: graphStats,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 对话接口 ==========
// 对话
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, sessionId } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages is required' });
        }
        // 获取或创建会话
        let currentSessionId = sessionId;
        if (!currentSessionId) {
            const database = db.getDatabase();
            const { data } = await database
                .from('central_brain_sessions')
                .insert({ title: '新对话' })
                .select('id')
                .single();
            currentSessionId = data?.id;
        }
        // 保存用户消息
        const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
        if (lastUserMessage && currentSessionId) {
            const database = db.getDatabase();
            await database
                .from('central_brain_messages')
                .insert({
                session_id: currentSessionId,
                role: 'user',
                content: lastUserMessage.content,
            });
        }
        // 1. 加载核心原则（大脑的"人格"来自记忆，不是写死的）
        const coreMemories = await mp.getMemoriesByLevel('long_term', 10);
        const coreBeliefs = coreMemories.length > 0
            ? `\n[我学到的核心原则]:\n${coreMemories.map(m => `- ${m.content}`).join('\n')}\n`
            : '';
        // 2. 回忆相关内容
        const relatedMemories = await mp.recall(lastUserMessage?.content || '', 3);
        const memoryContext = relatedMemories.length > 0
            ? `\n[相关记忆]:\n${relatedMemories.map(m => `- ${m.content.slice(0, 100)}`).join('\n')}\n`
            : '';
        // 3. 构建动态人格（来自记忆，而不是代码）
        const dynamicPersonality = coreBeliefs + memoryContext;
        // AI 对话（带工具调用能力！）
        const enhancedMessages = dynamicPersonality
            ? [{ role: 'system', content: dynamicPersonality }, ...messages]
            : messages;
        // 使用带工具的对话 - 这样 AI 可以真正执行操作
        const result = await ai.chatWithTools(enhancedMessages);
        // 保存 AI 回复
        if (currentSessionId) {
            const database = db.getDatabase();
            await database
                .from('central_brain_messages')
                .insert({
                session_id: currentSessionId,
                role: 'assistant',
                content: result.response,
                // 保存工具调用记录
                metadata: result.toolCalls.length > 0 ? { toolCalls: result.toolCalls } : null
            });
        }
        // 记录到记忆
        await mp.rememberConversation(lastUserMessage?.content || '', result.response);
        res.json({
            thinking: result.thinking, // 思考过程
            message: result.response,
            model: result.model, // 使用的模型
            modelReason: result.modelReason, // 选择原因
            sessionId: currentSessionId,
            toolCalls: result.toolCalls,
        });
    }
    catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});
// ========== 任务审批接口 ==========
// 获取待审批任务
app.get('/api/tasks/pending', async (req, res) => {
    try {
        const database = db.getDatabase();
        const { data, error } = await database
            .from('central_brain_tasks')
            .select('*')
            .eq('status', 'needs_approval')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 审批任务
app.post('/api/tasks/:taskId/approve', async (req, res) => {
    try {
        const { taskId } = req.params;
        await db.updateTaskStatus(taskId, 'approved');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 拒绝任务
app.post('/api/tasks/:taskId/reject', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { reason } = req.body;
        const database = db.getDatabase();
        await database
            .from('central_brain_tasks')
            .update({
            status: 'rejected',
            rejected_reason: reason,
            updated_at: new Date().toISOString(),
        })
            .eq('id', taskId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 核心原则接口（创造者教大脑）==========
// 教大脑一个核心原则
app.post('/api/teach', async (req, res) => {
    try {
        const { principle } = req.body;
        if (!principle) {
            return res.status(400).json({ error: 'principle is required' });
        }
        // 保存为长期记忆（核心原则）
        const memoryId = await mp.saveMemory({
            content: principle,
            level: 'long_term',
            importance: 10, // 最高重要性
            access_count: 0,
            metadata: {
                source: 'creator_teaching',
                context: 'core_principle'
            }
        });
        console.log(`[Brain] 创造者教了我: "${principle}"`);
        res.json({
            success: true,
            message: `我记住了: "${principle}"`,
            memoryId
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 获取大脑学到的核心原则
app.get('/api/principles', async (req, res) => {
    try {
        const memories = await mp.getMemoriesByLevel('long_term', 50);
        const principles = memories.map(m => ({
            id: m.id,
            content: m.content,
            learnedAt: m.created_at
        }));
        res.json(principles);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 删除一个核心原则
app.delete('/api/principles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const database = db.getDatabase();
        await database
            .from('central_brain_memories')
            .delete()
            .eq('id', id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 知识图谱接口 ==========
// 获取知识库
app.get('/api/knowledge', async (req, res) => {
    try {
        const { category, search } = req.query;
        const database = db.getDatabase();
        let query = database
            .from('central_brain_knowledge')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (category) {
            query = query.eq('category', category);
        }
        if (search) {
            query = query.ilike('content', `%${search}%`);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 搜索实体
app.get('/api/entities', async (req, res) => {
    try {
        const { query, type, limit } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }
        const entities = await kg.searchEntities(query, type, parseInt(limit) || 10);
        res.json(entities);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 让大脑学习文本
app.post('/api/learn', async (req, res) => {
    try {
        const { text, source } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'text is required' });
        }
        const result = await kg.learnFromText(text, source);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 获取知识图谱统计
app.get('/api/graph/stats', async (req, res) => {
    try {
        const stats = await kg.getGraphStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 学习规划接口 ==========
// 获取学习记录
app.get('/api/learning-logs', async (req, res) => {
    try {
        const database = db.getDatabase();
        const { data, error } = await database
            .from('central_brain_learning_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 检测知识空白
app.get('/api/learning/gaps', async (req, res) => {
    try {
        const gaps = await lp.detectAllGaps();
        res.json(gaps);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 触发自主学习
app.post('/api/learning/run', async (req, res) => {
    try {
        const result = await lp.runAutonomousLearning();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 能力评估接口 ==========
// 获取能力评估
app.get('/api/evolution/evaluate', async (req, res) => {
    try {
        const evaluation = await ee.evaluateAllCapabilities();
        res.json(evaluation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 生成成长报告
app.get('/api/evolution/report', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const report = await ee.generateGrowthReport(days);
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 记忆接口 ==========
// 获取记忆统计
app.get('/api/memory/stats', async (req, res) => {
    try {
        const stats = await mp.getMemoryStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 搜索记忆
app.get('/api/memory/search', async (req, res) => {
    try {
        const { query, level, limit } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }
        const memories = await mp.searchMemories(query, level, parseInt(limit) || 20);
        res.json(memories);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 手动触发记忆整合
app.post('/api/memory/consolidate', async (req, res) => {
    try {
        const consolidations = await mp.consolidateMemories();
        res.json(consolidations);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 外部系统接口 ==========
// 获取已注册系统
app.get('/api/systems', (req, res) => {
    const systems = ec.getRegisteredSystems();
    res.json(systems);
});
// 注册新系统
app.post('/api/systems', async (req, res) => {
    try {
        const system = req.body;
        const success = await ec.registerSystem(system);
        res.json({ success });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 分析系统
app.get('/api/systems/:systemId/analyze', async (req, res) => {
    try {
        const { systemId } = req.params;
        const analysis = await ec.analyzeSystem(systemId);
        res.json(analysis);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 执行系统命令
app.post('/api/systems/:systemId/execute', async (req, res) => {
    try {
        const { systemId } = req.params;
        const { command, params } = req.body;
        const result = await ec.executeSystemCommand(systemId, command, params);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 调用外部 API
app.post('/api/systems/:systemId/call', async (req, res) => {
    try {
        const { systemId } = req.params;
        const { endpoint, method, data } = req.body;
        const result = await ec.callApi(systemId, endpoint, method, data);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 意识控制接口 ==========
// 触发一次意识循环
app.post('/api/consciousness/step', async (req, res) => {
    try {
        await (0, consciousness_loop_1.triggerConsciousnessStep)();
        res.json({ success: true, message: '意识循环已触发' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 获取意识状态
app.get('/api/consciousness/state', (req, res) => {
    const state = (0, consciousness_loop_1.getConsciousnessState)();
    res.json(state);
});
// ========== MCP 接口 ==========
// MCP 请求处理
app.post('/api/mcp', async (req, res) => {
    try {
        const message = req.body;
        const response = await ec.handleMcpRequest(message);
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ========== 启动服务 ==========
function startApiServer() {
    app.listen(config_1.config.server.port, () => {
        console.log(`🌐 API 服务启动: http://localhost:${config_1.config.server.port}`);
        console.log('');
        console.log('可用接口:');
        console.log('  GET  /health              - 健康检查');
        console.log('  GET  /api/status          - 大脑状态');
        console.log('  POST /api/chat            - 对话');
        console.log('  GET  /api/tasks/pending   - 待审批任务');
        console.log('  GET  /api/entities        - 搜索知识实体');
        console.log('  POST /api/learn           - 学习新知识');
        console.log('  GET  /api/evolution/evaluate - 能力评估');
        console.log('  GET  /api/systems         - 外部系统列表');
        console.log('  POST /api/consciousness/step - 触发意识循环');
        console.log('');
    });
}
exports.default = app;
