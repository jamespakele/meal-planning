import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShoppingListRequest {
  mealPlanId: string;
  householdId: string;
}

interface ShoppingListItem {
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimated_cost?: number;
  is_staple: boolean;
  meal_sources: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const requestData: ShoppingListRequest = await req.json()

    // Get meal plan with entries and meals
    const { data: mealPlan, error: mealPlanError } = await supabaseClient
      .from('meal_plans')
      .select(`
        *,
        meal_plan_entries(
          *,
          meals(*)
        )
      `)
      .eq('id', requestData.mealPlanId)
      .single()

    if (mealPlanError) throw mealPlanError

    // Get household groups for serving calculations
    const { data: groups, error: groupsError } = await supabaseClient
      .from('household_groups')
      .select('*')
      .eq('household_id', requestData.householdId)

    if (groupsError) throw groupsError

    // Check if shopping list already exists
    const { data: existingList } = await supabaseClient
      .from('shopping_lists')
      .select('*')
      .eq('meal_plan_id', requestData.mealPlanId)
      .single()

    if (existingList) {
      return new Response(JSON.stringify({ 
        success: true, 
        shopping_list: existingList,
        message: 'Shopping list already exists'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Aggregate ingredients from all meals
    const ingredientMap = new Map<string, ShoppingListItem>()
    const commonStaples = ['salt', 'pepper', 'oil', 'butter', 'flour', 'sugar']

    mealPlan.meal_plan_entries.forEach((entry: any) => {
      if (!entry.meals?.ingredients) return

      const servingMultiplier = entry.serving_multiplier || 1
      const groupMultiplier = calculateGroupMultiplier(entry.assigned_groups, groups)
      const totalMultiplier = servingMultiplier * groupMultiplier

      entry.meals.ingredients.forEach((ingredient: any) => {
        const key = ingredient.name.toLowerCase()
        const adjustedQuantity = ingredient.quantity * totalMultiplier

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!
          existing.quantity += adjustedQuantity
          existing.meal_sources.push(entry.meals.title)
        } else {
          ingredientMap.set(key, {
            ingredient_id: `${entry.meals.id}_${ingredient.name}`,
            name: ingredient.name,
            quantity: adjustedQuantity,
            unit: ingredient.unit,
            category: ingredient.category || 'other',
            is_staple: commonStaples.some(staple => 
              ingredient.name.toLowerCase().includes(staple)
            ),
            meal_sources: [entry.meals.title]
          })
        }
      })
    })

    // Convert map to array and organize by category
    const shoppingItems = Array.from(ingredientMap.values())
    
    // Sort items by category and name
    const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'other']
    shoppingItems.sort((a, b) => {
      const categoryA = categoryOrder.indexOf(a.category)
      const categoryB = categoryOrder.indexOf(b.category)
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB
      }
      
      return a.name.localeCompare(b.name)
    })

    // Create shopping list record
    const { data: shoppingList, error: insertError } = await supabaseClient
      .from('shopping_lists')
      .insert({
        meal_plan_id: requestData.mealPlanId,
        household_id: requestData.householdId,
        items: shoppingItems,
        status: 'generated',
        total_estimated_cost: estimateTotalCost(shoppingItems)
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(JSON.stringify({ 
      success: true, 
      shopping_list: shoppingList,
      items_count: shoppingItems.length,
      categories: getCategoryBreakdown(shoppingItems)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in generate-shopping-list function:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function calculateGroupMultiplier(assignedGroups: string[], allGroups: any[]): number {
  if (!assignedGroups || assignedGroups.length === 0) return 1

  let totalPeople = 0
  assignedGroups.forEach(groupId => {
    const group = allGroups.find(g => g.id === groupId)
    if (group) {
      totalPeople += group.adult_count + group.teen_count + group.child_count + (group.toddler_count * 0.5)
    }
  })

  return Math.max(totalPeople / 4, 1) // Base serving size is typically 4
}

function estimateTotalCost(items: ShoppingListItem[]): number {
  // Simple cost estimation based on category averages
  const categoryPrices: Record<string, number> = {
    produce: 2.50,
    meat: 8.00,
    dairy: 3.50,
    pantry: 2.00,
    frozen: 4.00,
    other: 3.00
  }

  return items.reduce((total, item) => {
    const basePrice = categoryPrices[item.category] || 3.00
    return total + (basePrice * (item.quantity / 2)) // Rough estimation
  }, 0)
}

function getCategoryBreakdown(items: ShoppingListItem[]): Record<string, number> {
  const breakdown: Record<string, number> = {}
  items.forEach(item => {
    breakdown[item.category] = (breakdown[item.category] || 0) + 1
  })
  return breakdown
}