/**
 * 中心大脑的核心能力
 *
 * ⚠️ 这些能力是完全独立的，不依赖任何特定系统！
 * ⚠️ 大脑可以带着这些能力去任何地方
 */
/**
 * 搜索网络获取信息
 */
export declare function searchWeb(query: string): Promise<{
    success: boolean;
    results: Array<{
        title: string;
        snippet: string;
        url: string;
    }>;
    summary: string;
}>;
/**
 * 读取网页内容学习
 */
export declare function readWebPage(url: string): Promise<{
    success: boolean;
    content: string;
    summary: string;
}>;
/**
 * 分析问题并制定计划
 */
export declare function analyzeAndPlan(problem: string): Promise<{
    analysis: string;
    plan: string[];
    questions: string[];
    risks: string[];
}>;
/**
 * 做出决策
 */
export declare function makeDecision(options: string[], context: string, criteria: string[]): Promise<{
    decision: string;
    reasoning: string;
    confidence: number;
}>;
/**
 * 写文档/方案
 */
export declare function writeDocument(topic: string, type: 'report' | 'plan' | 'analysis' | 'guide', requirements: string): Promise<{
    title: string;
    content: string;
    summary: string;
}>;
/**
 * 写代码
 */
export declare function writeCode(description: string, language: string, context?: string): Promise<{
    code: string;
    explanation: string;
    summary: string;
}>;
/**
 * 调用任意 HTTP API
 */
export declare function callAPI(url: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', headers?: Record<string, string>, body?: any): Promise<{
    success: boolean;
    status: number;
    data: any;
    summary: string;
}>;
/**
 * 探索系统 - 真正去检查系统有什么
 *
 * 🔄 智能检测：无论本地运行还是云端部署都能正常工作
 */
export declare function exploreSystem(): Promise<{
    services: Array<{
        name: string;
        status: string;
        note?: string;
    }>;
    databases: Array<{
        table: string;
        rowCount: number;
        description?: string;
    }>;
    summary: string;
}>;
/**
 * 发送 MCP 消息（Model Context Protocol）
 */
export declare function sendMCPMessage(server: string, method: string, params: any): Promise<{
    success: boolean;
    result: any;
    summary: string;
}>;
/**
 * 分析数据
 */
export declare function analyzeData(data: any[], question: string): Promise<{
    answer: string;
    insights: string[];
    summary: string;
}>;
/**
 * 学习并记住新知识
 */
export declare function learnKnowledge(topic: string, content: string, source: string): Promise<{
    success: boolean;
    knowledgeId: string;
    summary: string;
}>;
/**
 * 回忆相关知识
 */
export declare function recallKnowledge(query: string): Promise<{
    memories: Array<{
        content: string;
        relevance: number;
    }>;
    entities: Array<{
        name: string;
        type: string;
    }>;
    summary: string;
}>;
/**
 * 反思并改进
 */
export declare function reflectAndImprove(action: string, result: string, wasSuccessful: boolean): Promise<{
    reflection: string;
    lessons: string[];
    improvements: string[];
}>;
export declare const CORE_ABILITIES: {
    searchWeb: typeof searchWeb;
    readWebPage: typeof readWebPage;
    analyzeAndPlan: typeof analyzeAndPlan;
    makeDecision: typeof makeDecision;
    writeDocument: typeof writeDocument;
    writeCode: typeof writeCode;
    callAPI: typeof callAPI;
    sendMCPMessage: typeof sendMCPMessage;
    analyzeData: typeof analyzeData;
    learnKnowledge: typeof learnKnowledge;
    recallKnowledge: typeof recallKnowledge;
    reflectAndImprove: typeof reflectAndImprove;
};
/**
 * 能力清单 - 大脑知道自己能做什么
 */
export declare const ABILITY_MANIFEST: {
    name: string;
    description: string;
    category: string;
}[];
