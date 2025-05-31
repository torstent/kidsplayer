-- SQL script to create the albums table in Supabase
-- This should be executed in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS albums (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated users
-- You can adjust this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON albums
    FOR ALL USING (true);

-- Alternative: Allow public read access and authenticated write access
-- CREATE POLICY "Allow public read access" ON albums
--     FOR SELECT USING (true);
-- 
-- CREATE POLICY "Allow authenticated write access" ON albums
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow authenticated update access" ON albums
--     FOR UPDATE USING (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow authenticated delete access" ON albums
--     FOR DELETE USING (auth.role() = 'authenticated');

-- Add an index on title for faster searching
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title);

-- Add a trigger to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create users table for storing Spotify authentication tokens
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spotify_user_id VARCHAR(255) UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_in INTEGER NOT NULL,
    token_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table - allow all operations for now
CREATE POLICY "Allow all operations for users" ON users
    FOR ALL USING (true);

-- Add index on spotify_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_spotify_user_id ON users(spotify_user_id);

-- Add trigger to update the updated_at column for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();