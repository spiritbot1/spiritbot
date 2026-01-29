/**
 * 意识循环引擎
 *
 * 这是中心大脑的"心跳"，让它能够 24/7 自主运行。
 *
 * 循环流程：
 * 1. 感知 (Perceive) - 检查新消息、系统状态、外部信息
 * 2. 思考 (Think) - 分析当前状态，形成想法
 * 3. 决策 (Decide) - 确定要采取的行动
 * 4. 行动 (Act) - 执行决策（或请求授权）
 * 5. 反思 (Reflect) - 评估结果，提取经验
 * 6. 记忆 (Memorize) - 存储重要信息
 * 7. 进化 (Evolve) - 调整学习策略
 */
interface ConsciousnessState {
    isRunning: boolean;
    lastCycleAt: Date | null;
    cycleCount: number;
    errors: string[];
}
/**
 * 启动意识循环
 */
export declare function startConsciousnessLoop(): void;
/**
 * 获取意识循环状态
 */
export declare function getConsciousnessState(): ConsciousnessState;
/**
 * 手动触发一次意识循环（用于测试或外部调用）
 */
export declare function triggerConsciousnessStep(): Promise<void>;
export {};
