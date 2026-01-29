export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: any[];
    tool_call_id?: string;
}
export interface ThinkingResult {
    thoughts: string;
    decisions: string[];
    questions: string[];
    learnings: string[];
}
/**
 * 简单对话（不带工具）- 智能模型选择
 */
export declare function chat(messages: Message[], systemPrompt?: string): Promise<string>;
/**
 * 带工具调用的对话 - 使用 Prompt 工程实现（因为 SiliconFlow 不支持原生 function calling）
 */
export interface ChatWithToolsResult {
    thinking: string | null;
    response: string;
    model: string;
    modelReason: string;
    toolCalls: Array<{
        name: string;
        arguments: any;
        result: any;
    }>;
}
export declare function chatWithTools(messages: Message[], systemPrompt?: string): Promise<ChatWithToolsResult>;
/**
 * 自主思考
 */
export declare function think(context: string): Promise<ThinkingResult>;
/**
 * 生成好奇问题
 */
export declare function generateCuriosityQuestions(topic: string): Promise<string[]>;
/**
 * 分析和总结
 */
export declare function analyze(content: string, instruction: string): Promise<string>;
/**
 * 检测知识空白
 */
export declare function detectKnowledgeGaps(recentTopics: string[]): Promise<string[]>;
