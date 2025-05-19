-- Create tables for electricity expense tracker

-- Table for electricity readings
CREATE TABLE IF NOT EXISTS electricity_readings (
  id SERIAL PRIMARY KEY,
  reading_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  reading DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('morning', 'evening', 'night')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for token purchases
CREATE TABLE IF NOT EXISTS token_purchases (
  id SERIAL PRIMARY KEY,
  token_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  units DECIMAL(10, 2) NOT NULL,
  new_reading DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON electricity_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_tokens_timestamp ON token_purchases(timestamp);