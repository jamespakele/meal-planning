'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const COMMON_DIETARY_RESTRICTIONS = [
  'No nuts', 'No dairy', 'No gluten', 'No tomatoes', 'No seafood',
  'Vegetarian', 'Vegan', 'Low sodium', 'Diabetic friendly', 'No spicy food'
];

export default function EditGroupPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [teenCount, setTeenCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [toddlerCount, setToddlerCount] = useState(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [customRestriction, setCustomRestriction] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const { userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const loadGroupData = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const group = await response.json();
        setName(group.name);
        setDescription(group.description || '');
        setAdultCount(group.adult_count);
        setTeenCount(group.teen_count);
        setChildCount(group.child_count);
        setToddlerCount(group.toddler_count);
        setDietaryRestrictions(group.dietary_restrictions || []);
        
        // Set selected members
        const memberIds = group.household_group_members?.map((m: any) => m.user_id) || [];
        setSelectedMembers(memberIds);
      } else {
        setError('Failed to load group data');
      }
    } catch (error) {
      console.error('Error loading group:', error);
      setError('Failed to load group data');
    } finally {
      setPageLoading(false);
    }
  }, [groupId]);

  const loadHouseholdMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/households/members');
      if (response.ok) {
        const members = await response.json();
        setHouseholdMembers(members);
      }
    } catch (error) {
      console.error('Error loading household members:', error);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.household_id) {
      loadGroupData();
      loadHouseholdMembers();
    }
  }, [userProfile, groupId, loadGroupData, loadHouseholdMembers]);

  const handleCountChange = (type: string, delta: number) => {
    const setters = {
      adult: setAdultCount,
      teen: setTeenCount,
      child: setChildCount,
      toddler: setToddlerCount
    };

    const getters = {
      adult: adultCount,
      teen: teenCount,
      child: childCount,
      toddler: toddlerCount
    };

    const currentValue = getters[type as keyof typeof getters];
    const newValue = Math.max(0, currentValue + delta);
    setters[type as keyof typeof setters](newValue);
  };

  const addDietaryRestriction = (restriction: string) => {
    if (!dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
  };

  const addCustomRestriction = () => {
    if (customRestriction.trim() && !dietaryRestrictions.includes(customRestriction.trim())) {
      setDietaryRestrictions([...dietaryRestrictions, customRestriction.trim()]);
      setCustomRestriction('');
    }
  };

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update the group
      const response = await fetch('/api/groups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: groupId,
          name,
          description: description || undefined,
          adult_count: adultCount,
          teen_count: teenCount,
          child_count: childCount,
          toddler_count: toddlerCount,
          dietary_restrictions: dietaryRestrictions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update group');
      }

      // Update group members - first remove all current members
      await fetch(`/api/groups/members?group_id=${groupId}`, {
        method: 'DELETE'
      });

      // Add selected members to the group
      for (const memberId of selectedMembers) {
        await fetch('/api/groups/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: groupId,
            user_id: memberId
          }),
        });
      }

      router.push('/groups');
    } catch (error: any) {
      setError(error.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading group...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/groups">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Household Group</h1>
          <p className="text-gray-600 mt-2">
            Update your group&apos;s information and composition
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Modify your group&apos;s basic information and composition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Group Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Whole House, Just Kids, Adults Only"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Brief description of this group"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Group Composition</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Adults', value: adultCount, type: 'adult' },
                    { label: 'Teens (13-17)', value: teenCount, type: 'teen' },
                    { label: 'Children (5-12)', value: childCount, type: 'child' },
                    { label: 'Toddlers (2-4)', value: toddlerCount, type: 'toddler' }
                  ].map(({ label, value, type }) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCountChange(type, -1)}
                          disabled={value === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{value}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCountChange(type, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dietary Restrictions</h3>
                <p className="text-sm text-muted-foreground">
                  Select restrictions that apply to this entire group
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_DIETARY_RESTRICTIONS.map((restriction) => (
                    <Button
                      key={restriction}
                      type="button"
                      variant={dietaryRestrictions.includes(restriction) ? "default" : "outline"}
                      size="sm"
                      onClick={() => 
                        dietaryRestrictions.includes(restriction) 
                          ? removeDietaryRestriction(restriction)
                          : addDietaryRestriction(restriction)
                      }
                      className="justify-start"
                    >
                      {restriction}
                    </Button>  
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Add custom restriction"
                    value={customRestriction}
                    onChange={(e) => setCustomRestriction(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRestriction())}
                  />
                  <Button type="button" onClick={addCustomRestriction}>
                    Add
                  </Button>
                </div>

                {dietaryRestrictions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Selected Restrictions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {dietaryRestrictions.map((restriction) => (
                        <span
                          key={restriction}
                          className="flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                        >
                          {restriction}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => removeDietaryRestriction(restriction)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {householdMembers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Assign Family Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Select which family members belong to this group
                  </p>
                  <div className="space-y-2">
                    {householdMembers.map((member: any) => (
                      <label key={member.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                        />
                        <div>
                          <div className="text-sm font-medium">{member.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.demographic} • {member.role.replace('_', ' ')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/groups')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Group'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}