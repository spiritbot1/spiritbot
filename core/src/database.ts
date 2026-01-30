/**
 * 数据库连接和操作
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabase: SupabaseClient | null = null;

export function getDatabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return supabase;
}

// ========== 状态管理 ==========

export async function getBrainState(key: string): Promise<any> {
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

export async function setBrainState(key: string, value: any, description?: string): Promise<void> {
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

// ========== 知识库操作 ==========

export interface Knowledge {
  id?: string;
  category: string;
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  tags?: string[];
}

export async function saveKnowledge(knowledge: Knowledge): Promise<string | null> {
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

export async function searchKnowledge(query: string, category?: string): Promise<Knowledge[]> {
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

// ========== 学习记录 ==========

export interface LearningLog {
  topic: string;
  source?: string;
  summary?: string;
  insights?: any[];
  questions_generated?: string[];
}

export async function saveLearningLog(log: LearningLog): Promise<void> {
  const db = getDatabase();
  const { error } = await db
    .from('central_brain_learning_logs')
    .insert(log);

  if (error) {
    console.error('保存学习记录失败:', error);
  }
}

// ========== 任务管理 ==========

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

export async function createTask(task: Task): Promise<string | null> {
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

export async function getPendingTasks(): Promise<Task[]> {
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

export async function updateTaskStatus(taskId: string, status: string, result?: any): Promise<void> {
  const db = getDatabase();
  const updates: any = { status, updated_at: new Date().toISOString() };
  
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.result = result;
  } else if (status === 'in_progress') {
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

