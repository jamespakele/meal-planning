import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  try {
    // Get all households (for debugging only)
    const { data: households, error } = await supabase
      .from('households')
      .select('*');

    if (error) {
      console.error('Debug households error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('All households:', households);
    return NextResponse.json({ households, count: households?.length || 0 });
  } catch (error: any) {
    console.error('Debug households error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}