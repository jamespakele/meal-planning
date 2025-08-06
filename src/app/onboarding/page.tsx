'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createHousehold, createUserProfile } from '@/lib/database';

const DEMOGRAPHICS = [
  { value: 'adult', label: 'Adult' },
  { value: 'teen', label: 'Teenager (13-17)' },
  { value: 'child', label: 'Child (5-12)' },
  { value: 'toddler', label: 'Toddler (2-4)' }
];

const ROLES = [
  { value: 'primary_cook', label: 'Primary Cook', description: 'Main person responsible for meal planning and cooking' },
  { value: 'secondary_cook', label: 'Secondary Cook', description: 'Helps with cooking and meal planning' },
  { value: 'family_member', label: 'Family Member', description: 'Participates in meal decisions' }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Household setup
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  
  // Step 2: User profile
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('primary_cook');
  const [demographic, setDemographic] = useState('adult');
  
  // Debug logging
  console.log('Onboarding render:', { step, householdId, loading });
  
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  const clearAllData = () => {
    // Reset component state
    setStep(1);
    setHouseholdId('');
    setHouseholdName('');
    setError('');
    
    console.log('Cleared all onboarding data - step reset to 1');
  };

  const handleHouseholdSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Creating household via API...');
      
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: householdName,
          subscription_tier: 'basic'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create household');
      }

      const household = await response.json();
      console.log('Household created via API:', household);
      setHouseholdId(household.id);
      console.log('Moving to step 2');
      setStep(2);
    } catch (error: any) {
      console.error('Household creation error:', error);
      setError(error.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double submissions
    
    setLoading(true);
    setError('');

    try {
      if (!householdId) {
        throw new Error('Household not created');
      }

      console.log('Creating profile via API...');
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          household_id: householdId,
          full_name: fullName,
          role: role,
          demographic: demographic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const profile = await response.json();
      console.log('Profile created via API:', profile);

      await refreshProfile();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Profile creation error:', error);
      setError(error.message || 'Failed to create profile');
      setLoading(false); // Only set loading false on error
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Set Up Your Household</CardTitle>
            <CardDescription className="text-center">
              Let's start by creating your family's meal planning space
            </CardDescription>
            {/* Debug button */}
            <div className="text-center">
              <button 
                onClick={clearAllData}
                className="text-xs text-red-600 underline"
              >
                Clear Data & Start Fresh (Debug)
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleHouseholdSetup} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="householdName" className="text-sm font-medium">
                  Household Name
                </label>
                <Input
                  id="householdName"
                  type="text"
                  placeholder="e.g., The Smith Family"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed to family members when they join
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating household...' : 'Create Household'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Help us understand your role in the household
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSetup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role in Household</label>
              <div className="space-y-2">
                {ROLES.map((roleOption) => (
                  <label key={roleOption.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={roleOption.value}
                      checked={role === roleOption.value}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium">{roleOption.label}</div>
                      <div className="text-xs text-muted-foreground">{roleOption.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Age Group</label>
              <div className="grid grid-cols-2 gap-2">
                {DEMOGRAPHICS.map((demo) => (
                  <label key={demo.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="demographic"
                      value={demo.value}
                      checked={demographic === demo.value}
                      onChange={(e) => setDemographic(e.target.value)}
                    />
                    <span className="text-sm">{demo.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}