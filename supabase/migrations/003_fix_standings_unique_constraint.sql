-- Fix standings table unique constraint to allow multiple teams per competition
-- Drop the old constraint that only allowed one team per competition per team_id
ALTER TABLE standings DROP CONSTRAINT IF EXISTS standings_competition_name_team_id_key;

-- Add a new constraint that allows multiple teams per competition
-- The combination of competition_name and team_name should be unique within a team
-- This allows adding multiple different teams to the standings for the same competition
ALTER TABLE standings ADD CONSTRAINT standings_competition_name_team_name_team_id_key UNIQUE(competition_name, team_name, team_id);
