'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMealPlans, getHouseholdGroups } from '@/lib/database';
import { Plus, Users, Calendar, ShoppingCart, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, userProfile, loading, profileLoading, signOut } = useAuth();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [householdGroups, setHouseholdGroups] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      console.log('Dashboard: No user, redirecting to login');
      router.push('/login');
      return;
    }

    // Wait for both auth loading and profile loading to complete
    if (!loading && !profileLoading && user && !userProfile) {
      console.log('Dashboard: User exists but no profile, redirecting to onboarding');
      console.log('User ID:', user.id);
      console.log('Profile state:', userProfile);
      console.log('Profile loading:', profileLoading);
      router.push('/onboarding');
      return;
    }
    
    if (!loading && !profileLoading && user && userProfile) {
      console.log('Dashboard: User and profile loaded successfully');
    }
    
    if (profileLoading) {
      console.log('Dashboard: Waiting for profile to load...');
    }
  }, [user, userProfile, loading, profileLoading, router]);

  useEffect(() => {
    if (userProfile?.household_id) {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      const [mealPlansData, groupsData] = await Promise.all([
        getMealPlans(userProfile?.household_id || '', 5),
        getHouseholdGroups(userProfile?.household_id || '')
      ]);
      
      setMealPlans(mealPlansData);
      setHouseholdGroups(groupsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  if (loading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userProfile.full_name}
              </h1>
              <p className="text-sm text-gray-600">
                {userProfile.households?.name || 'Your Household'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/groups">
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Groups
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await signOut();
                    // Use replace instead of push and redirect to home immediately
                    window.location.href = '/';
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Household Groups
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{householdGroups.length}</div>
              <p className="text-xs text-muted-foreground">
                Active groups for meal planning
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Meal Plans
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mealPlans.length}</div>
              <p className="text-xs text-muted-foreground">
                Total meal plans created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Week's Status
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Planning</div>
              <p className="text-xs text-muted-foreground">
                Ready to create meal plan
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to get started with meal planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/groups/new">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Household Group
                </Button>
              </Link>
              <Link href="/meal-plans/new">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Start New Meal Plan
                </Button>
              </Link>
              <Link href="/meals">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Meal Ideas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Meal Plans</CardTitle>
              <CardDescription>
                Your family's recent meal planning activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mealPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No meal plans yet</p>
                  <p className="text-sm">Create your first meal plan to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mealPlans.map((plan: any) => (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          Week of {new Date(plan.week_start_date).toLocaleDateString()}
                        </h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          Status: {plan.status.replace('_', ' ')}
                        </p>
                      </div>
                      <Link href={`/meal-plans/${plan.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}