-- Fix the foreign key constraint issue for user_profiles.id
-- The id field references auth.users(id) but this can be problematic in local development

-- Drop the foreign key constraint on user_profiles.id
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Add a comment to clarify the relationship
COMMENT ON COLUMN user_profiles.id IS 'User ID from auth.users - not enforced as foreign key for local development compatibility';

-- The id field is still the primary key, just without the foreign key constraint to auth.users