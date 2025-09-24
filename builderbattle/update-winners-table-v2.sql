-- Add new columns to winners table for the correct logic
ALTER TABLE winners ADD COLUMN IF NOT EXISTS voter_address TEXT;
ALTER TABLE winners ADD COLUMN IF NOT EXISTS winner_type TEXT;
ALTER TABLE winners ADD COLUMN IF NOT EXISTS position INTEGER;

-- Update existing winners to have position 1 and winner_type 'participant' (if any exist)
UPDATE winners SET position = 1, winner_type = 'participant' WHERE position IS NULL;

-- Make position and winner_type NOT NULL
ALTER TABLE winners ALTER COLUMN position SET NOT NULL;
ALTER TABLE winners ALTER COLUMN winner_type SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_winners_position ON winners(position);
CREATE INDEX IF NOT EXISTS idx_winners_drawn_at ON winners(drawn_at);
CREATE INDEX IF NOT EXISTS idx_winners_winner_type ON winners(winner_type);
CREATE INDEX IF NOT EXISTS idx_winners_voter_address ON winners(voter_address);
