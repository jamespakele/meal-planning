'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createHousehold, createUserProfile } from '@/lib/database';

export default function SimpleOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 data
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  
  // Step 2 data
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('primary_cook');
  
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  console.log('Simple onboarding render - step:', step, 'householdId:', householdId);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const household = await createHousehold({
        name: householdName,
        created_by: user!.id,
        subscription_tier: 'basic'
      });

      setHouseholdId(household.id);
      setStep(2);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createUserProfile({
        id: user!.id,
        household_id: householdId,
        full_name: fullName,
        role: role as any,
        demographic: 'adult'
      });

      await refreshProfile();
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Step 1: Create Household</CardTitle>
            <CardDescription>Enter your household name</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <Input
                type="text"
                placeholder="Household Name"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
              />
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Household'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Step 2: Complete Profile</CardTitle>
          <CardDescription>Enter your details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStep2} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="primary_cook">Primary Cook</option>
              <option value="secondary_cook">Secondary Cook</option>
              <option value="family_member">Family Member</option>
            </select>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}