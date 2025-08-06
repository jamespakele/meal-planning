'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed direct database imports - using API routes instead
import { Plus, Users, Edit, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GroupsPage() {
  const { userProfile } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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
                      <Link href={`/groups/${group.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
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
    </div>
  );
}