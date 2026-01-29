-- 外部连接器数据库表
-- 执行位置：Supabase Dashboard -> SQL Editor

-- 1. 外部系统表
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

-- 2. 系统操作日志表
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

-- RLS
ALTER TABLE central_brain_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE central_brain_system_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "systems_all" ON central_brain_systems;
CREATE POLICY "systems_all" ON central_brain_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "system_actions_all" ON central_brain_system_actions;
CREATE POLICY "system_actions_all" ON central_brain_system_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 触发器
CREATE OR REPLACE FUNCTION update_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_systems_updated ON central_brain_systems;
CREATE TRIGGER tr_systems_updated
  BEFORE UPDATE ON central_brain_systems
  FOR EACH ROW EXECUTE FUNCTION update_system_updated_at();

