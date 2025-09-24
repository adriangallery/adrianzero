-- Add position column to winners table
ALTER TABLE winners ADD COLUMN position INTEGER;

-- Update existing winners to have position 1 (if any exist)
UPDATE winners SET position = 1 WHERE position IS NULL;

-- Make position NOT NULL
ALTER TABLE winners ALTER COLUMN position SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_winners_position ON winners(position);
CREATE INDEX IF NOT EXISTS idx_winners_drawn_at ON winners(drawn_at);
