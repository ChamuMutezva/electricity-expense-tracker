-- Add user_id column to electricity_readings table
ALTER TABLE electricity_readings 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id column to token_purchases table
ALTER TABLE token_purchases 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_electricity_readings_user_id 
ON electricity_readings(user_id);

CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id 
ON token_purchases(user_id);

-- Add comment to explain the schema
COMMENT ON COLUMN electricity_readings.user_id IS 'Stack Auth user ID who created this reading';
COMMENT ON COLUMN token_purchases.user_id IS 'Stack Auth user ID who made this purchase';
