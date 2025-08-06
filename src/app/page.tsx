'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only auto-redirect if user has completed onboarding
    if (!loading && user && userProfile) {
      router.push('/dashboard');
    }
  }, [user, userProfile, loading, router]);

  // Show loading for maximum 3 seconds, then show the page anyway
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Family Meal Planner
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform weekly meal planning from a stressful chore into a collaborative, 
            automated family process that respects individual preferences and dietary needs.
          </p>
          <div className="flex justify-center space-x-4">
            {user ? (
              <>
                <Link href="/onboarding">
                  <Button size="lg" className="px-8 py-3">
                    Complete Setup
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-3"
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="px-8 py-3">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Household Groups</CardTitle>
              <CardDescription>
                Create custom groups like "Whole House", "Just Kids", or "Adults Only" 
                with their own dietary restrictions and preferences.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Collaborative Planning</CardTitle>
              <CardDescription>
                Family members receive forms to share preferences, with real-time 
                collaboration and conflict resolution.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Smart Shopping Lists</CardTitle>
              <CardDescription>
                Auto-generated shopping lists with group-based quantities, 
                integrated with Walmart+ and Instacart.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Perfect for Busy Families
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-4">For Household Managers</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Set up household groups with dietary restrictions</li>
                <li>• Receive immediate notifications when forms are completed</li>
                <li>• Get organized shopping lists with store sections</li>
                <li>• Track family meal satisfaction over time</li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-4">For Family Members</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Quick mobile-friendly preference forms</li>
                <li>• Add special requests for specific groups</li>
                <li>• See only relevant meal options for your groups</li>
                <li>• Influence meals that affect you most</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}