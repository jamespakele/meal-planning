'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createHouseholdGroup, getHouseholdMembers, addUserToGroup } from '@/lib/database';
import { Plus, Minus, X } from 'lucide-react';

const COMMON_DIETARY_RESTRICTIONS = [
  'No nuts', 'No dairy', 'No gluten', 'No tomatoes', 'No seafood',
  'Vegetarian', 'Vegan', 'Low sodium', 'Diabetic friendly', 'No spicy food'
];

const TEMPLATES = {
  whole_house: { name: 'Whole House', adult_count: 2, teen_count: 1, child_count: 2, toddler_count: 0 },
  adults_only: { name: 'Adults Only', adult_count: 2, teen_count: 0, child_count: 0, toddler_count: 0 },
  just_kids: { name: 'Just Kids', adult_count: 0, teen_count: 1, child_count: 2, toddler_count: 0 },
  nuclear_family: { name: 'Nuclear Family', adult_count: 2, teen_count: 0, child_count: 2, toddler_count: 0 }
};

export default function NewGroupPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [teenCount, setTeenCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [toddlerCount, setToddlerCount] = useState(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [customRestriction, setCustomRestriction] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get('template');

  useEffect(() => {
    if (template && TEMPLATES[template as keyof typeof TEMPLATES]) {
      const templateData = TEMPLATES[template as keyof typeof TEMPLATES];
      setName(templateData.name);
      setAdultCount(templateData.adult_count);
      setTeenCount(templateData.teen_count);
      setChildCount(templateData.child_count);
      setToddlerCount(templateData.toddler_count);
    }
  }, [template]);

  useEffect(() => {
    if (userProfile?.household_id) {
      loadHouseholdMembers();
    }
  }, [userProfile]);

  const loadHouseholdMembers = async () => {
    try {
      const members = await getHouseholdMembers(userProfile!.household_id);
      setHouseholdMembers(members);
    } catch (error) {
      console.error('Error loading household members:', error);
    }
  };

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
      const group = await createHouseholdGroup({
        household_id: userProfile!.household_id,
        name,
        description: description || undefined,
        adult_count: adultCount,
        teen_count: teenCount,
        child_count: childCount,
        toddler_count: toddlerCount,
        dietary_restrictions: dietaryRestrictions
      });

      // Add selected members to the group
      for (const memberId of selectedMembers) {
        await addUserToGroup(group.id, memberId);
      }

      router.push('/groups');
    } catch (error: any) {
      setError(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Household Group</h1>
          <p className="text-gray-600 mt-2">
            Define a group with specific dietary restrictions and member composition
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Set up your group's basic information and composition
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
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}