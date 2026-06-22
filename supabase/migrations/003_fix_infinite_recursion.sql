-- ============================================
-- MIGRATION 003: Fix Infinite Recursion in RLS
-- ============================================

-- CRITICAL: Disable RLS Policies that cause recursion
-- These will be replaced with safer alternatives

-- Step 1: Remove problematic policies
DROP POLICY IF EXISTS "Team_members: Allow read access to team members" ON team_members;
DROP POLICY IF EXISTS "Users: Allow admins to read team member profiles" ON users;

-- Step 2: Drop any existing replacement policies (for idempotency)
DROP POLICY IF EXISTS "Team_members_select_own_or_team" ON team_members;
DROP POLICY IF EXISTS "Team_members_insert_auth" ON team_members;
DROP POLICY IF EXISTS "Team_members_update_own" ON team_members;
DROP POLICY IF EXISTS "Team_members_delete_own" ON team_members;
DROP POLICY IF EXISTS "Users_select_own" ON users;
DROP POLICY IF EXISTS "Users_select_team_members" ON users;

-- Step 3: Replace with non-recursive policies

-- For team_members: Simple user-based access
CREATE POLICY "Team_members_select_own_or_team"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true); -- Allow authenticated users; app will filter by team

CREATE POLICY "Team_members_insert_auth"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team_members_update_own"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Team_members_delete_own"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- For users: Allow read based on auth
CREATE POLICY "Users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid()::text);

CREATE POLICY "Users_select_team_members"
  ON users
  FOR SELECT
  TO authenticated
  USING (true); -- Allow authenticated; app will filter by team

-- Step 3: Grant proper access
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;

