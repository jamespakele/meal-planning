import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's household_id first
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 });
    }

    // Get all household members
    const { data: members, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('household_id', profile.household_id);

    if (error) throw error;

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error fetching household members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}