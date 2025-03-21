-- Drop and recreate enum for user roles if needed
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('user', 'admin', 'sales_manager');

-- Drop existing tables if they exist (comment these out if you want to preserve data)
-- DROP TABLE IF EXISTS user_actions CASCADE;
-- DROP TABLE IF EXISTS scraped_contacts CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  name TEXT,
  UNIQUE(email)
);

-- Create scraped_contacts table
CREATE TABLE IF NOT EXISTS scraped_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  social_media JSONB,
  business_hours TEXT,
  rating NUMERIC,
  review_count INTEGER,
  categories TEXT[],
  location TEXT NOT NULL,
  keywords TEXT NOT NULL
);

-- Create user_actions table for audit logging
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_scraped_contacts_user_id;
DROP INDEX IF EXISTS idx_user_actions_user_id;
DROP INDEX IF EXISTS idx_profiles_email;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraped_contacts_user_id ON scraped_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own scraped contacts" ON scraped_contacts;
DROP POLICY IF EXISTS "Users can insert own scraped contacts" ON scraped_contacts;
DROP POLICY IF EXISTS "Users can view own actions" ON user_actions;
DROP POLICY IF EXISTS "Users can insert own actions" ON user_actions;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own scraped contacts"
  ON scraped_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraped contacts"
  ON scraped_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own actions"
  ON user_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
  ON user_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 