-- Check if user_role type exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'sales_manager');
    END IF;
END $$;

-- Add role column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user'::user_role NOT NULL;

-- Update existing profiles to have the 'user' role if they don't have one
UPDATE profiles 
SET role = 'user'::user_role 
WHERE role IS NULL; 