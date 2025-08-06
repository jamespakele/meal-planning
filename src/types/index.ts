export interface User {
  id: string;
  household_id?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'primary_cook' | 'secondary_cook' | 'family_member';
  demographic: 'adult' | 'teen' | 'child' | 'toddler';
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
  households?: Household;
}

export interface HouseholdGroup {
  id: string;
  household_id: string;
  name: string;
  description?: string;
  adult_count: number;
  teen_count: number;
  child_count: number;
  toddler_count: number;
  dietary_restrictions: string[];
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HouseholdGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface Meal {
  id: string;
  title: string;
  description?: string;
  category: 'whole_house' | 'group_specific' | 'individual' | 'breakfast' | 'backup';
  prep_time_minutes: number;
  cook_time_minutes: number;
  serving_size_base: number;
  ingredients: MealIngredient[];
  instructions: string[];
  dietary_tags: string[];
  image_url?: string;
  nutrition_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MealIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'produce' | 'meat' | 'dairy' | 'pantry' | 'frozen' | 'other';
}

export interface MealPlan {
  id: string;
  household_id: string;
  week_start_date: string;
  status: 'draft' | 'collecting_responses' | 'finalized';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MealPlanEntry {
  id: string;
  meal_plan_id: string;
  meal_id: string;
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  assigned_groups: string[];
  assigned_cook: string;
  serving_multiplier: number;
  notes?: string;
}

export interface MealForm {
  id: string;
  meal_plan_id: string;
  title: string;
  description?: string;
  deadline: string;
  questions: MealFormQuestion[];
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface MealFormQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'rating';
  options?: string[];
  required: boolean;
  target_groups?: string[];
}

export interface MealFormResponse {
  id: string;
  form_id: string;
  user_id: string;
  responses: Record<string, any>;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  meal_plan_id: string;
  household_id: string;
  items: ShoppingListItem[];
  status: 'draft' | 'generated' | 'exported';
  total_estimated_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimated_cost?: number;
  is_staple: boolean;
  meal_sources: string[];
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  subscription_tier: 'basic' | 'family' | 'premium';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}