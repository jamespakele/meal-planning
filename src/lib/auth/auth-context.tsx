'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/database';
import type { User as UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const supabase = createClient();

  const refreshProfile = async () => {
    if (user) {
      setProfileLoading(true);
      try {
        console.log('Refreshing profile for user:', user.id);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Use API route instead of direct database call to avoid client auth issues
        const response = await fetch('/api/user/profile', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log('Profile API response status:', response.status);
        
        if (response.ok) {
          const profile = await response.json();
          console.log('Refreshed profile result:', profile);
          
          // Check if we actually got a profile with required fields
          if (profile && profile.id) {
            setUserProfile(profile);
            console.log('Profile set successfully with ID:', profile.id);
          } else {
            console.log('Profile response was empty or invalid - user needs onboarding');
            setUserProfile(null);
          }
        } else if (response.status === 401) {
          console.log('User not authenticated, signing out...');
          await signOut();
        } else {
          console.log('Profile API failed with status:', response.status);
          const errorText = await response.text();
          console.log('Profile API error:', errorText);
          setUserProfile(null);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('Profile fetch timed out');
        } else {
          console.error('Error fetching user profile:', error);
        }
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (user && !userProfile && !loading && !profileLoading) {
      console.log('Auth context: User loaded, fetching profile...');
      refreshProfile();
    } else if (!user) {
      setUserProfile(null);
    }
  }, [user, userProfile, loading, profileLoading]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      },
    });
    
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    profileLoading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}