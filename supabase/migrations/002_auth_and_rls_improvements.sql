-- ============================================
-- SAMA ASC - MISE À JOUR MIGRATION 002
-- Amélioration de l'authentification et RLS
-- ============================================

-- ============================================
-- TABLE USERS (profil utilisateur)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id TEXT UNIQUE NOT NULL, -- Reference to auth.users.id
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for users
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users: Allow users to read their own profile" ON users;
DROP POLICY IF EXISTS "Users: Allow admins to read team member profiles" ON users;
DROP POLICY IF EXISTS "Users: Allow users to update their own profile" ON users;

-- RLS Policies for users
CREATE POLICY "Users: Allow users to read their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid()::text);

CREATE POLICY "Users: Allow admins to read team member profiles"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = users.auth_id
      AND EXISTS (
        SELECT 1 FROM team_members admin_tm
        WHERE admin_tm.team_id = tm.team_id
        AND admin_tm.user_id = auth.uid()::text
        AND admin_tm.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Users: Allow users to update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid()::text)
  WITH CHECK (auth_id = auth.uid()::text);

-- ============================================
-- AMÉLIORATION TABLE TEAM_MEMBERS
-- ============================================

-- Add updated_at trigger to team_members if not exists
DROP FUNCTION IF EXISTS update_team_members_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_members_updated_at_trigger ON team_members;
CREATE TRIGGER team_members_updated_at_trigger
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- ============================================
-- FONCTION RPC SÉCURISÉE : CREATE_TEAM_WITH_ADMIN
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_team_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION create_team_with_admin(
  p_team_name TEXT,
  p_team_domain TEXT,
  p_admin_email TEXT,
  p_admin_first_name TEXT DEFAULT NULL,
  p_admin_last_name TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_team_id UUID;
  v_user_id TEXT;
  v_team_member_id UUID;
  v_slug TEXT;
BEGIN
  -- Get the current user ID from auth context
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated to create a team'
    );
  END IF;

  -- Generate slug from team name
  v_slug := LOWER(REPLACE(REPLACE(p_team_name, ' ', '-'), '_', '-'));

  BEGIN
    -- 1. Create team
    INSERT INTO teams (name, domain, slug)
    VALUES (p_team_name, p_team_domain, v_slug)
    RETURNING id INTO v_team_id;

    -- 2. Create user profile if not exists
    INSERT INTO users (auth_id, email, first_name, last_name)
    VALUES (v_user_id, p_admin_email, p_admin_first_name, p_admin_last_name)
    ON CONFLICT (auth_id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      first_name = COALESCE(EXCLUDED.first_name, users.first_name),
      last_name = COALESCE(EXCLUDED.last_name, users.last_name),
      updated_at = NOW();

    -- 3. Add user as team member with admin role
    INSERT INTO team_members (team_id, user_id, email, first_name, last_name, role)
    VALUES (v_team_id, v_user_id, p_admin_email, p_admin_first_name, p_admin_last_name, 'owner')
    RETURNING id INTO v_team_member_id;

    -- Return success response
    RETURN jsonb_build_object(
      'success', true,
      'team_id', v_team_id,
      'user_id', v_user_id,
      'team_member_id', v_team_member_id,
      'slug', v_slug,
      'message', 'Team created successfully'
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Team slug or domain already exists'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
      );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION RPC SÉCURISÉE : GET_USER_TEAM_INFO
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_team_info() CASCADE;

CREATE OR REPLACE FUNCTION get_user_team_info()
RETURNS jsonb AS $$
DECLARE
  v_user_id TEXT;
  v_teams jsonb;
BEGIN
  v_user_id := auth.uid()::text;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get all teams for the current user with their role
  SELECT jsonb_agg(
    jsonb_build_object(
      'team_id', tm.team_id,
      'team_name', t.name,
      'slug', t.slug,
      'role', tm.role,
      'is_active', tm.is_active
    )
  ) INTO v_teams
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.user_id = v_user_id
  AND tm.is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'teams', COALESCE(v_teams, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION RPC SÉCURISÉE : ADD_TEAM_MEMBER
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS add_team_member(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION add_team_member(
  p_team_id UUID,
  p_member_email TEXT,
  p_member_first_name TEXT DEFAULT NULL,
  p_member_last_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'member'
)
RETURNS jsonb AS $$
DECLARE
  v_current_user_id TEXT;
  v_member_auth_id TEXT;
  v_is_admin BOOLEAN;
  v_team_member_id UUID;
BEGIN
  v_current_user_id := auth.uid()::text;

  -- Check if current user is owner or admin of the team
  SELECT EXISTS(
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = v_current_user_id
    AND role IN ('owner', 'admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only team owners or admins can add members'
    );
  END IF;

  -- Note: In production, you would look up the auth_id from your auth system
  -- For now, this is a placeholder - the actual auth_id should come from Supabase Auth
  -- This function should be called with the actual user_id from Supabase Auth
  
  INSERT INTO team_members (team_id, user_id, email, first_name, last_name, role)
  VALUES (p_team_id, p_member_email, p_member_email, p_member_first_name, p_member_last_name, p_role)
  RETURNING id INTO v_team_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'team_member_id', v_team_member_id,
    'message', 'Team member added successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already a member of this team'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AMÉLIORATION DES POLICIES RLS EXISTANTES
-- ============================================

-- Drop old policies and recreate improved ones for team_members
DROP POLICY IF EXISTS "Team_members: Allow read access to team members" ON team_members;
DROP POLICY IF EXISTS "Team_members: Allow insert for team owners" ON team_members;
DROP POLICY IF EXISTS "Team_members: Allow update for team owners and admins" ON team_members;
DROP POLICY IF EXISTS "Team_members: Allow delete for team owners" ON team_members;

DROP POLICY IF EXISTS "Players: Allow read access to team members" ON players;
DROP POLICY IF EXISTS "Players: Allow insert for team owners and admins" ON players;
DROP POLICY IF EXISTS "Players: Allow update for team owners and admins" ON players;
DROP POLICY IF EXISTS "Players: Allow delete for team owners and admins" ON players;

-- Recreate team_members policies
CREATE POLICY "Team_members: Allow read access to team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.team_id = team_members.team_id
      AND tm2.user_id = auth.uid()::text
      AND tm2.is_active = true
    )
  );

-- Improve players RLS to be more efficient

DROP POLICY IF EXISTS "Players: Allow read access to team members" ON players;
CREATE POLICY "Players: Allow read access to team members"
  ON players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = players.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.is_active = true
    )
  );

-- Similar improvements for other tables...
-- (patterns already exist in migration 001)

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION create_team_with_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_team_info TO authenticated;
GRANT EXECUTE ON FUNCTION add_team_member TO authenticated;

-- Allow authenticated users to call these functions
GRANT USAGE ON SCHEMA public TO authenticated;
