-- 知识图谱数据库表
-- 执行位置：Supabase Dashboard -> SQL Editor

-- 1. 实体表
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

-- 2. 关系表
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

-- 3. RLS 策略
ALTER TABLE central_brain_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entities_all" ON central_brain_entities;
CREATE POLICY "entities_all" ON central_brain_entities FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "relations_all" ON central_brain_relations;
CREATE POLICY "relations_all" ON central_brain_relations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. 触发器：更新 updated_at
CREATE OR REPLACE FUNCTION update_entity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_entities_updated ON central_brain_entities;
CREATE TRIGGER tr_entities_updated
  BEFORE UPDATE ON central_brain_entities
  FOR EACH ROW EXECUTE FUNCTION update_entity_updated_at();

