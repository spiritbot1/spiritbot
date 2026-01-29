"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.getBrainState = getBrainState;
exports.setBrainState = setBrainState;
exports.saveKnowledge = saveKnowledge;
exports.searchKnowledge = searchKnowledge;
exports.saveLearningLog = saveLearningLog;
exports.createTask = createTask;
exports.getPendingTasks = getPendingTasks;
exports.updateTaskStatus = updateTaskStatus;
/**
 * 数据库连接和操作
 */
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("./config");
let supabase = null;
function getDatabase() {
    if (!supabase) {
        supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceRoleKey);
    }
    return supabase;
}
// ========== 状态管理 ==========
async function getBrainState(key) {
    const db = getDatabase();
    const { data, error } = await db
        .from('central_brain_state')
        .select('value')
        .eq('key', key)
        .single();
    if (error) {
        console.error(`获取状态 ${key} 失败:`, error);
        return null;
    }
    return data?.value;
}
async function setBrainState(key, value, description) {
    const db = getDatabase();
    const { error } = await db
        .from('central_brain_state')
        .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) {
        console.error(`设置状态 ${key} 失败:`, error);
    }
}
async function saveKnowledge(knowledge) {
    const db = getDatabase();
    const { data, error } = await db
        .from('central_brain_knowledge')
        .insert(knowledge)
        .select('id')
        .single();
    if (error) {
        console.error('保存知识失败:', error);
        return null;
    }
    return data?.id;
}
async function searchKnowledge(query, category) {
    const db = getDatabase();
    let queryBuilder = db
        .from('central_brain_knowledge')
        .select('*')
        .ilike('content', `%${query}%`)
        .order('confidence', { ascending: false })
        .limit(10);
    if (category) {
        queryBuilder = queryBuilder.eq('category', category);
    }
    const { data, error } = await queryBuilder;
    if (error) {
        console.error('搜索知识失败:', error);
        return [];
    }
    return data || [];
}
async function saveLearningLog(log) {
    const db = getDatabase();
    const { error } = await db
        .from('central_brain_learning_logs')
        .insert(log);
    if (error) {
        console.error('保存学习记录失败:', error);
    }
}
async function createTask(task) {
    const db = getDatabase();
    const { data, error } = await db
        .from('central_brain_tasks')
        .insert({
        ...task,
        created_by: 'brain',
    })
        .select('id')
        .single();
    if (error) {
        console.error('创建任务失败:', error);
        return null;
    }
    return data?.id;
}
async function getPendingTasks() {
    const db = getDatabase();
    const { data, error } = await db
        .from('central_brain_tasks')
        .select('*')
        .in('status', ['pending', 'approved'])
        .order('priority', { ascending: false })
        .limit(10);
    if (error) {
        console.error('获取待处理任务失败:', error);
        return [];
    }
    return data || [];
}
async function updateTaskStatus(taskId, status, result) {
    const db = getDatabase();
    const updates = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.result = result;
    }
    else if (status === 'in_progress') {
        updates.started_at = new Date().toISOString();
    }
    const { error } = await db
        .from('central_brain_tasks')
        .update(updates)
        .eq('id', taskId);
    if (error) {
        console.error('更新任务状态失败:', error);
    }
}
