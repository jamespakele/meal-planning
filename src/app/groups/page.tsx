'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed direct database imports - using API routes instead
import { Plus, Users, Edit, Trash2, ArrowLeft, Minus, X } from 'lucide-react';
import Link from 'next/link';

const COMMON_DIETARY_RESTRICTIONS = [
  'No nuts', 'No dairy', 'No gluten', 'No tomatoes', 'No seafood',
  'Vegetarian', 'Vegan', 'Low sodium', 'Diabetic friendly', 'No spicy food'
];

export default function GroupsPage() {
  const { userProfile } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Edit modal state
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAdultCount, setEditAdultCount] = useState(0);
  const [editTeenCount, setEditTeenCount] = useState(0);
  const [editChildCount, setEditChildCount] = useState(0);
  const [editToddlerCount, setEditToddlerCount] = useState(0);
  const [editDietaryRestrictions, setEditDietaryRestrictions] = useState<string[]>([]);
  const [editCustomRestriction, setEditCustomRestriction] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (userProfile?.household_id) {
      loadGroupsData();
    }
  }, [userProfile]);

  const loadGroupsData = async () => {
    try {
      const [groupsResponse, membersResponse] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/households/members')
      ]);
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
      }
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Error loading groups data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(groupId);
    
    try {
      const response = await fetch(`/api/groups?id=${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload groups data after successful deletion
        loadGroupsData();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete group: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const openEditModal = (group: any) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditAdultCount(group.adult_count);
    setEditTeenCount(group.teen_count);
    setEditChildCount(group.child_count);
    setEditToddlerCount(group.toddler_count);
    setEditDietaryRestrictions(group.dietary_restrictions || []);
    setEditCustomRestriction('');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingGroup(null);
    setEditError('');
  };

  const handleEditCountChange = (type: string, delta: number) => {
    const setters = {
      adult: setEditAdultCount,
      teen: setEditTeenCount,
      child: setEditChildCount,
      toddler: setEditToddlerCount
    };

    const getters = {
      adult: editAdultCount,
      teen: editTeenCount,
      child: editChildCount,
      toddler: editToddlerCount
    };

    const currentValue = getters[type as keyof typeof getters];
    const newValue = Math.max(0, currentValue + delta);
    setters[type as keyof typeof setters](newValue);
  };

  const addEditDietaryRestriction = (restriction: string) => {
    if (!editDietaryRestrictions.includes(restriction)) {
      setEditDietaryRestrictions([...editDietaryRestrictions, restriction]);
    }
  };

  const removeEditDietaryRestriction = (restriction: string) => {
    setEditDietaryRestrictions(editDietaryRestrictions.filter(r => r !== restriction));
  };

  const addEditCustomRestriction = () => {
    if (editCustomRestriction.trim() && !editDietaryRestrictions.includes(editCustomRestriction.trim())) {
      setEditDietaryRestrictions([...editDietaryRestrictions, editCustomRestriction.trim()]);
      setEditCustomRestriction('');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const response = await fetch('/api/groups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingGroup.id,
          name: editName,
          description: editDescription || undefined,
          adult_count: editAdultCount,
          teen_count: editTeenCount,
          child_count: editChildCount,
          toddler_count: editToddlerCount,
          dietary_restrictions: editDietaryRestrictions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update group');
      }

      // Reload groups data after successful update
      loadGroupsData();
      closeEditModal();
    } catch (error: any) {
      setEditError(error.message || 'Failed to update group');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Household Groups</h1>
            <p className="text-gray-600 mt-2">
              Manage your family&apos;s meal planning groups and their dietary restrictions
            </p>
          </div>
          <Link href="/groups/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </Link>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first household group to start organizing your family&apos;s meal planning
              </p>
              <Link href="/groups/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="mt-1">
                          {group.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditModal(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteLoading === group.id}
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                      >
                        {deleteLoading === group.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Adults:</span> {group.adult_count}
                    </div>
                    <div>
                      <span className="font-medium">Teens:</span> {group.teen_count}
                    </div>
                    <div>
                      <span className="font-medium">Children:</span> {group.child_count}
                    </div>
                    <div>
                      <span className="font-medium">Toddlers:</span> {group.toddler_count}
                    </div>
                  </div>

                  {group.dietary_restrictions && group.dietary_restrictions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Dietary Restrictions:</p>
                      <div className="flex flex-wrap gap-1">
                        {group.dietary_restrictions.map((restriction: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                          >
                            {restriction}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.household_group_members && group.household_group_members.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Members:</p>
                      <div className="space-y-1">
                        {group.household_group_members.map((member: any) => (
                          <div key={member.user_id} className="text-sm text-muted-foreground">
                            {member.user_profiles?.full_name} ({member.user_profiles?.demographic})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button variant="outline" className="w-full" disabled>
                      View Details (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Group Templates</h2>
          <p className="text-muted-foreground mb-6">
            Quick-start templates for common household configurations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Whole House', description: 'Everyone in the household', composition: '2 adults, 1 teen, 2 children' },
              { name: 'Adults Only', description: 'Just the adult members', composition: '2 adults' },
              { name: 'Just Kids', description: 'Children and teenagers only', composition: '1 teen, 2 children' },
              { name: 'Nuclear Family', description: 'Parents and their children', composition: '2 adults, 2 children' }
            ].map((template) => (
              <Card key={template.name} className="border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-1">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                  <p className="text-xs text-muted-foreground mb-3">{template.composition}</p>
                  <Link href={`/groups/new?template=${template.name.toLowerCase().replace(' ', '_')}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Use Template
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Group</h2>
                <Button variant="ghost" size="sm" onClick={closeEditModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {editError}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium">
                    Group Name
                  </label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder="e.g., Whole House, Just Kids, Adults Only"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Input
                    id="edit-description"
                    type="text"
                    placeholder="Brief description of this group"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Group Composition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Adults', value: editAdultCount, type: 'adult' },
                      { label: 'Teens (13-17)', value: editTeenCount, type: 'teen' },
                      { label: 'Children (5-12)', value: editChildCount, type: 'child' },
                      { label: 'Toddlers (2-4)', value: editToddlerCount, type: 'toddler' }
                    ].map(({ label, value, type }) => (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{label}</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCountChange(type, -1)}
                            disabled={value === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{value}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCountChange(type, 1)}
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
                  <p className="text-sm text-gray-600">
                    Select restrictions that apply to this entire group
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_DIETARY_RESTRICTIONS.map((restriction) => (
                      <Button
                        key={restriction}
                        type="button"
                        variant={editDietaryRestrictions.includes(restriction) ? "default" : "outline"}
                        size="sm"
                        onClick={() => 
                          editDietaryRestrictions.includes(restriction) 
                            ? removeEditDietaryRestriction(restriction)
                            : addEditDietaryRestriction(restriction)
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
                      value={editCustomRestriction}
                      onChange={(e) => setEditCustomRestriction(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditCustomRestriction())}
                    />
                    <Button type="button" onClick={addEditCustomRestriction}>
                      Add
                    </Button>
                  </div>

                  {editDietaryRestrictions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Restrictions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {editDietaryRestrictions.map((restriction) => (
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
                              onClick={() => removeEditDietaryRestriction(restriction)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditModal}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading}>
                    {editLoading ? 'Updating...' : 'Update Group'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}