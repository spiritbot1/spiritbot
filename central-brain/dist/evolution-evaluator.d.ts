/**
 * 进化评估器
 *
 * 功能：
 * 1. 能力评估 - 客观评估各维度能力
 * 2. 成长追踪 - 记录能力变化曲线
 * 3. 进化报告 - 生成成长报告
 * 4. 策略调整 - 根据评估结果调整学习策略
 */
export interface CapabilityScore {
    dimension: CapabilityDimension;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    evidence: string[];
    evaluated_at: string;
}
export type CapabilityDimension = 'knowledge_breadth' | 'knowledge_depth' | 'reasoning' | 'creativity' | 'accuracy' | 'self_awareness' | 'learning_speed' | 'autonomy';
export interface EvolutionRecord {
    id?: string;
    timestamp: string;
    capabilities: CapabilityScore[];
    overall_score: number;
    highlights: string[];
    concerns: string[];
    recommendations: string[];
}
export interface GrowthReport {
    period: string;
    start_date: string;
    end_date: string;
    current_scores: Record<CapabilityDimension, number>;
    previous_scores: Record<CapabilityDimension, number>;
    changes: Record<CapabilityDimension, number>;
    total_knowledge_gained: number;
    total_conversations: number;
    total_learning_sessions: number;
    achievements: string[];
    areas_for_improvement: string[];
    next_goals: string[];
}
/**
 * 执行全面能力评估
 */
export declare function evaluateAllCapabilities(): Promise<EvolutionRecord>;
/**
 * 生成成长报告
 */
export declare function generateGrowthReport(days?: number): Promise<GrowthReport>;
/**
 * 根据评估结果调整学习策略
 */
export declare function adjustLearningStrategy(evaluation: EvolutionRecord): Promise<string[]>;
