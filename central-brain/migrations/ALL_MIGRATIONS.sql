-- ============================================================
-- 中心大脑完整数据库迁移
-- 
-- 在 Supabase Dashboard -> SQL Editor 中执行
-- ============================================================

-- ============================================================
-- 1. 知识图谱表
-- ============================================================

-- 实体表
CREATE TABLE IF NOT EXISTS central_brain_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON central_brain_entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON central_brain_entities(name);

-- 关系表
CREATE TABLE IF NOT EXISTS central_brain_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id UUID REFERENCES central_brain_entities(id) ON DELETE CASCADE,
  to_entity_id UUID REFERENCES central_brain_entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  strength FLOAT DEFAULT 1.0,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON central_brain_relations(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relations_to ON central_brain_relations(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON central_brain_relations(relation_type);

-- ============================================================
-- 2. 记忆金字塔表
-- ============================================================

CREATE TABLE IF NOT EXISTS central_brain_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('working', 'short_term', 'medium_term', 'long_term')),
  content TEXT NOT NULL,
  summary TEXT,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  emotional_weight FLOAT,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  associations UUID[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_memories_level ON central_brain_memories(level);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON central_brain_memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_expires ON central_brain_memories(expires_at) WHERE expires_at IS NOT NULL;

-- 记忆整合日志
CREATE TABLE IF NOT EXISTS central_brain_consolidation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  memories_processed INTEGER DEFAULT 0,
  memories_promoted INTEGER DEFAULT 0,
  memories_discarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 外部系统表
-- ============================================================

CREATE TABLE IF NOT EXISTS central_brain_systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  connection JSONB NOT NULL,
  status TEXT DEFAULT 'inactive',
  capabilities TEXT[] DEFAULT '{}',
  last_connected TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_systems_status ON central_brain_systems(status);
CREATE INDEX IF NOT EXISTS idx_systems_type ON central_brain_systems(type);

-- 系统操作日志
CREATE TABLE IF NOT EXISTS central_brain_system_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id TEXT REFERENCES central_brain_systems(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  params JSONB,
  result JSONB,
  success BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_actions_system ON central_brain_system_actions(system_id);
CREATE INDEX IF NOT EXISTS idx_system_actions_created ON central_brain_system_actions(created_at DESC);

-- ============================================================
-- 4. RLS 策略
-- ============================================================

ALTER TABLE central_brain_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_consolidation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_system_actions ENABLE ROW LEVEL SECURITY;

-- 简化 RLS：允许认证用户完全访问
DROP POLICY IF EXISTS "entities_all" ON central_brain_entities;
CREATE POLICY "entities_all" ON central_brain_entities FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "relations_all" ON central_brain_relations;
CREATE POLICY "relations_all" ON central_brain_relations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "memories_all" ON central_brain_memories;
CREATE POLICY "memories_all" ON central_brain_memories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "consolidation_logs_all" ON central_brain_consolidation_logs;
CREATE POLICY "consolidation_logs_all" ON central_brain_consolidation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "systems_all" ON central_brain_systems;
CREATE POLICY "systems_all" ON central_brain_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "system_actions_all" ON central_brain_system_actions;
CREATE POLICY "system_actions_all" ON central_brain_system_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. 触发器函数
-- ============================================================

-- 更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到实体表
DROP TRIGGER IF EXISTS tr_entities_updated ON central_brain_entities;
CREATE TRIGGER tr_entities_updated
  BEFORE UPDATE ON central_brain_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 应用到系统表
DROP TRIGGER IF EXISTS tr_systems_updated ON central_brain_systems;
CREATE TRIGGER tr_systems_updated
  BEFORE UPDATE ON central_brain_systems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 工具函数
-- ============================================================

-- 清理过期记忆
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM central_brain_memories
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 完成！
-- ============================================================

SELECT '✅ 中心大脑数据库迁移完成！' as message;

