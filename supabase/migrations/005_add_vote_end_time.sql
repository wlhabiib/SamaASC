-- Add vote_end_time column to matches table
ALTER TABLE matches 
ADD COLUMN vote_end_time TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN matches.vote_end_time IS 'Timestamp when voting for this match ends (3 hours after match completion)';
