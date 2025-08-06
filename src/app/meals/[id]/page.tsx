'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Clock, Users, ChefHat, ShoppingCart, ArrowLeft, Sparkles } from 'lucide-react';

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meal, setMeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      loadMeal();
    }
  }, [params.id]);

  const loadMeal = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setMeal(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load meal');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading meal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Meal not found</h3>
              <p className="text-muted-foreground mb-4">{error || 'This meal does not exist'}</p>
              <Button onClick={() => router.push('/meals')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Meals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/meals')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Meals
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{meal.title}</h1>
                {meal.ai_generated && (
                  <div className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Generated
                  </div>
                )}
              </div>
              {meal.description && (
                <p className="text-gray-600 text-lg">{meal.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChefHat className="w-5 h-5 mr-2" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {meal.instructions.map((instruction: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ingredients
                </CardTitle>
                <CardDescription>
                  For {meal.serving_size_base} servings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meal.ingredients.map((ingredient: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="text-muted-foreground">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Prep Time</div>
                      <div className="text-muted-foreground">{meal.prep_time_minutes} min</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Cook Time</div>
                      <div className="text-muted-foreground">{meal.cook_time_minutes} min</div>
                    </div>
                  </div>
                  <div className="flex items-center col-span-2">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Serves</div>
                      <div className="text-muted-foreground">{meal.serving_size_base} people</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="font-medium mb-2">Category</div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                    {meal.category.replace('_', ' ')}
                  </span>
                </div>

                {meal.dietary_tags && meal.dietary_tags.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Dietary Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {meal.dietary_tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  Add to Meal Plan
                </Button>
                <Button variant="outline" className="w-full">
                  Save to Favorites
                </Button>
                <Button variant="outline" className="w-full">
                  Share Recipe
                </Button>
              </CardContent>
            </Card>

            {meal.nutrition_info && Object.keys(meal.nutrition_info).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Info</CardTitle>
                  <CardDescription>Per serving</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(meal.nutrition_info).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}