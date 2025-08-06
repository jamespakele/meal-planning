import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { group_id, user_id } = body;

    if (!group_id || !user_id) {
      return NextResponse.json({ error: 'group_id and user_id are required' }, { status: 400 });
    }

    // Add user to group
    const { data, error } = await supabase
      .from('household_group_members')
      .insert({ group_id, user_id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error adding user to group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');

    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    // Delete all members from the group
    const { error } = await supabase
      .from('household_group_members')
      .delete()
      .eq('group_id', group_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing group members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}