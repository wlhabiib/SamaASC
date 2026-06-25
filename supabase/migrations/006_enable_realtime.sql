-- Enable Realtime for all tables
-- This allows instant synchronization across devices

-- Enable realtime for matches
alter publication supabase_realtime add table matches;

-- Enable realtime for players
alter publication supabase_realtime add table players;

-- Enable realtime for announcements
alter publication supabase_realtime add table announcements;

-- Enable realtime for gallery
alter publication supabase_realtime add table gallery;

-- Enable realtime for standings
alter publication supabase_realtime add table standings;

-- Enable realtime for supporters
alter publication supabase_realtime add table supporters;

-- Enable realtime for match_votes
alter publication supabase_realtime add table match_votes;

-- Enable realtime for match_lineup
alter publication supabase_realtime add table match_lineup;

-- Enable realtime for coach
alter publication supabase_realtime add table coach;

-- Enable realtime for player_stats
alter publication supabase_realtime add table player_stats;
