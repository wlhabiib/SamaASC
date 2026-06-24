-- Add match_votes table for voting on player of the match
CREATE TABLE IF NOT EXISTS match_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, voter_name, team_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_match_votes_match_id ON match_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_votes_team_id ON match_votes(team_id);
CREATE INDEX IF NOT EXISTS idx_match_votes_player_id ON match_votes(player_id);
