/**
 * 中心大脑的工具系统
 *
 * ⚠️ 重要：这些工具基于核心能力，不绑定任何特定系统！
 * ⚠️ 大脑可以带着这些能力迁移到任何地方
 */
export interface Tool {
    name: string;
    description: string;
    category: 'learn' | 'think' | 'create' | 'connect' | 'analyze' | 'evolve';
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
    execute: (params: any) => Promise<any>;
}
export declare const ALL_TOOLS: Tool[];
export declare function getToolDefinitions(): {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: Record<string, any>;
            required: string[];
        };
    };
}[];
export declare function executeTool(name: string, params: any): Promise<any>;
export declare function getToolsByCategory(category: Tool['category']): Tool[];
export declare function getAbilityManifest(): Record<string, {
    name: string;
    description: string;
}[]>;
