import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  try {
    // Get all user profiles (for debugging only)
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*');

    if (error) {
      console.error('Debug profiles error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('All user profiles:', profiles);
    return NextResponse.json({ profiles, count: profiles?.length || 0 });
  } catch (error: any) {
    console.error('Debug profiles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}