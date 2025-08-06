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

    // Get household groups
    const { data: groups, error } = await supabase
      .from('household_groups')
      .select(`
        *,
        household_group_members(
          user_id,
          user_profiles(id, full_name, demographic)
        )
      `)
      .eq('household_id', profile.household_id);

    if (error) throw error;

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Get user's household_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 });
    }

    // Create the group
    const { data: group, error } = await supabase
      .from('household_groups')
      .insert({
        household_id: profile.household_id,
        name: body.name,
        description: body.description,
        adult_count: body.adult_count,
        teen_count: body.teen_count,
        child_count: body.child_count,
        toddler_count: body.toddler_count,
        dietary_restrictions: body.dietary_restrictions || []
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Verify the group belongs to user's household
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 });
    }

    // Update the group
    const { data: group, error } = await supabase
      .from('household_groups')
      .update(updates)
      .eq('id', id)
      .eq('household_id', profile.household_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error updating group:', error);
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get user's household_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 });
    }

    // Delete group members first
    await supabase
      .from('household_group_members')
      .delete()
      .eq('group_id', id);

    // Delete the group
    const { error } = await supabase
      .from('household_groups')
      .delete()
      .eq('id', id)
      .eq('household_id', profile.household_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}