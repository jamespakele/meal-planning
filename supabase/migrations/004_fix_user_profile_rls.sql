-- Fix user_profiles RLS policies to handle initial profile creation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view profiles in their household" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;

-- Create improved policies
CREATE POLICY "Users can view their own profile or profiles in their household" ON user_profiles
    FOR SELECT USING (
        id = auth.uid() OR 
        household_id = get_user_household_id()
    );

CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Also update the helper function to handle null cases better
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT household_id 
        FROM user_profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;