import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  if (!user) {
    console.log('No user found in auth context');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('Authenticated user:', user.id);

  try {
    const body = await request.json();
    const { name, subscription_tier = 'basic' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 });
    }

    const { data: household, error } = await supabase
      .from('households')
      .insert({
        name,
        created_by: user.id,
        subscription_tier
      })
      .select()
      .single();

    if (error) {
      console.error('Household creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(household);
  } catch (error: any) {
    console.error('Household creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}