-- ============================================
-- SAMA ASC - SCHÉMA COMPLET SUPABASE
-- Optimisé pour Supabase Auth et multi-tenant
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE PRINCIPALES
-- ============================================

-- Table teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  logo_url TEXT,
  team_photo_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#3b82f6',
  accent_color TEXT DEFAULT '#f59e0b',
  nav_color TEXT DEFAULT '#1e293b',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table team_members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- Table players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  position TEXT DEFAULT 'DEF', -- 'GK', 'DEF', 'MID', 'FWD'
  jersey_number INTEGER,
  is_starter BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL,
  match_date DATE,
  match_time TIME,
  venue TEXT,
  competition TEXT,
  is_home BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
  score_home INTEGER,
  score_away INTEGER,
  formation TEXT DEFAULT '4-3-3',
  scorers JSONB,
  opponent_logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table match_lineup
CREATE TABLE IF NOT EXISTS match_lineup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  position_slot TEXT,
  is_substitute BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Table announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'other', -- 'match', 'training', 'event', 'other'
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table gallery
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'image', -- 'image', 'video'
  url TEXT NOT NULL,
  caption TEXT,
  event_type TEXT DEFAULT 'other', -- 'match', 'training', 'event', 'other'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table standings
CREATE TABLE IF NOT EXISTS standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  competition_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_name, team_id)
);

-- Table supporters
CREATE TABLE IF NOT EXISTS supporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table coach
CREATE TABLE IF NOT EXISTS coach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT DEFAULT 'Entraineur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table player_stats
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season TEXT DEFAULT '2024-2025',
  matches_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, season)
);

-- Table competitions
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season TEXT DEFAULT '2024-2025',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES POUR OPTIMISATION
-- ============================================

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_domain ON teams(domain);

-- Indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Indexes for players
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_jersey_number ON players(jersey_number);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition);

-- Indexes for match_lineup
CREATE INDEX IF NOT EXISTS idx_match_lineup_match_id ON match_lineup(match_id);
CREATE INDEX IF NOT EXISTS idx_match_lineup_player_id ON match_lineup(player_id);
CREATE INDEX IF NOT EXISTS idx_match_lineup_team_id ON match_lineup(team_id);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_team_id ON announcements(team_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_event_date ON announcements(event_date);

-- Indexes for gallery
CREATE INDEX IF NOT EXISTS idx_gallery_team_id ON gallery(team_id);
CREATE INDEX IF NOT EXISTS idx_gallery_type ON gallery(type);
CREATE INDEX IF NOT EXISTS idx_gallery_event_type ON gallery(event_type);

-- Indexes for standings
CREATE INDEX IF NOT EXISTS idx_standings_team_id ON standings(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_competition_name ON standings(competition_name);

-- Indexes for supporters
CREATE INDEX IF NOT EXISTS idx_supporters_team_id ON supporters(team_id);

-- Indexes for coach
CREATE INDEX IF NOT EXISTS idx_coach_team_id ON coach(team_id);

-- Indexes for player_stats
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_id ON player_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats(season);

-- Indexes for competitions
CREATE INDEX IF NOT EXISTS idx_competitions_team_id ON competitions(team_id);
CREATE INDEX IF NOT EXISTS idx_competitions_season ON competitions(season);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
-- Allow read access to authenticated users
CREATE POLICY "Teams: Allow read access to authenticated users"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert only for team members
CREATE POLICY "Teams: Allow insert for team members"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow update only for team members
CREATE POLICY "Teams: Allow update for team members"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Allow delete only for team owners
CREATE POLICY "Teams: Allow delete for team owners"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role = 'owner'
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Team_members: Allow read access to team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Team_members: Allow insert for team owners"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()::text
        AND tm.role = 'owner'
      )
    )
  );

CREATE POLICY "Team_members: Allow update for team owners and admins"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()::text
        AND tm.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Team_members: Allow delete for team owners"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()::text
        AND tm.role = 'owner'
      )
    )
  );

-- RLS Policies for players
CREATE POLICY "Players: Allow read access to team members"
  ON players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = players.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Players: Allow insert for team owners and admins"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = players.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Players: Allow update for team owners and admins"
  ON players FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = players.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Players: Allow delete for team owners and admins"
  ON players FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = players.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for matches
CREATE POLICY "Matches: Allow read access to team members"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = matches.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Matches: Allow insert for team owners and admins"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = matches.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Matches: Allow update for team owners and admins"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = matches.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Matches: Allow delete for team owners and admins"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = matches.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for match_lineup
CREATE POLICY "Match_lineup: Allow read access to team members"
  ON match_lineup FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = match_lineup.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Match_lineup: Allow insert for team owners and admins"
  ON match_lineup FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = match_lineup.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Match_lineup: Allow update for team owners and admins"
  ON match_lineup FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = match_lineup.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Match_lineup: Allow delete for team owners and admins"
  ON match_lineup FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = match_lineup.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for announcements
CREATE POLICY "Announcements: Allow read access to team members"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = announcements.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Announcements: Allow insert for team owners and admins"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = announcements.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Announcements: Allow update for team owners and admins"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = announcements.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Announcements: Allow delete for team owners and admins"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = announcements.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for gallery
CREATE POLICY "Gallery: Allow read access to team members"
  ON gallery FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = gallery.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Gallery: Allow insert for team owners and admins"
  ON gallery FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = gallery.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Gallery: Allow update for team owners and admins"
  ON gallery FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = gallery.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Gallery: Allow delete for team owners and admins"
  ON gallery FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = gallery.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for standings
CREATE POLICY "Standings: Allow read access to team members"
  ON standings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = standings.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Standings: Allow insert for team owners and admins"
  ON standings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = standings.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Standings: Allow update for team owners and admins"
  ON standings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = standings.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Standings: Allow delete for team owners and admins"
  ON standings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = standings.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for supporters
CREATE POLICY "Supporters: Allow read access to team members"
  ON supporters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = supporters.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Supporters: Allow insert for team owners and admins"
  ON supporters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = supporters.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Supporters: Allow delete for team owners and admins"
  ON supporters FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = supporters.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for coach
CREATE POLICY "Coach: Allow read access to team members"
  ON coach FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = coach.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Coach: Allow insert for team owners and admins"
  ON coach FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = coach.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Coach: Allow update for team owners and admins"
  ON coach FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = coach.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Coach: Allow delete for team owners and admins"
  ON coach FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = coach.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for player_stats
CREATE POLICY "Player_stats: Allow read access to team members"
  ON player_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = player_stats.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Player_stats: Allow insert for team owners and admins"
  ON player_stats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = player_stats.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Player_stats: Allow update for team owners and admins"
  ON player_stats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = player_stats.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for competitions
CREATE POLICY "Competitions: Allow read access to team members"
  ON competitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = competitions.team_id
      AND team_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Competitions: Allow insert for team owners and admins"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = competitions.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Competitions: Allow update for team owners and admins"
  ON competitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = competitions.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Competitions: Allow delete for team owners and admins"
  ON competitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = competitions.team_id
      AND team_members.user_id = auth.uid()::text
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_updated_at BEFORE UPDATE ON coach
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create team with admin user
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
  INSERT INTO team_members (team_id, user_id, email, first_name, last_name, role, is_active)
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

-- Function to get user's team
CREATE OR REPLACE FUNCTION get_user_team(p_user_id TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT, user_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.team_id,
    t.name as team_name,
    tm.role as user_role
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.user_id = p_user_id
  AND tm.is_active = true;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_team TO authenticated;
