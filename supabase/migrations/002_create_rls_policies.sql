-- RLS Policies for Teams Table

-- Policy: Users can only view teams they are members of
CREATE POLICY "Users can view teams they are members of"
ON teams FOR SELECT
USING (
  id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text
  )
);

-- Policy: Only team owners/admins can update team information
CREATE POLICY "Team owners and admins can update team"
ON teams FOR UPDATE
USING (
  id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- Policy: Only team owners can delete teams
CREATE POLICY "Team owners can delete team"
ON teams FOR DELETE
USING (
  id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role = 'owner'
  )
);

-- RLS Policies for Team Members Table

-- Policy: Users can view team members of their own teams
CREATE POLICY "Users can view team members of their teams"
ON team_members FOR SELECT
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text
  )
);

-- Policy: Team owners/admins can insert new team members
CREATE POLICY "Team owners and admins can insert team members"
ON team_members FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- Policy: Team owners/admins can update team members
CREATE POLICY "Team owners and admins can update team members"
ON team_members FOR UPDATE
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- Policy: Team owners can delete team members
CREATE POLICY "Team owners can delete team members"
ON team_members FOR DELETE
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role = 'owner'
  )
);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update their own profile"
ON team_members FOR UPDATE
USING (
  clerk_user_id = auth.uid()::text
)
WITH CHECK (
  clerk_user_id = auth.uid()::text
  AND role = (SELECT role FROM team_members WHERE id = team_members.id)
);

-- Helper function to get current user's team_id
CREATE OR REPLACE FUNCTION get_current_user_team_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
