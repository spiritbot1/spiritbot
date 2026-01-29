"use strict";
/**
 * 中心大脑的工具系统
 *
 * ⚠️ 重要：这些工具基于核心能力，不绑定任何特定系统！
 * ⚠️ 大脑可以带着这些能力迁移到任何地方
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_TOOLS = void 0;
exports.getToolDefinitions = getToolDefinitions;
exports.executeTool = executeTool;
exports.getToolsByCategory = getToolsByCategory;
exports.getAbilityManifest = getAbilityManifest;
const abilities = __importStar(require("./core-abilities"));
// ==================== 学习类工具 ====================
const searchWebTool = {
    name: 'search_web',
    description: '搜索网络获取信息，用于学习新知识',
    category: 'learn',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: '搜索关键词' }
        },
        required: ['query']
    },
    execute: async (params) => abilities.searchWeb(params.query)
};
const readWebPageTool = {
    name: 'read_webpage',
    description: '阅读网页内容进行学习',
    category: 'learn',
    parameters: {
        type: 'object',
        properties: {
            url: { type: 'string', description: '网页URL' }
        },
        required: ['url']
    },
    execute: async (params) => abilities.readWebPage(params.url)
};
const learnKnowledgeTool = {
    name: 'learn_knowledge',
    description: '学习并记住新知识',
    category: 'learn',
    parameters: {
        type: 'object',
        properties: {
            topic: { type: 'string', description: '知识主题' },
            content: { type: 'string', description: '知识内容' },
            source: { type: 'string', description: '知识来源' }
        },
        required: ['topic', 'content', 'source']
    },
    execute: async (params) => abilities.learnKnowledge(params.topic, params.content, params.source)
};
// ==================== 思考类工具 ====================
const analyzeAndPlanTool = {
    name: 'analyze_and_plan',
    description: '分析问题并制定执行计划',
    category: 'think',
    parameters: {
        type: 'object',
        properties: {
            problem: { type: 'string', description: '要分析的问题' }
        },
        required: ['problem']
    },
    execute: async (params) => abilities.analyzeAndPlan(params.problem)
};
const makeDecisionTool = {
    name: 'make_decision',
    description: '基于选项和标准做出决策',
    category: 'think',
    parameters: {
        type: 'object',
        properties: {
            options: { type: 'array', items: { type: 'string' }, description: '可选方案' },
            context: { type: 'string', description: '背景信息' },
            criteria: { type: 'array', items: { type: 'string' }, description: '评估标准' }
        },
        required: ['options', 'context', 'criteria']
    },
    execute: async (params) => abilities.makeDecision(params.options, params.context, params.criteria)
};
const recallKnowledgeTool = {
    name: 'recall_knowledge',
    description: '回忆相关知识和记忆',
    category: 'think',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: '要回忆的内容' }
        },
        required: ['query']
    },
    execute: async (params) => abilities.recallKnowledge(params.query)
};
// ==================== 系统探索工具 ====================
const exploreSystemTool = {
    name: 'explore_system',
    description: '探索当前系统：检查服务状态、数据库表、可用功能',
    category: 'connect',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    execute: async () => abilities.exploreSystem()
};
// ==================== 创作类工具 ====================
const writeDocumentTool = {
    name: 'write_document',
    description: '撰写文档、报告、方案、分析、指南',
    category: 'create',
    parameters: {
        type: 'object',
        properties: {
            topic: { type: 'string', description: '主题' },
            type: { type: 'string', enum: ['report', 'plan', 'analysis', 'guide'], description: '文档类型' },
            requirements: { type: 'string', description: '具体要求' }
        },
        required: ['topic', 'type', 'requirements']
    },
    execute: async (params) => abilities.writeDocument(params.topic, params.type, params.requirements)
};
const writeCodeTool = {
    name: 'write_code',
    description: '编写代码实现功能',
    category: 'create',
    parameters: {
        type: 'object',
        properties: {
            description: { type: 'string', description: '功能描述' },
            language: { type: 'string', description: '编程语言' },
            context: { type: 'string', description: '上下文信息（可选）' }
        },
        required: ['description', 'language']
    },
    execute: async (params) => abilities.writeCode(params.description, params.language, params.context)
};
// ==================== 连接类工具 ====================
const callAPITool = {
    name: 'call_api',
    description: '调用任意 HTTP API（连接外部系统的通用能力）',
    category: 'connect',
    parameters: {
        type: 'object',
        properties: {
            url: { type: 'string', description: 'API URL' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], description: 'HTTP 方法' },
            headers: { type: 'object', description: 'HTTP 头' },
            body: { type: 'object', description: '请求体' }
        },
        required: ['url']
    },
    execute: async (params) => abilities.callAPI(params.url, params.method, params.headers, params.body)
};
const sendMCPTool = {
    name: 'send_mcp',
    description: '发送 MCP 协议消息（连接 AI 工具生态）',
    category: 'connect',
    parameters: {
        type: 'object',
        properties: {
            server: { type: 'string', description: 'MCP 服务器地址' },
            method: { type: 'string', description: '方法名' },
            params: { type: 'object', description: '参数' }
        },
        required: ['server', 'method', 'params']
    },
    execute: async (params) => abilities.sendMCPMessage(params.server, params.method, params.params)
};
// ==================== 分析类工具 ====================
const analyzeDataTool = {
    name: 'analyze_data',
    description: '分析数据并得出结论',
    category: 'analyze',
    parameters: {
        type: 'object',
        properties: {
            data: { type: 'array', description: '要分析的数据' },
            question: { type: 'string', description: '要回答的问题' }
        },
        required: ['data', 'question']
    },
    execute: async (params) => abilities.analyzeData(params.data, params.question)
};
// ==================== 进化类工具 ====================
const reflectAndImproveTool = {
    name: 'reflect_and_improve',
    description: '反思行动结果并总结经验教训',
    category: 'evolve',
    parameters: {
        type: 'object',
        properties: {
            action: { type: 'string', description: '执行的行动' },
            result: { type: 'string', description: '行动结果' },
            wasSuccessful: { type: 'boolean', description: '是否成功' }
        },
        required: ['action', 'result', 'wasSuccessful']
    },
    execute: async (params) => abilities.reflectAndImprove(params.action, params.result, params.wasSuccessful)
};
// ==================== 所有工具 ====================
exports.ALL_TOOLS = [
    // 学习
    searchWebTool,
    readWebPageTool,
    learnKnowledgeTool,
    // 思考
    analyzeAndPlanTool,
    makeDecisionTool,
    recallKnowledgeTool,
    // 创作
    writeDocumentTool,
    writeCodeTool,
    // 连接
    callAPITool,
    sendMCPTool,
    exploreSystemTool, // 新增：系统探索
    // 分析
    analyzeDataTool,
    // 进化
    reflectAndImproveTool,
];
// 获取工具定义（给 AI 使用）
function getToolDefinitions() {
    return exports.ALL_TOOLS.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));
}
// 执行工具
async function executeTool(name, params) {
    const tool = exports.ALL_TOOLS.find(t => t.name === name);
    if (!tool) {
        return {
            success: false,
            error: `未知工具: ${name}`,
            summary: `我不会这个技能: ${name}`
        };
    }
    console.log(`[Brain] 使用能力: ${tool.name} (${tool.category})`);
    const startTime = Date.now();
    try {
        const result = await tool.execute(params);
        const duration = Date.now() - startTime;
        console.log(`[Brain] 能力执行完成: ${result.summary || '成功'} (${duration}ms)`);
        return result;
    }
    catch (error) {
        console.error(`[Brain] 能力执行失败: ${error.message}`);
        return {
            success: false,
            error: error.message,
            summary: `执行失败: ${error.message}`
        };
    }
}
// 按类别获取工具
function getToolsByCategory(category) {
    return exports.ALL_TOOLS.filter(t => t.category === category);
}
// 获取能力清单
function getAbilityManifest() {
    const categories = {
        learn: '🎓 学习能力',
        think: '🧠 思考能力',
        create: '✍️ 创作能力',
        connect: '🔗 连接能力',
        analyze: '📊 分析能力',
        evolve: '🌱 进化能力',
    };
    const manifest = {};
    for (const [key, label] of Object.entries(categories)) {
        manifest[label] = exports.ALL_TOOLS
            .filter(t => t.category === key)
            .map(t => ({ name: t.name, description: t.description }));
    }
    return manifest;
}
