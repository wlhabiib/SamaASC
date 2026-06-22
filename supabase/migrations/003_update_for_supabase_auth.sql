-- Update schema for Supabase Auth instead of Clerk

-- Rename clerk_org_id to clerk_organization_id (keeping for compatibility)
ALTER TABLE teams RENAME COLUMN clerk_org_id TO clerk_organization_id;

-- Make clerk_organization_id nullable since we might not use it with Supabase Auth
ALTER TABLE teams ALTER COLUMN clerk_organization_id DROP NOT NULL;
ALTER TABLE teams ALTER COLUMN clerk_organization_id SET DEFAULT NULL;

-- Add a function to create team with admin user
CREATE OR REPLACE FUNCTION create_team_with_admin(
  p_team_name TEXT,
  p_team_domain TEXT,
  p_admin_email TEXT,
  p_admin_username TEXT,
  p_admin_password_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Create the team
  INSERT INTO teams (name, slug, domain)
  VALUES (p_team_name, p_team_domain, p_team_domain)
  RETURNING id INTO v_team_id;
  
  -- Create a placeholder user ID (will be replaced by Supabase Auth user ID)
  v_user_id := uuid_generate_v4();
  
  -- Create the team member (admin)
  INSERT INTO team_members (team_id, clerk_user_id, email, first_name, last_name, role, is_active)
  VALUES (v_team_id, v_user_id, p_admin_email, 'Admin', p_team_name, 'owner', true);
  
  -- Return the result
  v_result := json_build_object(
    'success', true,
    'team_id', v_team_id,
    'user_id', v_user_id
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_team_with_admin TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_with_admin TO anon;
