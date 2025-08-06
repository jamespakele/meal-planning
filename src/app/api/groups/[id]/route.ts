import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the specific group with its members
    const { data: group, error } = await supabase
      .from('household_groups')
      .select(`
        *,
        household_group_members(
          user_id,
          user_profiles(id, full_name, demographic)
        )
      `)
      .eq('id', params.id)
      .eq('household_id', profile.household_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}