'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createMealPlan, createMealForm } from '@/lib/database';
import { Calendar, Users, Clock, Send } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const MEAL_TIMES = ['breakfast', 'lunch', 'dinner'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NewMealPlanPage() {
  const [weekStartDate, setWeekStartDate] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  const { userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Set default week start date to next Monday
    const nextMonday = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });
    setWeekStartDate(format(nextMonday, 'yyyy-MM-dd'));
    
    // Set default deadline to Friday at 6 PM (3 days from now)
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 3);
    defaultDeadline.setHours(18, 0, 0, 0);
    
    // Format for datetime-local input
    const year = defaultDeadline.getFullYear();
    const month = String(defaultDeadline.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDeadline.getDate()).padStart(2, '0');
    const hours = String(defaultDeadline.getHours()).padStart(2, '0');
    const minutes = String(defaultDeadline.getMinutes()).padStart(2, '0');
    
    setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);

    if (userProfile?.household_id) {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    try {
      setError(''); // Clear any previous errors
      
      // Use API route instead of direct database call to avoid auth issues
      const response = await fetch('/api/groups');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groups API error:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch groups data: ${response.status} ${response.statusText}`);
      }
      const groupsData = await response.json();
      
      setGroups(groupsData);
      
      // Auto-generate form title and description
      if (weekStartDate) {
        const weekStart = new Date(weekStartDate);
        if (!isNaN(weekStart.getTime())) {
          setFormTitle(`Meal Preferences - Week of ${format(weekStart, 'MMM d, yyyy')}`);
          setFormDescription('Please share your meal preferences for the upcoming week. Your input helps us plan meals that everyone will enjoy!');
        }
      }
    } catch (error: any) {
      console.error('Error loading groups data:', error);
      setError(error.message || 'Failed to load household groups');
    } finally {
      setDataLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const generateFormQuestions = () => {
    const questions = [];

    // General meal preferences
    questions.push({
      question: "What types of meals are you in the mood for this week?",
      type: "multiple_choice",
      options: [
        "Comfort food",
        "Healthy & light",
        "International cuisine",
        "Quick & easy",
        "Family favorites",
        "Try something new"
      ],
      required: false
    });

    // Group-specific questions
    selectedGroups.forEach((groupId) => {
      const group = groups.find((g: any) => g.id === groupId);
      if (group) {
        questions.push({
          question: `Any special meal requests for "${group.name}"?`,
          type: "text",
          required: false,
          target_groups: [groupId]
        });
      }
    });

    // Dietary restrictions check
    questions.push({
      question: "Are there any ingredients we should avoid this week?",
      type: "text",
      required: false
    });

    // Cooking availability
    questions.push({
      question: "Which days are you available to help with cooking?",
      type: "multiple_choice",
      options: DAYS_OF_WEEK,
      required: false
    });

    // Meal ratings for planning
    questions.push({
      question: "How important is variety in this week's meals?",
      type: "single_choice",
      options: ["Very important", "Somewhat important", "Not important"],
      required: true
    });

    return questions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate dates before processing
      if (!weekStartDate) {
        throw new Error('Please select a week start date');
      }
      
      if (!deadline) {
        throw new Error('Please select a deadline');
      }

      // Validate deadline is a valid date
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Invalid deadline date selected');
      }

      if (selectedGroups.length === 0) {
        throw new Error('Please select at least one household group');
      }

      // Create meal plan
      const mealPlan = await createMealPlan({
        household_id: userProfile!.household_id,
        week_start_date: weekStartDate,
        status: 'collecting_responses',
        created_by: userProfile!.id
      });

      // Create form with generated questions
      const form = await createMealForm({
        meal_plan_id: mealPlan.id,
        title: formTitle,
        description: formDescription,
        deadline: deadlineDate.toISOString(),
        questions: generateFormQuestions(),
        status: 'active'
      });

      // Navigate to dashboard with success message for now
      // TODO: Create meal plan detail page at /meal-plans/[id]
      router.push('/dashboard?created=meal-plan');
    } catch (error: any) {
      console.error('Error creating meal plan:', error);
      
      // Handle specific database constraint errors
      if (error.message?.includes('duplicate key value violates unique constraint') || 
          error.message?.includes('meal_plans_household_id_week_start_date_key')) {
        setError(`A meal plan already exists for the week of ${weekStartDate}. Please choose a different week or edit the existing meal plan.`);
      } else {
        setError(error.message || 'Failed to create meal plan');
      }
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading meal plan setup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Meal Plan</h1>
          <p className="text-gray-600 mt-2">
            Set up a weekly meal plan and collect family preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meal Plan Setup</CardTitle>
            <CardDescription>
              Configure your meal planning week and preference collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="weekStart" className="text-sm font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Week Starting
                  </label>
                  <Input
                    id="weekStart"
                    type="date"
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose the Monday that starts your meal planning week
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="deadline" className="text-sm font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Response Deadline
                  </label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    When family members should complete their preferences
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Target Groups
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select which household groups this meal plan will cover
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {groups.map((group: any) => (
                    <label key={group.id} className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {group.adult_count} adults, {group.teen_count} teens, {group.child_count} children, {group.toddler_count} toddlers
                        </div>
                        {group.dietary_restrictions && group.dietary_restrictions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {group.dietary_restrictions.slice(0, 3).map((restriction: string) => (
                              <span
                                key={restriction}
                                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                              >
                                {restriction}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preference Collection Form</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="formTitle" className="text-sm font-medium">
                      Form Title
                    </label>
                    <Input
                      id="formTitle"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="formDescription" className="text-sm font-medium">
                      Form Description
                    </label>
                    <textarea
                      id="formDescription"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Instructions for family members..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Form Preview</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• General meal preferences and mood</p>
                  {selectedGroups.length > 0 && <p>• Group-specific meal requests</p>}
                  <p>• Ingredients to avoid</p>
                  <p>• Cooking availability</p>
                  <p>• Variety importance rating</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || selectedGroups.length === 0}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Meal Plan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}