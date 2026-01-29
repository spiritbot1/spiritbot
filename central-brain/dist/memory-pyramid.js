"use strict";
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
exports.addWorkingMemory = addWorkingMemory;
exports.getWorkingMemory = getWorkingMemory;
exports.clearWorkingMemory = clearWorkingMemory;
exports.saveMemory = saveMemory;
exports.getMemoriesByLevel = getMemoriesByLevel;
exports.searchMemories = searchMemories;
exports.accessMemory = accessMemory;
exports.processMemoryDecay = processMemoryDecay;
exports.consolidateMemories = consolidateMemories;
exports.recall = recall;
exports.rememberConversation = rememberConversation;
exports.getMemoryStats = getMemoryStats;
const database_1 = require("./database");
const ai = __importStar(require("./ai"));
// ========== 记忆级别配置 ==========
const MEMORY_CONFIG = {
    working: {
        maxItems: 10,
        retentionHours: 1,
        importanceThreshold: 3,
        decayRate: 0.5,
    },
    short_term: {
        maxItems: 100,
        retentionHours: 24,
        importanceThreshold: 5,
        decayRate: 0.1,
    },
    medium_term: {
        maxItems: 1000,
        retentionHours: 168, // 7 天
        importanceThreshold: 7,
        decayRate: 0.02,
    },
    long_term: {
        maxItems: 10000,
        retentionHours: null, // 永久
        importanceThreshold: 10, // 核心记忆
        decayRate: 0,
    },
};
// ========== 工作记忆（内存）==========
// 工作记忆存储在内存中，不持久化
const workingMemory = [];
/**
 * 添加工作记忆
 */
function addWorkingMemory(content, importance = 5) {
    const memory = {
        level: 'working',
        content,
        importance,
        access_count: 1,
        last_accessed: new Date().toISOString(),
        created_at: new Date().toISOString(),
    };
    workingMemory.push(memory);
    // 限制数量
    if (workingMemory.length > MEMORY_CONFIG.working.maxItems) {
        // 移除最不重要的
        workingMemory.sort((a, b) => b.importance - a.importance);
        workingMemory.pop();
    }
    console.log(`💭 工作记忆 +1 (当前 ${workingMemory.length} 条)`);
}
/**
 * 获取工作记忆
 */
function getWorkingMemory() {
    return [...workingMemory];
}
/**
 * 清空工作记忆
 */
function clearWorkingMemory() {
    workingMemory.length = 0;
    console.log('💭 工作记忆已清空');
}
// ========== 持久化记忆操作 ==========
/**
 * 保存记忆到数据库
 */
async function saveMemory(memory) {
    const db = (0, database_1.getDatabase)();
    // 计算过期时间
    const config = MEMORY_CONFIG[memory.level];
    let expiresAt = null;
    if (config.retentionHours) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + config.retentionHours);
        expiresAt = expiry.toISOString();
    }
    const { data, error } = await db
        .from('central_brain_memories')
        .insert({
        level: memory.level,
        content: memory.content,
        summary: memory.summary,
        importance: memory.importance,
        emotional_weight: memory.emotional_weight,
        access_count: memory.access_count,
        last_accessed: memory.last_accessed,
        associations: memory.associations,
        metadata: memory.metadata,
        expires_at: expiresAt,
    })
        .select('id')
        .single();
    if (error) {
        console.error('保存记忆失败:', error);
        return null;
    }
    return data?.id;
}
/**
 * 获取某级别的记忆
 */
async function getMemoriesByLevel(level, limit = 50) {
    const db = (0, database_1.getDatabase)();
    const { data, error } = await db
        .from('central_brain_memories')
        .select('*')
        .eq('level', level)
        .order('importance', { ascending: false })
        .order('last_accessed', { ascending: false })
        .limit(limit);
    if (error) {
        console.error('获取记忆失败:', error);
        return [];
    }
    return data || [];
}
/**
 * 搜索记忆
 */
async function searchMemories(query, level, limit = 20) {
    const db = (0, database_1.getDatabase)();
    let dbQuery = db
        .from('central_brain_memories')
        .select('*')
        .or(`content.ilike.%${query}%,summary.ilike.%${query}%`);
    if (level) {
        dbQuery = dbQuery.eq('level', level);
    }
    const { data, error } = await dbQuery
        .order('importance', { ascending: false })
        .limit(limit);
    if (error) {
        console.error('搜索记忆失败:', error);
        return [];
    }
    // 更新访问计数
    const ids = (data || []).map(m => m.id);
    if (ids.length > 0) {
        await db
            .from('central_brain_memories')
            .update({
            access_count: db.rpc('increment', { inc: 1 }),
            last_accessed: new Date().toISOString(),
        })
            .in('id', ids);
    }
    return data || [];
}
/**
 * 访问记忆（增加访问计数，可能触发晋升）
 */
async function accessMemory(memoryId) {
    const db = (0, database_1.getDatabase)();
    const { data: memory } = await db
        .from('central_brain_memories')
        .select('*')
        .eq('id', memoryId)
        .single();
    if (!memory)
        return;
    const newAccessCount = (memory.access_count || 0) + 1;
    await db
        .from('central_brain_memories')
        .update({
        access_count: newAccessCount,
        last_accessed: new Date().toISOString(),
    })
        .eq('id', memoryId);
    // 检查是否应该晋升
    const config = MEMORY_CONFIG[memory.level];
    if (newAccessCount >= 5 && memory.importance >= config.importanceThreshold) {
        await promoteMemory(memory);
    }
}
// ========== 记忆整合 ==========
/**
 * 晋升记忆到更高级别
 */
async function promoteMemory(memory) {
    const levelOrder = ['working', 'short_term', 'medium_term', 'long_term'];
    const currentIndex = levelOrder.indexOf(memory.level);
    if (currentIndex >= levelOrder.length - 1) {
        return false; // 已经是最高级
    }
    const newLevel = levelOrder[currentIndex + 1];
    const db = (0, database_1.getDatabase)();
    // 生成摘要（如果晋升到中期或长期）
    let summary = memory.summary;
    if ((newLevel === 'medium_term' || newLevel === 'long_term') && !summary) {
        summary = await generateMemorySummary(memory.content);
    }
    await db
        .from('central_brain_memories')
        .update({
        level: newLevel,
        summary,
        importance: memory.importance + 1, // 晋升时提升重要性
    })
        .eq('id', memory.id);
    console.log(`🔼 记忆晋升: ${memory.level} -> ${newLevel}`);
    return true;
}
/**
 * 生成记忆摘要
 */
async function generateMemorySummary(content) {
    const prompt = `请用一句话概括以下内容的核心要点：

${content}

只输出摘要，不要其他内容。`;
    try {
        const response = await ai.chat([{ role: 'user', content: prompt }]);
        return response.slice(0, 200);
    }
    catch (error) {
        return content.slice(0, 100) + '...';
    }
}
/**
 * 记忆衰减处理
 */
async function processMemoryDecay() {
    console.log('⏳ 处理记忆衰减...');
    const db = (0, database_1.getDatabase)();
    let decayed = 0;
    let removed = 0;
    for (const level of ['short_term', 'medium_term']) {
        const config = MEMORY_CONFIG[level];
        // 获取该级别的记忆
        const { data: memories } = await db
            .from('central_brain_memories')
            .select('*')
            .eq('level', level);
        if (!memories)
            continue;
        for (const memory of memories) {
            // 计算衰减后的重要性
            const hoursSinceAccess = memory.last_accessed
                ? (Date.now() - new Date(memory.last_accessed).getTime()) / (1000 * 60 * 60)
                : 24;
            const decayedImportance = memory.importance - (config.decayRate * hoursSinceAccess);
            if (decayedImportance < 1) {
                // 重要性太低，删除
                await db.from('central_brain_memories').delete().eq('id', memory.id);
                removed++;
            }
            else if (decayedImportance < memory.importance) {
                // 更新衰减后的重要性
                await db
                    .from('central_brain_memories')
                    .update({ importance: Math.round(decayedImportance) })
                    .eq('id', memory.id);
                decayed++;
            }
        }
    }
    // 删除过期记忆
    const deleteResult = await db
        .from('central_brain_memories')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();
    removed += deleteResult.data?.length || 0;
    console.log(`   衰减: ${decayed} 条, 删除: ${removed} 条`);
    return { decayed, removed };
}
/**
 * 记忆整合（定期执行）
 */
async function consolidateMemories() {
    console.log('🧠 开始记忆整合...');
    const consolidations = [];
    // 1. 工作记忆 -> 短期记忆
    const importantWorking = workingMemory.filter(m => m.importance >= MEMORY_CONFIG.working.importanceThreshold);
    for (const memory of importantWorking) {
        memory.level = 'short_term';
        await saveMemory(memory);
    }
    if (importantWorking.length > 0) {
        consolidations.push({
            from_level: 'working',
            to_level: 'short_term',
            memories_processed: workingMemory.length,
            memories_promoted: importantWorking.length,
            memories_discarded: workingMemory.length - importantWorking.length,
            timestamp: new Date().toISOString(),
        });
        clearWorkingMemory();
    }
    // 2. 短期记忆 -> 中期记忆
    const shortTermMemories = await getMemoriesByLevel('short_term', 100);
    let promotedToMedium = 0;
    for (const memory of shortTermMemories) {
        if (memory.importance >= MEMORY_CONFIG.short_term.importanceThreshold &&
            (memory.access_count || 0) >= 3) {
            await promoteMemory(memory);
            promotedToMedium++;
        }
    }
    if (shortTermMemories.length > 0) {
        consolidations.push({
            from_level: 'short_term',
            to_level: 'medium_term',
            memories_processed: shortTermMemories.length,
            memories_promoted: promotedToMedium,
            memories_discarded: 0,
            timestamp: new Date().toISOString(),
        });
    }
    // 3. 中期记忆 -> 长期记忆
    const mediumTermMemories = await getMemoriesByLevel('medium_term', 100);
    let promotedToLong = 0;
    for (const memory of mediumTermMemories) {
        if (memory.importance >= MEMORY_CONFIG.medium_term.importanceThreshold &&
            (memory.access_count || 0) >= 5) {
            await promoteMemory(memory);
            promotedToLong++;
        }
    }
    if (mediumTermMemories.length > 0) {
        consolidations.push({
            from_level: 'medium_term',
            to_level: 'long_term',
            memories_processed: mediumTermMemories.length,
            memories_promoted: promotedToLong,
            memories_discarded: 0,
            timestamp: new Date().toISOString(),
        });
    }
    // 4. 处理衰减
    await processMemoryDecay();
    console.log('✅ 记忆整合完成');
    return consolidations;
}
// ========== 记忆回忆 ==========
/**
 * 回忆相关内容（用于对话时检索相关记忆）
 */
async function recall(query, maxMemories = 5) {
    console.log(`🔍 回忆: "${query.slice(0, 30)}..."`);
    // 从各级别记忆中搜索
    const memories = [];
    // 1. 工作记忆
    const relevantWorking = workingMemory.filter(m => m.content.toLowerCase().includes(query.toLowerCase()));
    memories.push(...relevantWorking);
    // 2. 短期记忆
    const shortTerm = await searchMemories(query, 'short_term', 3);
    memories.push(...shortTerm);
    // 3. 长期记忆（优先级最高）
    const longTerm = await searchMemories(query, 'long_term', 3);
    memories.push(...longTerm);
    // 按重要性排序
    memories.sort((a, b) => b.importance - a.importance);
    // 返回最相关的
    const result = memories.slice(0, maxMemories);
    console.log(`   找到 ${result.length} 条相关记忆`);
    return result;
}
/**
 * 从对话创建记忆
 */
async function rememberConversation(userMessage, assistantResponse, importance = 5) {
    const content = `用户: ${userMessage}\nAI: ${assistantResponse}`;
    // 添加到工作记忆
    addWorkingMemory(content, importance);
    // 如果重要性较高，直接存入短期记忆
    if (importance >= 7) {
        await saveMemory({
            level: 'short_term',
            content,
            importance,
            access_count: 1,
            metadata: {
                source: 'conversation',
                tags: ['dialogue'],
            },
        });
    }
}
// ========== 统计 ==========
/**
 * 获取记忆统计
 */
async function getMemoryStats() {
    const db = (0, database_1.getDatabase)();
    const stats = {
        working: workingMemory.length,
        short_term: 0,
        medium_term: 0,
        long_term: 0,
        total: workingMemory.length,
    };
    for (const level of ['short_term', 'medium_term', 'long_term']) {
        const { count } = await db
            .from('central_brain_memories')
            .select('*', { count: 'exact', head: true })
            .eq('level', level);
        stats[level] = count || 0;
        stats.total += count || 0;
    }
    return stats;
}
