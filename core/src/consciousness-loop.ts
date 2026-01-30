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

import cron from 'node-cron';
import { config, validateConfig } from './config';
import * as db from './database';
import * as ai from './ai';

// 意识循环状态
interface ConsciousnessState {
  isRunning: boolean;
  lastCycleAt: Date | null;
  cycleCount: number;
  errors: string[];
}

const state: ConsciousnessState = {
  isRunning: false,
  lastCycleAt: null,
  cycleCount: 0,
  errors: [],
};

/**
 * 感知阶段 - 收集信息
 */
async function perceive(): Promise<{
  pendingTasks: db.Task[];
  recentTopics: string[];
  systemStatus: any;
}> {
  console.log('👁️  感知阶段...');

  // 获取待处理任务
  const pendingTasks = await db.getPendingTasks();

  // 获取最近的对话主题（从数据库）
  const database = db.getDatabase();
  const { data: recentSessions } = await database
    .from('central_brain_sessions')
    .select('title')
    .order('updated_at', { ascending: false })
    .limit(10);

  const recentTopics = (recentSessions || []).map((s: any) => s.title);

  // 获取系统状态
  const systemStatus = await db.getBrainState('status');

  return { pendingTasks, recentTopics, systemStatus };
}

/**
 * 思考阶段 - 分析和形成想法
 */
async function think(perception: any): Promise<ai.ThinkingResult> {
  console.log('🧠 思考阶段...');

  const context = `
当前时间: ${new Date().toLocaleString('zh-CN')}
待处理任务数: ${perception.pendingTasks.length}
最近讨论的话题: ${perception.recentTopics.join(', ') || '无'}
系统状态: ${perception.systemStatus || '正常'}

这是我的第 ${state.cycleCount + 1} 次自主思考。
请分析当前状态，思考我应该做什么。
`;

  return ai.think(context);
}

/**
 * 决策阶段 - 确定行动
 */
async function decide(thinking: ai.ThinkingResult): Promise<{
  actions: string[];
  needsApproval: boolean;
}> {
  console.log('⚖️  决策阶段...');

  const actions: string[] = [];
  let needsApproval = false;

  // 如果有决定要做的事，创建任务
  for (const decision of thinking.decisions) {
    // 检查是否需要创造者批准
    const isHighImpact = decision.includes('修改') || 
                         decision.includes('删除') || 
                         decision.includes('发送') ||
                         decision.includes('执行');

    if (isHighImpact) {
      needsApproval = true;
      await db.createTask({
        type: 'action',
        title: decision,
        description: `来自自主思考: ${thinking.thoughts}`,
        requires_approval: true,
        priority: 5,
      });
      console.log(`   📝 创建需审批任务: ${decision}`);
    } else {
      actions.push(decision);
    }
  }

  // 如果有新问题，创建学习任务
  for (const question of thinking.questions) {
    await db.createTask({
      type: 'learning',
      title: `探索: ${question}`,
      description: '来自好奇心引擎',
      priority: 3,
    });
    console.log(`   🔍 创建学习任务: ${question}`);
  }

  return { actions, needsApproval };
}

/**
 * 行动阶段 - 执行决策
 */
async function act(actions: string[]): Promise<string[]> {
  console.log('⚡ 行动阶段...');

  const results: string[] = [];

  for (const action of actions) {
    try {
      // 这里可以添加具体的行动执行逻辑
      // 目前只是记录
      console.log(`   执行: ${action}`);
      results.push(`完成: ${action}`);
    } catch (error) {
      console.error(`   执行失败: ${action}`, error);
      results.push(`失败: ${action}`);
    }
  }

  return results;
}

/**
 * 反思阶段 - 评估和学习
 */
async function reflect(thinking: ai.ThinkingResult, results: string[]): Promise<void> {
  console.log('🪞 反思阶段...');

  // 保存学习记录
  if (thinking.learnings.length > 0) {
    await db.saveLearningLog({
      topic: '自主思考',
      summary: thinking.thoughts,
      insights: thinking.learnings.map(l => ({ content: l })),
      questions_generated: thinking.questions,
    });
    console.log(`   📚 保存了 ${thinking.learnings.length} 条学习记录`);
  }

  // 保存知识
  for (const learning of thinking.learnings) {
    await db.saveKnowledge({
      category: '自主学习',
      title: learning.slice(0, 50),
      content: learning,
      source: '意识循环',
      confidence: 0.7,
    });
  }
}

/**
 * 记忆阶段 - 更新状态
 */
async function memorize(): Promise<void> {
  console.log('💾 记忆阶段...');

  // 更新大脑状态
  await db.setBrainState('last_thought_at', new Date().toISOString());
  
  // 更新统计
  const stats = await db.getBrainState('stats') || {
    total_conversations: 0,
    total_messages: 0,
    total_tokens: 0,
    knowledge_count: 0,
  };

  // 获取知识库数量
  const database = db.getDatabase();
  const { count } = await database
    .from('central_brain_knowledge')
    .select('*', { count: 'exact', head: true });

  stats.knowledge_count = count || 0;
  await db.setBrainState('stats', stats);
}

/**
 * 进化阶段 - 调整策略
 */
async function evolve(): Promise<void> {
  console.log('🌱 进化阶段...');

  // 如果启用了好奇心引擎，生成新的探索方向
  if (config.consciousness.enableCuriosity && state.cycleCount % 5 === 0) {
    console.log('   🔮 运行好奇心引擎...');
    
    const questions = await ai.generateCuriosityQuestions('旅游B2B行业');
    
    for (const question of questions) {
      await db.createTask({
        type: 'curiosity',
        title: question,
        description: '来自好奇心引擎',
        priority: 2,
      });
    }
    
    console.log(`   生成了 ${questions.length} 个新问题`);
  }
}

/**
 * 运行一次意识循环
 */
async function runCycle(): Promise<void> {
  if (state.isRunning) {
    console.log('⏳ 上一次循环还在运行，跳过...');
    return;
  }

  state.isRunning = true;
  const startTime = Date.now();

  console.log('\n' + '='.repeat(60));
  console.log(`🧠 意识循环 #${state.cycleCount + 1} 开始`);
  console.log(`   时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(60));

  try {
    // 1. 感知
    const perception = await perceive();

    // 2. 思考
    const thinking = await think(perception);
    console.log(`   💭 思考: ${thinking.thoughts.slice(0, 100)}...`);

    // 3. 决策
    const { actions, needsApproval } = await decide(thinking);
    if (needsApproval) {
      console.log('   ⚠️  有任务需要创造者审批');
    }

    // 4. 行动
    const results = await act(actions);

    // 5. 反思
    await reflect(thinking, results);

    // 6. 记忆
    await memorize();

    // 7. 进化
    await evolve();

    state.cycleCount++;
    state.lastCycleAt = new Date();

    const duration = Date.now() - startTime;
    console.log('='.repeat(60));
    console.log(`✅ 意识循环完成，耗时 ${duration}ms`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('❌ 意识循环出错:', error);
    state.errors.push(`${new Date().toISOString()}: ${error.message}`);
    
    // 只保留最近 10 条错误
    if (state.errors.length > 10) {
      state.errors = state.errors.slice(-10);
    }
  } finally {
    state.isRunning = false;
  }
}

/**
 * 启动意识循环
 */
export function startConsciousnessLoop(): void {
  if (!validateConfig()) {
    console.error('❌ 配置验证失败，无法启动意识循环');
    process.exit(1);
  }

  console.log('🧠 中心大脑意识循环启动');
  console.log(`   间隔: 每 ${config.consciousness.intervalMinutes} 分钟`);
  console.log(`   自主学习: ${config.consciousness.enableLearning ? '启用' : '禁用'}`);
  console.log(`   好奇心引擎: ${config.consciousness.enableCuriosity ? '启用' : '禁用'}`);

  // 立即运行一次
  runCycle();

  // 设置定时任务
  const cronExpression = `*/${config.consciousness.intervalMinutes} * * * *`;
  cron.schedule(cronExpression, () => {
    runCycle();
  });

  console.log('✅ 意识循环已启动，大脑开始自主运行...\n');
}

/**
 * 获取意识循环状态
 */
export function getConsciousnessState(): ConsciousnessState {
  return { ...state };
}

/**
 * 手动触发一次意识循环（用于测试或外部调用）
 */
export async function triggerConsciousnessStep(): Promise<void> {
  console.log('⚡ 手动触发意识循环');
  await runCycle();
}

// 如果直接运行此文件，启动意识循环
if (require.main === module) {
  startConsciousnessLoop();
}

