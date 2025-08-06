import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Cleaning up data for user:', user.id);
    
    // Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id);
    
    // Delete households created by this user
    const { error: householdError } = await supabase
      .from('households')
      .delete()
      .eq('created_by', user.id);
    
    console.log('Cleanup results:', { profileError, householdError });
    
    return NextResponse.json({ 
      success: true, 
      profileDeleted: !profileError,
      householdDeleted: !householdError 
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}