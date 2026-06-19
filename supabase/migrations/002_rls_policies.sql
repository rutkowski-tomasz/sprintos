-- Table-level privileges for the authenticated role (required alongside RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- goals
CREATE POLICY "goals: select own" ON goals FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "goals: insert own" ON goals FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "goals: update own" ON goals FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "goals: delete own" ON goals FOR DELETE USING ("userId" = auth.uid());

-- tasks
CREATE POLICY "tasks: select own" ON tasks FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "tasks: insert own" ON tasks FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "tasks: update own" ON tasks FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "tasks: delete own" ON tasks FOR DELETE USING ("userId" = auth.uid());
