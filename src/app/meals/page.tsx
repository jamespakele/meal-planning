'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMeals, getHouseholdGroups } from '@/lib/database';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Clock, Users, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';

const MEAL_CATEGORIES = [
  { value: 'whole_house', label: 'Whole House', description: 'Meals for everyone' },
  { value: 'group_specific', label: 'Group Specific', description: 'Targeted group meals' },
  { value: 'breakfast', label: 'Breakfast', description: 'Morning meals' },
  { value: 'backup', label: 'Backup', description: 'Quick emergency meals' }
];

const DIETARY_FILTERS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-sodium', 'kid-friendly'
];

export default function MealsPage() {
  const { userProfile } = useAuth();
  const [meals, setMeals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (userProfile?.household_id) {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    try {
      const [mealsData, groupsData] = await Promise.all([
        getMeals(),
        getHouseholdGroups(userProfile!.household_id)
      ]);
      
      setMeals(mealsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading meals data:', error);
      setError('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const generateMeals = async () => {
    setGenerating(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-meals', {
        body: {
          householdId: userProfile!.household_id,
          groupIds: groups.map((g: any) => g.id),
          mealCategories: ['whole_house', 'group_specific', 'breakfast'],
          mealCount: 8
        }
      });

      if (error) throw error;

      await loadData(); // Refresh meals list
    } catch (error: any) {
      setError(error.message || 'Failed to generate meals');
    } finally {
      setGenerating(false);
    }
  };

  const filteredMeals = meals.filter((meal: any) => {
    const matchesSearch = meal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || meal.category === selectedCategory;
    const matchesDietary = selectedDietaryTags.length === 0 || 
                          selectedDietaryTags.some(tag => meal.dietary_tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesDietary;
  });

  const toggleDietaryFilter = (tag: string) => {
    if (selectedDietaryTags.includes(tag)) {
      setSelectedDietaryTags(selectedDietaryTags.filter(t => t !== tag));
    } else {
      setSelectedDietaryTags([...selectedDietaryTags, tag]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading meals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meal Ideas</h1>
            <p className="text-gray-600 mt-2">
              Browse and generate meal ideas for your family
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={generateMeals}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'Generate AI Meals'}
            </Button>
            <Link href="/meals/new">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Meal
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search meals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {MEAL_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Dietary:
            </span>
            {DIETARY_FILTERS.map((tag) => (
              <Button
                key={tag}
                variant={selectedDietaryTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDietaryFilter(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {filteredMeals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50">
                <Search className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No meals found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory || selectedDietaryTags.length > 0
                  ? 'Try adjusting your filters to see more results'
                  : 'Generate some AI meals or add your own custom meals to get started'
                }
              </p>
              {!searchTerm && !selectedCategory && selectedDietaryTags.length === 0 && (
                <Button onClick={generateMeals} disabled={generating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Your First Meals
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal: any) => (
              <Card key={meal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{meal.title}</CardTitle>
                      {meal.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {meal.description}
                        </CardDescription>
                      )}
                    </div>
                    {meal.ai_generated && (
                      <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {meal.prep_time_minutes + meal.cook_time_minutes} min
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {meal.serving_size_base} servings
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                      {meal.category.replace('_', ' ')}
                    </span>
                  </div>

                  {meal.dietary_tags && meal.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {meal.dietary_tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {meal.dietary_tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{meal.dietary_tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button variant="outline" className="w-full" disabled>
                      View Recipe (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}