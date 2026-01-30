/**
 * 混合记忆系统
 * 
 * 融合 Moltbot 的无限向量记忆 + Central Brain 的记忆金字塔
 * 
 * 设计思路：
 * 1. 使用 Moltbot 的向量搜索能力实现语义检索
 * 2. 保留 Central Brain 的 4 层金字塔结构和衰减机制
 * 3. 添加情感权重和重要性评估
 * 4. 支持无限存储 + 智能遗忘
 */

// ========== 类型定义 ==========

export type MemoryLevel = 'working' | 'short_term' | 'medium_term' | 'long_term';

export interface HybridMemory {
  id: string;
  level: MemoryLevel;
  
  // 内容
  content: string;
  summary?: string;
  
  // 向量（来自 Moltbot）
  embedding?: number[];
  embeddingModel?: string;
  
  // 评分系统
  importance: number;        // 1-10 重要性
  emotionalWeight: number;   // -1 到 1，情感权重
  accessCount: number;       // 访问次数
  relevanceScore?: number;   // 最近一次搜索的相关性
  
  // 时间相关
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
  
  // 关联
  associations: string[];    // 关联的记忆 ID
  source: MemorySource;      // 来源
  
  // 元数据
  metadata: {
    sessionId?: string;
    userId?: string;
    channel?: string;
    tags?: string[];
    context?: string;
    [key: string]: unknown;
  };
}

export type MemorySource = 
  | 'conversation'   // 对话
  | 'learning'       // 主动学习
  | 'observation'    // 观察
  | 'reflection'     // 反思
  | 'external'       // 外部导入
  | 'system';        // 系统生成

// ========== 记忆配置 ==========

export interface MemoryLevelConfig {
  maxItems: number | null;     // null = 无限
  retentionHours: number | null;  // null = 永久
  importanceThreshold: number;     // 晋升到下一级的阈值
  decayRatePerHour: number;        // 每小时衰减率
  accessBoost: number;             // 每次访问增加的重要性
}

export const DEFAULT_MEMORY_CONFIG: Record<MemoryLevel, MemoryLevelConfig> = {
  working: {
    maxItems: 20,              // 工作记忆有限
    retentionHours: 2,
    importanceThreshold: 4,    // 重要性 >= 4 晋升
    decayRatePerHour: 0.3,
    accessBoost: 0.5,
  },
  short_term: {
    maxItems: 500,
    retentionHours: 48,        // 2 天
    importanceThreshold: 6,
    decayRatePerHour: 0.1,
    accessBoost: 0.3,
  },
  medium_term: {
    maxItems: 5000,
    retentionHours: 720,       // 30 天
    importanceThreshold: 8,
    decayRatePerHour: 0.02,
    accessBoost: 0.1,
  },
  long_term: {
    maxItems: null,            // 无限（使用向量存储）
    retentionHours: null,      // 永久
    importanceThreshold: 10,   // 核心记忆
    decayRatePerHour: 0,       // 不衰减
    accessBoost: 0.05,
  },
};

// ========== 混合记忆管理器 ==========

export interface HybridMemoryManager {
  // 基础操作
  add(memory: Omit<HybridMemory, 'id' | 'createdAt' | 'lastAccessedAt'>): Promise<string>;
  get(id: string): Promise<HybridMemory | null>;
  update(id: string, updates: Partial<HybridMemory>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  
  // 搜索
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  searchSemantic(embedding: number[], options?: SearchOptions): Promise<SearchResult[]>;
  searchByLevel(level: MemoryLevel, limit?: number): Promise<HybridMemory[]>;
  
  // 回忆（融合多种搜索）
  recall(query: string, options?: RecallOptions): Promise<RecallResult>;
  
  // 记忆整合
  consolidate(): Promise<ConsolidationResult>;
  decay(): Promise<DecayResult>;
  
  // 统计
  getStats(): Promise<MemoryStats>;
  
  // 生命周期
  initialize(): Promise<void>;
  close(): Promise<void>;
}

export interface SearchOptions {
  level?: MemoryLevel;
  minImportance?: number;
  limit?: number;
  includeEmbedding?: boolean;
  source?: MemorySource;
  tags?: string[];
  
  // 混合搜索权重
  semanticWeight?: number;    // 语义搜索权重 (0-1)
  keywordWeight?: number;     // 关键词搜索权重 (0-1)
}

export interface SearchResult {
  memory: HybridMemory;
  score: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

export interface RecallOptions {
  maxMemories?: number;
  includeContext?: boolean;
  boostRecent?: boolean;
  boostImportant?: boolean;
}

export interface RecallResult {
  memories: HybridMemory[];
  context: string;          // 组合成的上下文文本
  totalSearched: number;
  searchTime: number;
}

export interface ConsolidationResult {
  promotions: Array<{
    from: MemoryLevel;
    to: MemoryLevel;
    count: number;
  }>;
  mergedCount: number;
  totalProcessed: number;
  timestamp: Date;
}

export interface DecayResult {
  decayedCount: number;
  removedCount: number;
  timestamp: Date;
}

export interface MemoryStats {
  byLevel: Record<MemoryLevel, number>;
  total: number;
  averageImportance: number;
  oldestMemory?: Date;
  newestMemory?: Date;
  storageUsed?: number;
}

// ========== 重要性评估 ==========

/**
 * 评估记忆内容的重要性
 */
export function evaluateImportance(content: string, context?: {
  isQuestion?: boolean;
  isDecision?: boolean;
  isPersonal?: boolean;
  hasEmotion?: boolean;
  mentionsUser?: boolean;
}): number {
  let score = 5; // 基础分
  
  // 关键词检测
  const importantKeywords = [
    '重要', '记住', '不要忘', '关键', '核心',
    '决定', '选择', '必须', '一定',
    'important', 'remember', 'key', 'critical',
  ];
  
  const personalKeywords = [
    '我', '我的', '喜欢', '讨厌', '偏好',
    '生日', '名字', '地址', '电话',
  ];
  
  const contentLower = content.toLowerCase();
  
  // 关键词加分
  if (importantKeywords.some(k => contentLower.includes(k))) {
    score += 2;
  }
  
  if (personalKeywords.some(k => contentLower.includes(k))) {
    score += 1;
  }
  
  // 上下文加分
  if (context?.isQuestion) score += 0.5;
  if (context?.isDecision) score += 2;
  if (context?.isPersonal) score += 1.5;
  if (context?.hasEmotion) score += 1;
  if (context?.mentionsUser) score += 1;
  
  // 内容长度加分（过短或过长都减分）
  const length = content.length;
  if (length > 50 && length < 500) score += 0.5;
  if (length > 500) score -= 0.5;
  if (length < 20) score -= 1;
  
  return Math.min(10, Math.max(1, Math.round(score)));
}

/**
 * 评估情感权重
 */
export function evaluateEmotionalWeight(content: string): number {
  const positiveWords = [
    '喜欢', '爱', '开心', '高兴', '感谢', '棒', '好',
    '有趣', '精彩', '美好', '温暖', '幸福',
    'love', 'happy', 'great', 'wonderful', 'thanks',
  ];
  
  const negativeWords = [
    '讨厌', '恨', '难过', '悲伤', '生气', '糟糕', '差',
    '无聊', '失望', '痛苦', '焦虑', '害怕',
    'hate', 'sad', 'angry', 'terrible', 'bad',
  ];
  
  const contentLower = content.toLowerCase();
  
  let positive = 0;
  let negative = 0;
  
  positiveWords.forEach(w => {
    if (contentLower.includes(w)) positive++;
  });
  
  negativeWords.forEach(w => {
    if (contentLower.includes(w)) negative++;
  });
  
  const total = positive + negative;
  if (total === 0) return 0;
  
  return (positive - negative) / total;
}

// ========== 辅助函数 ==========

/**
 * 生成记忆 ID
 */
export function generateMemoryId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 检查记忆是否应该晋升
 */
export function shouldPromote(
  memory: HybridMemory, 
  config: MemoryLevelConfig
): boolean {
  return (
    memory.importance >= config.importanceThreshold &&
    memory.accessCount >= 3
  );
}

/**
 * 计算衰减后的重要性
 */
export function calculateDecayedImportance(
  memory: HybridMemory,
  config: MemoryLevelConfig
): number {
  const hoursSinceAccess = 
    (Date.now() - memory.lastAccessedAt.getTime()) / (1000 * 60 * 60);
  
  const decayed = memory.importance - (config.decayRatePerHour * hoursSinceAccess);
  
  return Math.max(0, decayed);
}

/**
 * 合并相似记忆（去重）
 */
export function shouldMerge(
  memory1: HybridMemory,
  memory2: HybridMemory,
  similarityThreshold: number = 0.9
): boolean {
  // 如果有 embedding，使用余弦相似度
  if (memory1.embedding && memory2.embedding) {
    const similarity = cosineSimilarity(memory1.embedding, memory2.embedding);
    return similarity >= similarityThreshold;
  }
  
  // 否则使用简单的文本相似度
  const textSimilarity = simpleTextSimilarity(memory1.content, memory2.content);
  return textSimilarity >= similarityThreshold;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function simpleTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });
  
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}
