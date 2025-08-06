'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Users, TrendingUp, MessageSquare, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function FormResponsesPage() {
  const params = useParams();
  const { userProfile } = useAuth();
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState([]);
  const [members, setMembers] = useState([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (params.token) {
      loadResponsesData();
    }
  }, [params.token]);

  const loadResponsesData = async () => {
    try {
      // Load form and responses
      const { data: formData, error: formError } = await supabase
        .from('meal_forms')
        .select(`
          *,
          meal_plans!inner(household_id),
          meal_form_responses(
            *,
            user_profiles(id, full_name, demographic)
          )
        `)
        .eq('share_token', params.token)
        .single();

      if (formError) throw formError;

      // Load household members
      const { data: membersData, error: membersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('household_id', formData.meal_plans.household_id);

      if (membersError) throw membersError;

      setForm(formData);
      setResponses(formData.meal_form_responses || []);
      setMembers(membersData);
      
      // Generate analytics
      generateAnalytics(formData.meal_form_responses || [], formData.questions);
    } catch (error: any) {
      setError(error.message || 'Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (responses: any[], questions: any[]) => {
    const analytics: any = {};

    questions.forEach((question, index) => {
      const questionKey = index.toString();
      const questionResponses = responses
        .map(r => r.responses[questionKey])
        .filter(r => r !== undefined && r !== null && r !== '');

      analytics[questionKey] = {
        question: question.question,
        type: question.type,
        totalResponses: questionResponses.length,
        responses: questionResponses
      };

      if (question.type === 'single_choice') {
        const counts: Record<string, number> = {};
        questionResponses.forEach(response => {
          counts[response] = (counts[response] || 0) + 1;
        });
        analytics[questionKey].distribution = counts;
      } else if (question.type === 'multiple_choice') {
        const counts: Record<string, number> = {};
        questionResponses.forEach(response => {
          if (Array.isArray(response)) {
            response.forEach(option => {
              counts[option] = (counts[option] || 0) + 1;
            });
          }
        });
        analytics[questionKey].distribution = counts;
      } else if (question.type === 'rating') {
        const ratings = questionResponses.map(r => parseInt(r)).filter(r => !isNaN(r));
        const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;
        analytics[questionKey].average = average;
        analytics[questionKey].distribution = ratings.reduce((acc: Record<string, number>, rating) => {
          acc[rating.toString()] = (acc[rating.toString()] || 0) + 1;
          return acc;
        }, {});
      }
    });

    setAnalytics(analytics);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading responses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Responses not available</h3>
              <p className="text-muted-foreground mb-4">{error || 'Could not load form responses'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completedResponses = responses.filter(r => r.submitted_at);
  const pendingResponses = responses.filter(r => !r.submitted_at);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/forms/${params.token}`}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">{form.title} - Responses</h1>
          <p className="text-gray-600 mt-2">
            Analysis of family member responses and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{completedResponses.length}</div>
                  <div className="text-sm text-muted-foreground">Completed Responses</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">
                    {members.length > 0 ? Math.round((completedResponses.length / members.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{pendingResponses.length}</div>
                  <div className="text-sm text-muted-foreground">Pending Responses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Response Status by Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member: any) => {
                    const memberResponse = responses.find(r => r.user_id === member.id);
                    const isCompleted = memberResponse?.submitted_at;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {member.demographic} • {member.role.replace('_', ' ')}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isCompleted 
                            ? `Completed ${format(new Date(memberResponse.submitted_at), 'MMM d')}` 
                            : 'Pending'
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="w-5 h-5 mr-2" />
                  Response Analytics
                </CardTitle>
                <CardDescription>
                  Summary of family preferences and patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(analytics).map(([questionKey, data]: [string, any]) => (
                  <div key={questionKey} className="space-y-3">
                    <h4 className="font-medium text-sm">{data.question}</h4>
                    
                    {data.type === 'text' && (
                      <div className="space-y-2">
                        {data.responses.map((response: string, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            "{response}"
                          </div>
                        ))}
                      </div>
                    )}

                    {(data.type === 'single_choice' || data.type === 'multiple_choice') && data.distribution && (
                      <div className="space-y-2">
                        {Object.entries(data.distribution).map(([option, count]: [string, any]) => (
                          <div key={option} className="flex items-center justify-between">
                            <span className="text-sm">{option}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${(count / data.totalResponses) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {data.type === 'rating' && data.average && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Rating</span>
                          <span className="font-medium">{data.average.toFixed(1)}/5</span>
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <div key={rating} className="flex-1 text-center">
                              <div className="text-xs mb-1">{rating}</div>
                              <div className="bg-gray-200 rounded h-12 flex items-end">
                                <div 
                                  className="bg-blue-500 rounded w-full"
                                  style={{ 
                                    height: `${((data.distribution[rating] || 0) / data.totalResponses) * 100}%`,
                                    minHeight: data.distribution[rating] ? '8px' : '0'
                                  }}
                                />
                              </div>
                              <div className="text-xs mt-1">{data.distribution[rating] || 0}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}