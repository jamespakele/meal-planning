import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Handle cookie retrieval for browser
          if (typeof document !== 'undefined') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`));
            return cookie ? cookie.split('=')[1] : null;
          }
          return null;
        },
        set(name: string, value: string, options: any) {
          // Handle cookie setting for browser
          if (typeof document !== 'undefined') {
            let cookieString = `${name}=${value}`;
            
            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`;
            }
            if (options?.path) {
              cookieString += `; Path=${options.path}`;
            } else {
              cookieString += `; Path=/`;
            }
            if (options?.domain) {
              cookieString += `; Domain=${options.domain}`;
            }
            if (options?.secure) {
              cookieString += `; Secure`;
            }
            if (options?.sameSite) {
              cookieString += `; SameSite=${options.sameSite}`;
            }
            
            document.cookie = cookieString;
          }
        },
        remove(name: string, options: any) {
          // Handle cookie removal for browser
          if (typeof document !== 'undefined') {
            const path = options?.path || '/';
            document.cookie = `${name}=; Path=${path}; Max-Age=0`;
          }
        }
      }
    }
  );
}