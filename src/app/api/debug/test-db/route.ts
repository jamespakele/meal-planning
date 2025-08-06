import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', { userId: user?.id, authError });
    
    // Test database connection
    const { data: householdsCount, error: countError } = await supabase
      .from('households')
      .select('count', { count: 'exact', head: true });
    console.log('Database test:', { householdsCount, countError });
    
    // Test insert permission (this will fail but show us the error)
    const testHousehold = {
      name: 'Test Household',
      created_by: user?.id || 'test-id',
      subscription_tier: 'basic'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('households')
      .insert(testHousehold)
      .select()
      .single();
    
    console.log('Insert test:', { insertData, insertError });
    
    // Clean up if successful
    if (insertData) {
      await supabase.from('households').delete().eq('id', insertData.id);
    }
    
    return NextResponse.json({
      auth: { userId: user?.id, error: authError?.message },
      database: { count: householdsCount, error: countError?.message },
      insert: { 
        success: !!insertData, 
        error: insertError?.message,
        details: insertError
      }
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}