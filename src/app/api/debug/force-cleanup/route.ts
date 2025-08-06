import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST() {
  const supabase = createClient();
  
  try {
    console.log('Force cleaning up all data...');
    
    // Delete all user profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches everything)
    
    // Delete all households  
    const { error: householdError } = await supabase
      .from('households')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    console.log('Force cleanup results:', { profileError, householdError });
    
    return NextResponse.json({ 
      success: true, 
      profileError: profileError?.message,
      householdError: householdError?.message
    });
  } catch (error: any) {
    console.error('Force cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}