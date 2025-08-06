'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMealFormByToken, submitMealFormResponse } from '@/lib/database';
import { CheckCircle, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function MealFormPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.token) {
      loadForm();
    }
  }, [params.token]);

  const loadForm = async () => {
    try {
      const formData = await getMealFormByToken(params.token as string);
      setForm(formData);
      
      // Check if user has already submitted
      if (user && formData.meal_form_responses) {
        const userResponse = formData.meal_form_responses.find((r: any) => r.user_id === user.id);
        if (userResponse) {
          setResponses(userResponse.responses || {});
          setSubmitted(!!userResponse.submitted_at);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Form not found');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleChoice = (questionId: string, option: string) => {
    const currentValues = responses[questionId] || [];
    if (currentValues.includes(option)) {
      setResponses(prev => ({
        ...prev,
        [questionId]: currentValues.filter((v: string) => v !== option)
      }));
    } else {
      setResponses(prev => ({
        ...prev,
        [questionId]: [...currentValues, option]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit responses');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await submitMealFormResponse(form.id, user.id, responses);
      setSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to submit responses');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormExpired = form && new Date(form.deadline) < new Date();
  const canSubmit = user && form && !submitted && !isFormExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Form not available</h3>
              <p className="text-muted-foreground mb-4">{error || 'This form does not exist or has expired'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">Thank you for your response!</h3>
              <p className="text-muted-foreground mb-4">
                Your meal preferences have been recorded. We'll use this information to plan 
                delicious meals for your family.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {form.title}
            </CardTitle>
            <CardDescription>
              {form.description}
            </CardDescription>
            {form.deadline && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                Deadline: {format(new Date(form.deadline), 'EEEE, MMMM d, yyyy h:mm a')}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Please sign in to complete this form
                </p>
                <Button onClick={() => router.push('/login')}>
                  Sign In
                </Button>
              </div>
            ) : isFormExpired ? (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-semibold mb-2">Form Expired</h3>
                <p className="text-muted-foreground">
                  The deadline for this form has passed. Please contact your household manager 
                  if you need to make changes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {form.questions.map((question: any, index: number) => (
                  <div key={index} className="space-y-3">
                    <label className="text-sm font-medium">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {question.type === 'text' && (
                      <Input
                        type="text"
                        value={responses[index] || ''}
                        onChange={(e) => handleInputChange(index.toString(), e.target.value)}
                        required={question.required}
                        placeholder="Your answer..."
                      />
                    )}

                    {question.type === 'single_choice' && (
                      <div className="space-y-2">
                        {question.options?.map((option: string, optionIndex: number) => (
                          <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question_${index}`}
                              value={option}
                              checked={responses[index] === option}
                              onChange={(e) => handleInputChange(index.toString(), e.target.value)}
                              required={question.required}
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {question.options?.map((option: string, optionIndex: number) => (
                          <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(responses[index] || []).includes(option)}
                              onChange={() => handleMultipleChoice(index.toString(), option)}
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'rating' && (
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`question_${index}`}
                              value={rating}
                              checked={responses[index] === rating}
                              onChange={(e) => handleInputChange(index.toString(), parseInt(e.target.value))}
                              required={question.required}
                            />
                            <span className="text-sm">{rating}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Responses'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}