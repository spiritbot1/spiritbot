/**
 * 记忆金字塔系统
 *
 * 模拟人脑的记忆机制：
 * 1. 工作记忆（瞬时）- 当前对话上下文
 * 2. 短期记忆（小时级）- 最近的交互
 * 3. 中期记忆（天级）- 重要事件和决策
 * 4. 长期记忆（永久）- 核心知识和价值观
 *
 * 记忆会随时间自动淡化和整合
 */
export type MemoryLevel = 'working' | 'short_term' | 'medium_term' | 'long_term';
export interface Memory {
    id?: string;
    level: MemoryLevel;
    content: string;
    summary?: string;
    importance: number;
    emotional_weight?: number;
    access_count: number;
    last_accessed?: string;
    associations?: string[];
    metadata?: {
        source?: string;
        context?: string;
        tags?: string[];
    };
    created_at?: string;
    expires_at?: string;
}
export interface MemoryConsolidation {
    from_level: MemoryLevel;
    to_level: MemoryLevel;
    memories_processed: number;
    memories_promoted: number;
    memories_discarded: number;
    timestamp: string;
}
/**
 * 添加工作记忆
 */
export declare function addWorkingMemory(content: string, importance?: number): void;
/**
 * 获取工作记忆
 */
export declare function getWorkingMemory(): Memory[];
/**
 * 清空工作记忆
 */
export declare function clearWorkingMemory(): void;
/**
 * 保存记忆到数据库
 */
export declare function saveMemory(memory: Memory): Promise<string | null>;
/**
 * 获取某级别的记忆
 */
export declare function getMemoriesByLevel(level: MemoryLevel, limit?: number): Promise<Memory[]>;
/**
 * 搜索记忆
 */
export declare function searchMemories(query: string, level?: MemoryLevel, limit?: number): Promise<Memory[]>;
/**
 * 访问记忆（增加访问计数，可能触发晋升）
 */
export declare function accessMemory(memoryId: string): Promise<void>;
/**
 * 记忆衰减处理
 */
export declare function processMemoryDecay(): Promise<{
    decayed: number;
    removed: number;
}>;
/**
 * 记忆整合（定期执行）
 */
export declare function consolidateMemories(): Promise<MemoryConsolidation[]>;
/**
 * 回忆相关内容（用于对话时检索相关记忆）
 */
export declare function recall(query: string, maxMemories?: number): Promise<Memory[]>;
/**
 * 从对话创建记忆
 */
export declare function rememberConversation(userMessage: string, assistantResponse: string, importance?: number): Promise<void>;
/**
 * 获取记忆统计
 */
export declare function getMemoryStats(): Promise<{
    working: number;
    short_term: number;
    medium_term: number;
    long_term: number;
    total: number;
}>;
