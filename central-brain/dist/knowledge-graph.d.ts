/**
 * 知识图谱系统
 *
 * 功能：
 * 1. 实体管理 - 创建、查询、更新实体
 * 2. 关系管理 - 建立实体间的关系
 * 3. 图谱查询 - 根据实体查找相关知识
 * 4. 语义搜索 - 基于内容相似度搜索
 */
export interface Entity {
    id?: string;
    type: EntityType;
    name: string;
    description?: string;
    properties?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}
export type EntityType = 'concept' | 'person' | 'organization' | 'product' | 'event' | 'location' | 'technology' | 'process' | 'rule' | 'insight';
export interface Relation {
    id?: string;
    from_entity_id: string;
    to_entity_id: string;
    relation_type: RelationType;
    strength?: number;
    properties?: Record<string, any>;
    created_at?: string;
}
export type RelationType = 'is_a' | 'part_of' | 'has' | 'belongs_to' | 'related_to' | 'causes' | 'depends_on' | 'contradicts' | 'supports' | 'created_by' | 'used_by' | 'similar_to';
/**
 * 创建实体
 */
export declare function createEntity(entity: Entity): Promise<string | null>;
/**
 * 查找实体
 */
export declare function findEntity(name: string, type?: EntityType): Promise<Entity | null>;
/**
 * 获取或创建实体
 */
export declare function getOrCreateEntity(entity: Entity): Promise<string>;
/**
 * 搜索实体
 */
export declare function searchEntities(query: string, type?: EntityType, limit?: number): Promise<Entity[]>;
/**
 * 创建关系
 */
export declare function createRelation(relation: Relation): Promise<string | null>;
/**
 * 获取实体的所有关系
 */
export declare function getEntityRelations(entityId: string): Promise<{
    outgoing: Array<{
        relation: Relation;
        entity: Entity;
    }>;
    incoming: Array<{
        relation: Relation;
        entity: Entity;
    }>;
}>;
/**
 * 从文本中提取实体和关系
 */
export declare function extractKnowledge(text: string): Promise<{
    entities: Entity[];
    relations: Array<{
        from: string;
        to: string;
        type: RelationType;
    }>;
}>;
/**
 * 学习新知识（从文本）
 */
export declare function learnFromText(text: string, source?: string): Promise<{
    entitiesCreated: number;
    relationsCreated: number;
}>;
/**
 * 探索知识图谱（从一个实体开始，找相关知识）
 */
export declare function exploreGraph(startEntityId: string, depth?: number): Promise<{
    entities: Entity[];
    relations: Relation[];
}>;
/**
 * 查找两个实体之间的路径
 */
export declare function findPath(fromEntityId: string, toEntityId: string, maxDepth?: number): Promise<Array<{
    entity: Entity;
    relation?: Relation;
}> | null>;
/**
 * 获取知识图谱统计
 */
export declare function getGraphStats(): Promise<{
    totalEntities: number;
    totalRelations: number;
    entityTypes: Record<string, number>;
    relationTypes: Record<string, number>;
}>;
export declare function initKnowledgeGraph(): Promise<void>;
