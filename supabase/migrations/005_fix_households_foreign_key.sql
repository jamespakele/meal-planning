-- Fix the foreign key constraint issue by making created_by a simple UUID field
-- instead of referencing auth.users directly

-- Drop the foreign key constraint
ALTER TABLE households DROP CONSTRAINT IF EXISTS households_created_by_fkey;

-- The created_by field is now just a UUID without foreign key constraint
-- This allows us to store the user ID from auth without requiring the foreign key relationship
-- which can be problematic in local development

-- Add a comment to clarify the relationship
COMMENT ON COLUMN households.created_by IS 'User ID from auth.users - not enforced as foreign key for local development compatibility';