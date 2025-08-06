-- Enable Row Level Security on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_groups ENABLE ROW LEVEL SECURITY;  
ALTER TABLE household_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_ratings ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user's household_id
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT household_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Households policies
CREATE POLICY "Users can view their own household" ON households
    FOR SELECT USING (
        id = get_user_household_id() OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can create households" ON households
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Household creators can update their household" ON households
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Household creators can delete their household" ON households
    FOR DELETE USING (created_by = auth.uid());

-- User profiles policies
CREATE POLICY "Users can view profiles in their household" ON user_profiles
    FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (id = auth.uid());

-- Household groups policies
CREATE POLICY "Users can view groups in their household" ON household_groups
    FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can create groups in their household" ON household_groups
    FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update groups in their household" ON household_groups
    FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete groups in their household" ON household_groups
    FOR DELETE USING (household_id = get_user_household_id());

-- Household group members policies
CREATE POLICY "Users can view group memberships in their household" ON household_group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_groups hg 
            WHERE hg.id = group_id AND hg.household_id = get_user_household_id()
        )
    );

CREATE POLICY "Users can manage group memberships in their household" ON household_group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM household_groups hg 
            WHERE hg.id = group_id AND hg.household_id = get_user_household_id()
        )
    );

-- Meals policies (meals are global but filtered by household preferences)
CREATE POLICY "All authenticated users can view meals" ON meals
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create meals" ON meals
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update meals" ON meals
    FOR UPDATE TO authenticated USING (true);

-- Meal plans policies
CREATE POLICY "Users can view meal plans in their household" ON meal_plans
    FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can create meal plans in their household" ON meal_plans
    FOR INSERT WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update meal plans in their household" ON meal_plans
    FOR UPDATE USING (household_id = get_user_household_id());

CREATE POLICY "Users can delete meal plans in their household" ON meal_plans
    FOR DELETE USING (household_id = get_user_household_id());

-- Meal plan entries policies
CREATE POLICY "Users can view meal plan entries in their household" ON meal_plan_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plans mp 
            WHERE mp.id = meal_plan_id AND mp.household_id = get_user_household_id()
        )
    );

CREATE POLICY "Users can manage meal plan entries in their household" ON meal_plan_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM meal_plans mp 
            WHERE mp.id = meal_plan_id AND mp.household_id = get_user_household_id()
        )
    );

-- Meal forms policies
CREATE POLICY "Users can view forms in their household" ON meal_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plans mp 
            WHERE mp.id = meal_plan_id AND mp.household_id = get_user_household_id()
        )
    );

CREATE POLICY "Users can create forms in their household" ON meal_forms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_plans mp 
            WHERE mp.id = meal_plan_id AND mp.household_id = get_user_household_id()
        )
    );

CREATE POLICY "Users can update forms in their household" ON meal_forms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_plans mp 
            WHERE mp.id = meal_plan_id AND mp.household_id = get_user_household_id()
        )
    );

-- Public access for form responses via share token
CREATE POLICY "Public can view forms via share token" ON meal_forms
    FOR SELECT USING (status = 'active');

-- Meal form responses policies
CREATE POLICY "Users can view responses in their household" ON meal_form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_forms mf
            JOIN meal_plans mp ON mf.meal_plan_id = mp.id
            WHERE mf.id = form_id AND mp.household_id = get_user_household_id()
        )
    );

CREATE POLICY "Users can create their own responses" ON meal_form_responses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own responses" ON meal_form_responses
    FOR UPDATE USING (user_id = auth.uid());

-- Shopping lists policies
CREATE POLICY "Users can view shopping lists in their household" ON shopping_lists
    FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can manage shopping lists in their household" ON shopping_lists
    FOR ALL USING (household_id = get_user_household_id());

-- Meal ratings policies
CREATE POLICY "Users can view ratings in their household" ON meal_ratings
    FOR SELECT USING (household_id = get_user_household_id());

CREATE POLICY "Users can create their own ratings" ON meal_ratings
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        household_id = get_user_household_id()
    );

CREATE POLICY "Users can update their own ratings" ON meal_ratings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ratings" ON meal_ratings
    FOR DELETE USING (user_id = auth.uid());