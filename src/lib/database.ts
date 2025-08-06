import { createClient } from '@/lib/supabase/client';
import type { 
  User, 
  Household, 
  HouseholdGroup, 
  Meal, 
  MealPlan, 
  MealForm,
  ShoppingList 
} from '@/types';

// User Profile functions
export async function getUserProfile(userId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    // If profile exists, get household info separately
    if (data && data.household_id) {
      const { data: household } = await supabase
        .from('households')
        .select('*')
        .eq('id', data.household_id)
        .single();
        
      return {
        ...data,
        households: household
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createUserProfile(profile: Partial<User>) {
  const supabase = createClient();
  
  console.log('Creating user profile with data:', profile);
  
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', profile.id)
    .single();
  
  if (existingProfile) {
    console.log('Profile already exists, returning existing profile');
    return existingProfile;
  }
  
  // Check current auth state
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current authenticated user for profile creation:', user?.id);
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();
  
  if (error) {
    console.error('User profile creation error:', error);
    throw error;
  }
  
  console.log('User profile created successfully:', data);
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Household functions
export async function createHousehold(household: Partial<Household>) {
  const supabase = createClient();
  
  console.log('=== CREATING HOUSEHOLD ===');
  console.log('Input data:', household);
  
  // First check if the user exists in auth.users
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Auth check - User:', user?.id, 'Error:', authError);
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  // Test database connection
  const { data: testData, error: testError } = await supabase
    .from('households')
    .select('count', { count: 'exact', head: true });
  console.log('Database connection test:', { testData, testError });
  
  const { data, error } = await supabase
    .from('households')
    .insert(household)
    .select()
    .single();
  
  console.log('Insert result:', { data, error });
  
  if (error) {
    console.error('Household creation error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }
  
  console.log('Household created successfully:', data);
  return data;
}

export async function getHouseholdMembers(householdId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('household_id', householdId);
  
  if (error) throw error;
  return data;
}

// Household Group functions
export async function getHouseholdGroups(householdId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household_groups')
    .select(`
      *,
      household_group_members(
        user_id,
        user_profiles(id, full_name, demographic)
      )
    `)
    .eq('household_id', householdId);
  
  if (error) throw error;
  return data;
}

export async function createHouseholdGroup(group: Partial<HouseholdGroup>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household_groups')
    .insert(group)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateHouseholdGroup(groupId: string, updates: Partial<HouseholdGroup>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household_groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function addUserToGroup(groupId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household_group_members')
    .insert({ group_id: groupId, user_id: userId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removeUserFromGroup(groupId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('household_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  
  if (error) throw error;
}

// Meal functions
export async function getMeals(filters?: { category?: string, dietary_tags?: string[] }) {
  const supabase = createClient();
  let query = supabase.from('meals').select('*');
  
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters?.dietary_tags && filters.dietary_tags.length > 0) {
    query = query.overlaps('dietary_tags', filters.dietary_tags);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMeal(meal: Partial<Meal>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .insert(meal)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Meal Plan functions
export async function getMealPlans(householdId: string, limit?: number) {
  const supabase = createClient();
  let query = supabase
    .from('meal_plans')
    .select(`
      *,
      meal_plan_entries(
        *,
        meals(*)
      )
    `)
    .eq('household_id', householdId)
    .order('week_start_date', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMealPlan(mealPlan: Partial<MealPlan>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .insert(mealPlan)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateMealPlan(mealPlanId: string, updates: Partial<MealPlan>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .update(updates)
    .eq('id', mealPlanId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Meal Form functions
export async function getMealForm(formId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meal_forms')
    .select(`
      *,
      meal_plans(household_id),
      meal_form_responses(*)
    `)
    .eq('id', formId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getMealFormByToken(shareToken: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meal_forms')
    .select('*')
    .eq('share_token', shareToken)
    .eq('status', 'active')
    .single();
  
  if (error) throw error;
  return data;
}

export async function createMealForm(form: Partial<MealForm>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meal_forms')
    .insert(form)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function submitMealFormResponse(formId: string, userId: string, responses: Record<string, any>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meal_form_responses')
    .upsert({
      form_id: formId,
      user_id: userId,
      responses,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Shopping List functions
export async function getShoppingList(mealPlanId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('meal_plan_id', mealPlanId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
}

export async function createShoppingList(shoppingList: Partial<ShoppingList>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert(shoppingList)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateShoppingList(shoppingListId: string, updates: Partial<ShoppingList>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', shoppingListId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}