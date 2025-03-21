-- Add new columns to scraped_contacts table
ALTER TABLE scraped_contacts
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS office_hours TEXT;

-- Create search_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    location TEXT NOT NULL,
    keywords TEXT NOT NULL,
    results_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
); 