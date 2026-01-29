/**
 * 学习规划器
 *
 * 功能：
 * 1. 识别知识空白 - 发现不知道什么
 * 2. 制定学习计划 - 决定学什么、怎么学
 * 3. 执行学习任务 - 自动学习新知识
 * 4. 评估学习效果 - 检验是否真的学会了
 */
export interface KnowledgeGap {
    id?: string;
    area: string;
    topic: string;
    urgency: 'high' | 'medium' | 'low';
    importance: 'high' | 'medium' | 'low';
    reason: string;
    discovered_at?: string;
    status: 'identified' | 'learning' | 'learned' | 'deferred';
}
export interface LearningPlan {
    id?: string;
    title: string;
    description: string;
    gaps: KnowledgeGap[];
    steps: LearningStep[];
    priority: number;
    estimated_time: string;
    status: 'planned' | 'in_progress' | 'completed' | 'abandoned';
    created_at?: string;
    started_at?: string;
    completed_at?: string;
}
export interface LearningStep {
    order: number;
    action: string;
    resource?: string;
    expected_outcome: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    result?: string;
}
/**
 * 分析最近的对话，发现知识空白
 */
export declare function analyzeConversationGaps(): Promise<KnowledgeGap[]>;
/**
 * 分析知识图谱，发现结构性空白
 */
export declare function analyzeGraphGaps(): Promise<KnowledgeGap[]>;
/**
 * 综合分析所有知识空白
 */
export declare function detectAllGaps(): Promise<KnowledgeGap[]>;
/**
 * 为知识空白制定学习计划
 */
export declare function createLearningPlan(gaps: KnowledgeGap[]): Promise<LearningPlan>;
/**
 * 执行学习步骤
 */
export declare function executeLearningSteep(step: LearningStep): Promise<{
    success: boolean;
    result: string;
    knowledgeGained: string[];
}>;
/**
 * 执行完整的学习计划
 */
export declare function executeLearningPlan(plan: LearningPlan): Promise<{
    completed: boolean;
    stepsCompleted: number;
    totalKnowledgeGained: string[];
}>;
/**
 * 运行一次自主学习
 */
export declare function runAutonomousLearning(): Promise<{
    gapsFound: number;
    planCreated: boolean;
    knowledgeGained: number;
}>;
