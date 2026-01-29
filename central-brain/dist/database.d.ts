/**
 * 数据库连接和操作
 */
import { SupabaseClient } from '@supabase/supabase-js';
export declare function getDatabase(): SupabaseClient;
export declare function getBrainState(key: string): Promise<any>;
export declare function setBrainState(key: string, value: any, description?: string): Promise<void>;
export interface Knowledge {
    id?: string;
    category: string;
    title: string;
    content: string;
    source?: string;
    confidence?: number;
    tags?: string[];
}
export declare function saveKnowledge(knowledge: Knowledge): Promise<string | null>;
export declare function searchKnowledge(query: string, category?: string): Promise<Knowledge[]>;
export interface LearningLog {
    topic: string;
    source?: string;
    summary?: string;
    insights?: any[];
    questions_generated?: string[];
}
export declare function saveLearningLog(log: LearningLog): Promise<void>;
export interface Task {
    id?: string;
    type: string;
    title: string;
    description?: string;
    priority?: number;
    status?: string;
    requires_approval?: boolean;
    metadata?: any;
}
export declare function createTask(task: Task): Promise<string | null>;
export declare function getPendingTasks(): Promise<Task[]>;
export declare function updateTaskStatus(taskId: string, status: string, result?: any): Promise<void>;
