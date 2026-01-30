/**
 * 知识图谱系统
 * 
 * 功能：
 * 1. 实体管理 - 创建、查询、更新实体
 * 2. 关系管理 - 建立实体间的关系
 * 3. 图谱查询 - 根据实体查找相关知识
 * 4. 语义搜索 - 基于内容相似度搜索
 */

import { getDatabase } from './database';
import * as ai from './ai';

// ========== 类型定义 ==========

export interface Entity {
  id?: string;
  type: EntityType;
  name: string;
  description?: string;
  properties?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export type EntityType = 
  | 'concept'      // 概念
  | 'person'       // 人物
  | 'organization' // 组织
  | 'product'      // 产品
  | 'event'        // 事件
  | 'location'     // 地点
  | 'technology'   // 技术
  | 'process'      // 流程
  | 'rule'         // 规则
  | 'insight';     // 洞察

export interface Relation {
  id?: string;
  from_entity_id: string;
  to_entity_id: string;
  relation_type: RelationType;
  strength?: number;  // 0-1，关系强度
  properties?: Record<string, any>;
  created_at?: string;
}

export type RelationType =
  | 'is_a'           // A 是一种 B
  | 'part_of'        // A 是 B 的一部分
  | 'has'            // A 拥有 B
  | 'belongs_to'     // A 属于 B
  | 'related_to'     // A 与 B 相关
  | 'causes'         // A 导致 B
  | 'depends_on'     // A 依赖 B
  | 'contradicts'    // A 与 B 矛盾
  | 'supports'       // A 支持 B
  | 'created_by'     // A 由 B 创建
  | 'used_by'        // A 被 B 使用
  | 'similar_to';    // A 与 B 相似

// ========== 数据库操作 ==========

// 创建实体表（如果不存在）
async function ensureTablesExist(): Promise<void> {
  const db = getDatabase();
  
  // 检查实体表是否存在
  const { data: entityTable } = await db
    .from('central_brain_entities')
    .select('id')
    .limit(1);
  
  if (entityTable === null) {
    console.log('⚠️ 实体表不存在，请执行数据库迁移');
  }
}

// ========== 实体操作 ==========

/**
 * 创建实体
 */
export async function createEntity(entity: Entity): Promise<string | null> {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('central_brain_entities')
    .insert({
      type: entity.type,
      name: entity.name,
      description: entity.description,
      properties: entity.properties || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('创建实体失败:', error);
    return null;
  }
  
  console.log(`📦 创建实体: ${entity.name} (${entity.type})`);
  return data?.id;
}

/**
 * 查找实体
 */
export async function findEntity(name: string, type?: EntityType): Promise<Entity | null> {
  const db = getDatabase();
  
  let query = db
    .from('central_brain_entities')
    .select('*')
    .ilike('name', `%${name}%`);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.limit(1).single();
  
  if (error || !data) return null;
  return data as Entity;
}

/**
 * 获取或创建实体
 */
export async function getOrCreateEntity(entity: Entity): Promise<string> {
  const existing = await findEntity(entity.name, entity.type);
  if (existing?.id) return existing.id;
  
  const newId = await createEntity(entity);
  return newId || '';
}

/**
 * 搜索实体
 */
export async function searchEntities(
  query: string, 
  type?: EntityType, 
  limit: number = 10
): Promise<Entity[]> {
  const db = getDatabase();
  
  let dbQuery = db
    .from('central_brain_entities')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  
  if (type) {
    dbQuery = dbQuery.eq('type', type);
  }
  
  const { data, error } = await dbQuery.limit(limit);
  
  if (error) {
    console.error('搜索实体失败:', error);
    return [];
  }
  
  return data || [];
}

// ========== 关系操作 ==========

/**
 * 创建关系
 */
export async function createRelation(relation: Relation): Promise<string | null> {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('central_brain_relations')
    .insert({
      from_entity_id: relation.from_entity_id,
      to_entity_id: relation.to_entity_id,
      relation_type: relation.relation_type,
      strength: relation.strength || 1.0,
      properties: relation.properties || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('创建关系失败:', error);
    return null;
  }
  
  return data?.id;
}

/**
 * 获取实体的所有关系
 */
export async function getEntityRelations(entityId: string): Promise<{
  outgoing: Array<{ relation: Relation; entity: Entity }>;
  incoming: Array<{ relation: Relation; entity: Entity }>;
}> {
  const db = getDatabase();
  
  // 出向关系
  const { data: outgoing } = await db
    .from('central_brain_relations')
    .select(`
      *,
      to_entity:central_brain_entities!to_entity_id(*)
    `)
    .eq('from_entity_id', entityId);
  
  // 入向关系
  const { data: incoming } = await db
    .from('central_brain_relations')
    .select(`
      *,
      from_entity:central_brain_entities!from_entity_id(*)
    `)
    .eq('to_entity_id', entityId);
  
  return {
    outgoing: (outgoing || []).map((r: any) => ({
      relation: r,
      entity: r.to_entity,
    })),
    incoming: (incoming || []).map((r: any) => ({
      relation: r,
      entity: r.from_entity,
    })),
  };
}

// ========== 知识提取 ==========

/**
 * 从文本中提取实体和关系
 */
export async function extractKnowledge(text: string): Promise<{
  entities: Entity[];
  relations: Array<{
    from: string;
    to: string;
    type: RelationType;
  }>;
}> {
  const prompt = `请从以下文本中提取实体和关系。

文本：
${text}

请输出 JSON 格式：
{
  "entities": [
    {"name": "实体名称", "type": "concept|person|organization|product|event|location|technology|process|rule|insight", "description": "简短描述"}
  ],
  "relations": [
    {"from": "实体A名称", "to": "实体B名称", "type": "is_a|part_of|has|belongs_to|related_to|causes|depends_on|contradicts|supports|created_by|used_by|similar_to"}
  ]
}

只输出 JSON，不要其他内容。`;

  try {
    const response = await ai.chat([{ role: 'user', content: prompt }]);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('提取知识失败:', error);
  }
  
  return { entities: [], relations: [] };
}

/**
 * 学习新知识（从文本）
 */
export async function learnFromText(text: string, source?: string): Promise<{
  entitiesCreated: number;
  relationsCreated: number;
}> {
  console.log('📚 从文本学习知识...');
  
  // 提取实体和关系
  const { entities, relations } = await extractKnowledge(text);
  
  let entitiesCreated = 0;
  let relationsCreated = 0;
  
  // 创建实体
  const entityIdMap: Record<string, string> = {};
  
  for (const entity of entities) {
    const id = await getOrCreateEntity({
      ...entity,
      properties: { source },
    });
    if (id) {
      entityIdMap[entity.name] = id;
      entitiesCreated++;
    }
  }
  
  // 创建关系
  for (const relation of relations) {
    const fromId = entityIdMap[relation.from];
    const toId = entityIdMap[relation.to];
    
    if (fromId && toId) {
      await createRelation({
        from_entity_id: fromId,
        to_entity_id: toId,
        relation_type: relation.type,
      });
      relationsCreated++;
    }
  }
  
  console.log(`   创建了 ${entitiesCreated} 个实体, ${relationsCreated} 个关系`);
  
  return { entitiesCreated, relationsCreated };
}

// ========== 图谱查询 ==========

/**
 * 探索知识图谱（从一个实体开始，找相关知识）
 */
export async function exploreGraph(
  startEntityId: string, 
  depth: number = 2
): Promise<{
  entities: Entity[];
  relations: Relation[];
}> {
  const db = getDatabase();
  const visited = new Set<string>();
  const allEntities: Entity[] = [];
  const allRelations: Relation[] = [];
  
  async function explore(entityId: string, currentDepth: number): Promise<void> {
    if (currentDepth > depth || visited.has(entityId)) return;
    visited.add(entityId);
    
    // 获取实体
    const { data: entity } = await db
      .from('central_brain_entities')
      .select('*')
      .eq('id', entityId)
      .single();
    
    if (entity) {
      allEntities.push(entity);
    }
    
    // 获取关系
    const { outgoing, incoming } = await getEntityRelations(entityId);
    
    for (const { relation, entity: relatedEntity } of [...outgoing, ...incoming]) {
      allRelations.push(relation);
      
      if (relatedEntity?.id) {
        await explore(relatedEntity.id, currentDepth + 1);
      }
    }
  }
  
  await explore(startEntityId, 0);
  
  return { entities: allEntities, relations: allRelations };
}

/**
 * 查找两个实体之间的路径
 */
export async function findPath(
  fromEntityId: string, 
  toEntityId: string, 
  maxDepth: number = 5
): Promise<Array<{ entity: Entity; relation?: Relation }> | null> {
  const visited = new Set<string>();
  
  async function bfs(): Promise<Array<{ entity: Entity; relation?: Relation }> | null> {
    const queue: Array<{
      entityId: string;
      path: Array<{ entity: Entity; relation?: Relation }>;
    }> = [];
    
    const db = getDatabase();
    const { data: startEntity } = await db
      .from('central_brain_entities')
      .select('*')
      .eq('id', fromEntityId)
      .single();
    
    if (!startEntity) return null;
    
    queue.push({
      entityId: fromEntityId,
      path: [{ entity: startEntity }],
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.path.length > maxDepth) continue;
      if (visited.has(current.entityId)) continue;
      visited.add(current.entityId);
      
      if (current.entityId === toEntityId) {
        return current.path;
      }
      
      const { outgoing, incoming } = await getEntityRelations(current.entityId);
      
      for (const { relation, entity } of [...outgoing, ...incoming]) {
        if (entity?.id && !visited.has(entity.id)) {
          queue.push({
            entityId: entity.id,
            path: [...current.path, { entity, relation }],
          });
        }
      }
    }
    
    return null;
  }
  
  return bfs();
}

/**
 * 获取知识图谱统计
 */
export async function getGraphStats(): Promise<{
  totalEntities: number;
  totalRelations: number;
  entityTypes: Record<string, number>;
  relationTypes: Record<string, number>;
}> {
  const db = getDatabase();
  
  // 实体统计
  const { count: totalEntities } = await db
    .from('central_brain_entities')
    .select('*', { count: 'exact', head: true });
  
  // 关系统计
  const { count: totalRelations } = await db
    .from('central_brain_relations')
    .select('*', { count: 'exact', head: true });
  
  // 实体类型分布
  const { data: entityTypeCounts } = await db
    .from('central_brain_entities')
    .select('type');
  
  const entityTypes: Record<string, number> = {};
  (entityTypeCounts || []).forEach((e: any) => {
    entityTypes[e.type] = (entityTypes[e.type] || 0) + 1;
  });
  
  // 关系类型分布
  const { data: relationTypeCounts } = await db
    .from('central_brain_relations')
    .select('relation_type');
  
  const relationTypes: Record<string, number> = {};
  (relationTypeCounts || []).forEach((r: any) => {
    relationTypes[r.relation_type] = (relationTypes[r.relation_type] || 0) + 1;
  });
  
  return {
    totalEntities: totalEntities || 0,
    totalRelations: totalRelations || 0,
    entityTypes,
    relationTypes,
  };
}

// ========== 初始化 ==========

export async function initKnowledgeGraph(): Promise<void> {
  await ensureTablesExist();
  console.log('📊 知识图谱系统已初始化');
}

