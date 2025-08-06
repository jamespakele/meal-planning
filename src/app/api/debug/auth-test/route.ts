import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Test server-side client
    const serverSupabase = createServerClient();
    const { data: { user: serverUser }, error: serverError } = await serverSupabase.auth.getUser();
    
    // Test browser client
    const browserSupabase = createBrowserClient();
    const { data: { user: browserUser }, error: browserError } = await browserSupabase.auth.getUser();
    
    console.log('Server auth:', { user: serverUser?.id, error: serverError });
    console.log('Browser auth:', { user: browserUser?.id, error: browserError });
    
    return NextResponse.json({
      server: { 
        userId: serverUser?.id, 
        email: serverUser?.email,
        error: serverError?.message 
      },
      browser: { 
        userId: browserUser?.id, 
        email: browserUser?.email,
        error: browserError?.message 
      },
      cookies: request.cookies.getAll().filter(c => c.name.includes('supabase'))
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}