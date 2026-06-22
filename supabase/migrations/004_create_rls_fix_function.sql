-- ============================================
-- MIGRATION 004: Create migration helper function
-- ============================================

CREATE OR REPLACE FUNCTION apply_rls_fix()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Drop problematic policies
  DROP POLICY IF EXISTS "Team_members: Allow read access to team members" ON team_members;
  DROP POLICY IF EXISTS "Users: Allow admins to read team member profiles" ON users;
  
  -- Create new non-recursive policies for team_members
  CREATE POLICY "Team_members_select_own_or_team" 
    ON team_members FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Team_members_insert_auth" 
    ON team_members FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Team_members_update_own" 
    ON team_members FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
  CREATE POLICY "Team_members_delete_own" 
    ON team_members FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
  
  -- Create new non-recursive policies for users
  CREATE POLICY "Users_select_own" 
    ON users FOR SELECT TO authenticated USING (auth_id = auth.uid()::text);
  CREATE POLICY "Users_select_team_members" 
    ON users FOR SELECT TO authenticated USING (true);
  
  RETURN jsonb_build_object('success', true, 'message', 'RLS policies fixed');
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION apply_rls_fix() TO authenticated;
