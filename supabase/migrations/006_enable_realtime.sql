-- Enable Realtime for all tables
-- This allows instant synchronization across devices
-- Uses DO blocks to handle tables that might already be in the publication

-- Enable realtime for matches
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
end $$;

-- Enable realtime for players
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
end $$;

-- Enable realtime for announcements
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'announcements'
  ) then
    alter publication supabase_realtime add table announcements;
  end if;
end $$;

-- Enable realtime for gallery
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'gallery'
  ) then
    alter publication supabase_realtime add table gallery;
  end if;
end $$;

-- Enable realtime for standings
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'standings'
  ) then
    alter publication supabase_realtime add table standings;
  end if;
end $$;

-- Enable realtime for supporters
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'supporters'
  ) then
    alter publication supabase_realtime add table supporters;
  end if;
end $$;

-- Enable realtime for match_votes
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'match_votes'
  ) then
    alter publication supabase_realtime add table match_votes;
  end if;
end $$;

-- Enable realtime for match_lineup
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'match_lineup'
  ) then
    alter publication supabase_realtime add table match_lineup;
  end if;
end $$;

-- Enable realtime for coach
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'coach'
  ) then
    alter publication supabase_realtime add table coach;
  end if;
end $$;

-- Enable realtime for player_stats
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'player_stats'
  ) then
    alter publication supabase_realtime add table player_stats;
  end if;
end $$;

-- Enable realtime for competitions
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'competitions'
  ) then
    alter publication supabase_realtime add table competitions;
  end if;
end $$;
