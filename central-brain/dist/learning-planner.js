"use strict";
/**
 * 学习规划器
 *
 * 功能：
 * 1. 识别知识空白 - 发现不知道什么
 * 2. 制定学习计划 - 决定学什么、怎么学
 * 3. 执行学习任务 - 自动学习新知识
 * 4. 评估学习效果 - 检验是否真的学会了
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
exports.analyzeConversationGaps = analyzeConversationGaps;
exports.analyzeGraphGaps = analyzeGraphGaps;
exports.detectAllGaps = detectAllGaps;
exports.createLearningPlan = createLearningPlan;
exports.executeLearningSteep = executeLearningSteep;
exports.executeLearningPlan = executeLearningPlan;
exports.runAutonomousLearning = runAutonomousLearning;
const database_1 = require("./database");
const ai = __importStar(require("./ai"));
const kg = __importStar(require("./knowledge-graph"));
// ========== 知识空白检测 ==========
/**
 * 分析最近的对话，发现知识空白
 */
async function analyzeConversationGaps() {
    const db = (0, database_1.getDatabase)();
    // 获取最近的对话
    const { data: recentMessages } = await db
        .from('central_brain_messages')
        .select('content, role')
        .order('created_at', { ascending: false })
        .limit(50);
    if (!recentMessages || recentMessages.length === 0) {
        return [];
    }
    // 提取对话内容
    const conversationText = recentMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');
    // 让 AI 分析知识空白
    const prompt = `分析以下对话，找出我（AI）可能存在的知识空白：

${conversationText}

请识别：
1. 我回答得不够准确或不够深入的地方
2. 我表示"不确定"或"不知道"的地方
3. 用户问到但我没能很好回答的问题
4. 我应该知道但可能不知道的相关知识

输出 JSON 格式：
[
  {
    "area": "知识领域",
    "topic": "具体主题",
    "urgency": "high|medium|low",
    "importance": "high|medium|low",
    "reason": "为什么需要学习"
  }
]

只输出 JSON，不要其他内容。`;
    try {
        const response = await ai.chat([{ role: 'user', content: prompt }]);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const gaps = JSON.parse(jsonMatch[0]);
            return gaps.map((g) => ({
                ...g,
                status: 'identified',
                discovered_at: new Date().toISOString(),
            }));
        }
    }
    catch (error) {
        console.error('分析知识空白失败:', error);
    }
    return [];
}
/**
 * 分析知识图谱，发现结构性空白
 */
async function analyzeGraphGaps() {
    const stats = await kg.getGraphStats();
    const gaps = [];
    // 检查实体类型分布是否均衡
    const types = Object.keys(stats.entityTypes);
    const avgCount = stats.totalEntities / Math.max(types.length, 1);
    const expectedTypes = ['concept', 'process', 'rule', 'insight', 'technology'];
    for (const type of expectedTypes) {
        const count = stats.entityTypes[type] || 0;
        if (count < avgCount * 0.5) {
            gaps.push({
                area: '知识图谱',
                topic: `${type} 类型的知识较少`,
                urgency: 'medium',
                importance: 'medium',
                reason: `当前只有 ${count} 个 ${type} 类型的实体，低于平均水平`,
                status: 'identified',
            });
        }
    }
    // 检查是否有孤立实体（没有关系的实体）
    const db = (0, database_1.getDatabase)();
    const { data: isolatedEntities } = await db
        .from('central_brain_entities')
        .select('id, name')
        .limit(100);
    // 这里简化处理，实际应该查找没有关系的实体
    if (stats.totalRelations < stats.totalEntities * 0.5) {
        gaps.push({
            area: '知识图谱',
            topic: '实体之间的关系较少',
            urgency: 'low',
            importance: 'high',
            reason: `实体数 ${stats.totalEntities}，关系数 ${stats.totalRelations}，关系密度较低`,
            status: 'identified',
        });
    }
    return gaps;
}
/**
 * 综合分析所有知识空白
 */
async function detectAllGaps() {
    console.log('🔍 检测知识空白...');
    const [conversationGaps, graphGaps] = await Promise.all([
        analyzeConversationGaps(),
        analyzeGraphGaps(),
    ]);
    const allGaps = [...conversationGaps, ...graphGaps];
    // 按优先级排序
    allGaps.sort((a, b) => {
        const urgencyScore = { high: 3, medium: 2, low: 1 };
        const importanceScore = { high: 3, medium: 2, low: 1 };
        const scoreA = urgencyScore[a.urgency] * 2 + importanceScore[a.importance];
        const scoreB = urgencyScore[b.urgency] * 2 + importanceScore[b.importance];
        return scoreB - scoreA;
    });
    console.log(`   发现 ${allGaps.length} 个知识空白`);
    return allGaps;
}
// ========== 学习计划制定 ==========
/**
 * 为知识空白制定学习计划
 */
async function createLearningPlan(gaps) {
    if (gaps.length === 0) {
        return {
            title: '无需学习',
            description: '当前没有发现知识空白',
            gaps: [],
            steps: [],
            priority: 0,
            estimated_time: '0',
            status: 'completed',
        };
    }
    // 取前 3 个最重要的空白
    const topGaps = gaps.slice(0, 3);
    const prompt = `请为以下知识空白制定学习计划：

${topGaps.map((g, i) => `${i + 1}. ${g.area} - ${g.topic}
   原因: ${g.reason}
   紧急程度: ${g.urgency}
   重要程度: ${g.importance}`).join('\n\n')}

请输出 JSON 格式的学习计划：
{
  "title": "学习计划标题",
  "description": "计划描述",
  "steps": [
    {
      "order": 1,
      "action": "具体行动",
      "resource": "学习资源（可选）",
      "expected_outcome": "预期结果"
    }
  ],
  "estimated_time": "预计所需时间",
  "priority": 1-10的优先级
}

只输出 JSON，不要其他内容。`;
    try {
        const response = await ai.chat([{ role: 'user', content: prompt }]);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            return {
                ...plan,
                gaps: topGaps,
                steps: plan.steps.map((s) => ({ ...s, status: 'pending' })),
                status: 'planned',
                created_at: new Date().toISOString(),
            };
        }
    }
    catch (error) {
        console.error('制定学习计划失败:', error);
    }
    // 返回默认计划
    return {
        title: '知识补充计划',
        description: `学习 ${topGaps.length} 个知识领域`,
        gaps: topGaps,
        steps: topGaps.map((g, i) => ({
            order: i + 1,
            action: `学习和理解: ${g.topic}`,
            expected_outcome: `能够解释 ${g.topic} 的核心概念`,
            status: 'pending',
        })),
        priority: 5,
        estimated_time: '1-2小时',
        status: 'planned',
        created_at: new Date().toISOString(),
    };
}
// ========== 学习执行 ==========
/**
 * 执行学习步骤
 */
async function executeLearningSteep(step) {
    console.log(`📖 执行学习步骤: ${step.action}`);
    const prompt = `请学习和理解以下内容：

任务: ${step.action}
预期结果: ${step.expected_outcome}
${step.resource ? `参考资源: ${step.resource}` : ''}

请：
1. 解释这个主题的核心概念
2. 总结关键要点
3. 列出学到的具体知识点

输出 JSON 格式：
{
  "explanation": "核心概念解释",
  "key_points": ["关键要点1", "关键要点2"],
  "knowledge_gained": ["具体知识点1", "具体知识点2"],
  "self_assessment": "对自己理解程度的评估（1-10分）"
}`;
    try {
        const response = await ai.chat([{ role: 'user', content: prompt }]);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            // 将学到的知识存入知识图谱
            for (const knowledge of result.knowledge_gained) {
                await kg.createEntity({
                    type: 'insight',
                    name: knowledge.slice(0, 50),
                    description: knowledge,
                    properties: {
                        source: 'self_learning',
                        learned_at: new Date().toISOString(),
                    },
                });
            }
            return {
                success: true,
                result: result.explanation,
                knowledgeGained: result.knowledge_gained,
            };
        }
    }
    catch (error) {
        console.error('执行学习步骤失败:', error);
    }
    return {
        success: false,
        result: '学习过程遇到问题',
        knowledgeGained: [],
    };
}
/**
 * 执行完整的学习计划
 */
async function executeLearningPlan(plan) {
    console.log(`📚 开始执行学习计划: ${plan.title}`);
    plan.status = 'in_progress';
    plan.started_at = new Date().toISOString();
    const totalKnowledgeGained = [];
    let stepsCompleted = 0;
    for (const step of plan.steps) {
        step.status = 'in_progress';
        const result = await executeLearningSteep(step);
        if (result.success) {
            step.status = 'completed';
            step.result = result.result;
            totalKnowledgeGained.push(...result.knowledgeGained);
            stepsCompleted++;
        }
        else {
            step.status = 'skipped';
        }
    }
    plan.status = stepsCompleted === plan.steps.length ? 'completed' : 'in_progress';
    plan.completed_at = new Date().toISOString();
    console.log(`   完成 ${stepsCompleted}/${plan.steps.length} 个步骤`);
    console.log(`   学到 ${totalKnowledgeGained.length} 个知识点`);
    return {
        completed: plan.status === 'completed',
        stepsCompleted,
        totalKnowledgeGained,
    };
}
// ========== 自主学习循环 ==========
/**
 * 运行一次自主学习
 */
async function runAutonomousLearning() {
    console.log('\n🎓 开始自主学习...');
    // 1. 检测知识空白
    const gaps = await detectAllGaps();
    if (gaps.length === 0) {
        console.log('   没有发现知识空白，跳过学习');
        return { gapsFound: 0, planCreated: false, knowledgeGained: 0 };
    }
    // 2. 制定学习计划
    const plan = await createLearningPlan(gaps);
    console.log(`   制定学习计划: ${plan.title}`);
    // 3. 执行学习计划
    const result = await executeLearningPlan(plan);
    // 4. 保存学习记录
    const db = (0, database_1.getDatabase)();
    await db.from('central_brain_learning_logs').insert({
        topic: plan.title,
        source: 'autonomous_learning',
        summary: `完成 ${result.stepsCompleted} 个学习步骤，学到 ${result.totalKnowledgeGained.length} 个知识点`,
        insights: result.totalKnowledgeGained.map(k => ({ content: k })),
    });
    console.log('✅ 自主学习完成\n');
    return {
        gapsFound: gaps.length,
        planCreated: true,
        knowledgeGained: result.totalKnowledgeGained.length,
    };
}
