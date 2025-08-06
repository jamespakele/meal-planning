'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { updateMealPlan } from '@/lib/database';
import { Calendar, Users, Clock, Send, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function MealPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      loadMealPlan();
    }
  }, [params.id]);

  const loadMealPlan = async () => {
    try {
      // Load meal plan details
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_entries(
            *,
            meals(*)
          )
        `)
        .eq('id', params.id)
        .single();

      if (mealPlanError) throw mealPlanError;

      // Load associated forms
      const { data: formsData, error: formsError } = await supabase
        .from('meal_forms')
        .select(`
          *,
          meal_form_responses(*)
        `)
        .eq('meal_plan_id', params.id);

      if (formsError) throw formsError;

      // Load household members for response tracking
      const { data: membersData, error: membersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('household_id', userProfile!.household_id);

      if (membersError) throw membersError;

      setMealPlan(mealPlanData);
      setForms(formsData);
      
      // Process responses
      const allResponses = formsData.reduce((acc: any[], form: any) => {
        return [...acc, ...form.meal_form_responses];
      }, []);
      setResponses(allResponses);

    } catch (error: any) {
      setError(error.message || 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const finalizeMealPlan = async () => {
    try {
      await updateMealPlan(mealPlan.id, {
        status: 'finalized',
        finalized_at: new Date().toISOString()
      });
      
      await loadMealPlan(); // Refresh data
    } catch (error: any) {
      setError(error.message || 'Failed to finalize meal plan');
    }
  };

  const getResponseStats = () => {
    const totalMembers = forms.length > 0 ? forms[0].meal_form_responses?.length || 0 : 0;
    const completedResponses = responses.filter(r => r.submitted_at).length;
    const pendingResponses = responses.filter(r => !r.submitted_at).length;
    
    return { totalMembers, completedResponses, pendingResponses };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading meal plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Meal plan not found</h3>
              <p className="text-muted-foreground mb-4">{error || 'This meal plan does not exist'}</p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = getResponseStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Week of {format(new Date(mealPlan.week_start_date), 'MMMM d, yyyy')}
              </h1>
              <div className="flex items-center mt-2 space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  mealPlan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  mealPlan.status === 'collecting_responses' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {mealPlan.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(mealPlan.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            {mealPlan.status === 'collecting_responses' && (
              <Button onClick={finalizeMealPlan}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalize Plan
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Response Collection Status */}
            {forms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Family Response Status
                  </CardTitle>
                  <CardDescription>
                    Track family member participation in meal planning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completedResponses}</div>
                      <div className="text-sm text-green-800">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingResponses}</div>
                      <div className="text-sm text-yellow-800">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalMembers > 0 ? Math.round((stats.completedResponses / stats.totalMembers) * 100) : 0}%
                      </div>
                      <div className="text-sm text-blue-800">Completion Rate</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {forms.map((form: any) => (
                      <div key={form.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{form.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Link href={`/forms/${form.share_token}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Form
                              </Button>
                            </Link>
                            <Link href={`/forms/${form.share_token}/responses`}>
                              <Button variant="outline" size="sm">
                                View Responses
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{form.description}</p>
                        
                        {form.deadline && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            Deadline: {format(new Date(form.deadline), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meal Plan Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Weekly Meal Schedule
                </CardTitle>
                <CardDescription>
                  Planned meals for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mealPlan.meal_plan_entries && mealPlan.meal_plan_entries.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group meals by date */}
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(mealPlan.week_start_date);
                      date.setDate(date.getDate() + i);
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayMeals = mealPlan.meal_plan_entries.filter((entry: any) => entry.date === dateStr);
                      
                      return (
                        <div key={dateStr} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            {format(date, 'EEEE, MMM d')}
                          </h4>
                          {dayMeals.length > 0 ? (
                            <div className="space-y-2">
                              {dayMeals.map((entry: any) => (
                                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="font-medium capitalize">{entry.meal_time}: </span>
                                    <span>{entry.meals?.title || 'Meal TBD'}</span>
                                  </div>
                                  {entry.assigned_cook && (
                                    <span className="text-sm text-muted-foreground">
                                      Cook: {entry.assigned_cook}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No meals planned</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No meals scheduled yet</p>
                    <p className="text-sm">Meals will appear here after responses are collected and processed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {forms.map((form: any) => (
                  <div key={form.id} className="space-y-2">
                    <Link href={`/forms/${form.share_token}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Send className="w-4 h-4 mr-2" />
                        Share Form Link
                      </Button>
                    </Link>
                  </div>
                ))}
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Add Meals to Schedule
                </Button>
                {mealPlan.status === 'finalized' && (
                  <Link href={`/shopping-lists/${mealPlan.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      Generate Shopping List
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Status Alerts */}
            {mealPlan.status === 'collecting_responses' && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Collecting Responses</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Family members are currently filling out their meal preferences. 
                        You can finalize the plan once you have enough responses.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {forms.length > 0 && forms[0].deadline && new Date(forms[0].deadline) < new Date() && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Deadline Passed</h4>
                      <p className="text-sm text-red-700 mt-1">
                        The response deadline has passed. Consider finalizing the meal plan 
                        with the current responses.
                      </p>
                    </div>
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