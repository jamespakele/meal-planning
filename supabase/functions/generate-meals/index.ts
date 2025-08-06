import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MealGenerationRequest {
  householdId: string;
  groupIds: string[];
  mealCategories: string[];
  preferences?: string[];
  excludeIngredients?: string[];
  mealCount?: number;
}

interface GeneratedMeal {
  title: string;
  description: string;
  category: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  serving_size_base: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
  instructions: string[];
  dietary_tags: string[];
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

    const requestData: MealGenerationRequest = await req.json()
    
    // Get household groups and their dietary restrictions
    const { data: groups, error: groupsError } = await supabaseClient
      .from('household_groups')
      .select('*')
      .in('id', requestData.groupIds)

    if (groupsError) throw groupsError

    // Collect all dietary restrictions from groups
    const allDietaryRestrictions = groups.reduce((acc: string[], group: any) => {
      return [...acc, ...group.dietary_restrictions]
    }, [])

    // Calculate total serving size based on group demographics
    const totalServings = groups.reduce((total: number, group: any) => {
      return total + group.adult_count + group.teen_count + group.child_count + (group.toddler_count * 0.5)
    }, 0)

    // Prepare OpenAI prompt
    const prompt = `Generate ${requestData.mealCount || 5} family meal ideas with the following requirements:

HOUSEHOLD REQUIREMENTS:
- Total servings needed: ${Math.ceil(totalServings)}
- Meal categories: ${requestData.mealCategories.join(', ')}
- Dietary restrictions: ${allDietaryRestrictions.join(', ')}
${requestData.excludeIngredients?.length ? `- Exclude ingredients: ${requestData.excludeIngredients.join(', ')}` : ''}
${requestData.preferences?.length ? `- Preferences: ${requestData.preferences.join(', ')}` : ''}

Please return a JSON array of meal objects, each with:
- title: string (meal name)
- description: string (brief description)
- category: string (one of: whole_house, group_specific, breakfast, backup)
- prep_time_minutes: number (preparation time)
- cook_time_minutes: number (cooking time) 
- serving_size_base: number (base serving size, typically 4-6)
- ingredients: array of objects with name, quantity, unit, category (produce/meat/dairy/pantry/frozen/other)
- instructions: array of strings (step-by-step instructions)
- dietary_tags: array of strings (tags like vegetarian, gluten-free, etc.)

Ensure all meals respect the dietary restrictions listed above.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful family meal planning assistant. Always return valid JSON arrays of meal objects that respect dietary restrictions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const generatedMealsText = openaiData.choices[0].message.content

    let generatedMeals: GeneratedMeal[]
    try {
      generatedMeals = JSON.parse(generatedMealsText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', generatedMealsText)
      throw new Error('Invalid response format from AI service')
    }

    // Save generated meals to database
    const mealsToInsert = generatedMeals.map(meal => ({
      ...meal,
      ai_generated: true,
      source: 'openai',
    }))

    const { data: savedMeals, error: insertError } = await supabaseClient
      .from('meals')
      .insert(mealsToInsert)
      .select()

    if (insertError) throw insertError

    return new Response(JSON.stringify({ 
      success: true, 
      meals: savedMeals,
      generated_count: savedMeals.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in generate-meals function:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})