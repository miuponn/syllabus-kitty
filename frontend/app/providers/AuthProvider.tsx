'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/app/lib/supabaseClient';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getTokens: () => Promise<{
    supabaseToken: string | undefined;
    googleAccessToken: string | undefined;
    googleRefreshToken: string | undefined;
  }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getTokens: async () => ({
    supabaseToken: undefined,
    googleAccessToken: undefined,
    googleRefreshToken: undefined,
  }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Supabase JWT:", session?.access_token);
      console.log("Google Access Token:", session?.provider_token);
      console.log("Google Refresh Token:", session?.provider_refresh_token);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event);
      console.log("Google Access Token:", session?.provider_token);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getTokens = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      supabaseToken: session?.access_token,
      googleAccessToken: session?.provider_token ?? undefined,
      googleRefreshToken: session?.provider_refresh_token ?? undefined,
    };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, getTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
