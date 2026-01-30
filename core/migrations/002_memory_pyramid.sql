-- 记忆金字塔数据库表
-- 执行位置：Supabase Dashboard -> SQL Editor

-- 1. 记忆表
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_memories_level ON central_brain_memories(level);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON central_brain_memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_expires ON central_brain_memories(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_content ON central_brain_memories USING gin(to_tsvector('simple', content));

-- RLS
ALTER TABLE central_brain_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_all" ON central_brain_memories;
CREATE POLICY "memories_all" ON central_brain_memories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. 记忆整合日志表
CREATE TABLE IF NOT EXISTS central_brain_consolidation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  memories_processed INTEGER DEFAULT 0,
  memories_promoted INTEGER DEFAULT 0,
  memories_discarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE central_brain_consolidation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consolidation_logs_all" ON central_brain_consolidation_logs;
CREATE POLICY "consolidation_logs_all" ON central_brain_consolidation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. 函数：自动清理过期记忆（可通过 cron 调用）
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

