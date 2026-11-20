import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { checkIsAdmin, adminLogin, adminLogout } from '../services/admin';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isAdmin: false,
    loading: true,
  });

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          const admin = await checkIsAdmin();
          if (cancelled) return;
          setState({
            session,
            user: session.user,
            isAdmin: admin,
            loading: false,
          });
        } else {
          setState({ session: null, user: null, isAdmin: false, loading: false });
        }
      } catch {
        if (!cancelled) {
          setState({ session: null, user: null, isAdmin: false, loading: false });
        }
      }
    }

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;

        if (session?.user) {
          const admin = await checkIsAdmin();
          if (cancelled) return;
          setState({
            session,
            user: session.user,
            isAdmin: admin,
            loading: false,
          });
        } else {
          setState({ session: null, user: null, isAdmin: false, loading: false });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await adminLogin(email, password);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await adminLogout();
    setState({ session: null, user: null, isAdmin: false, loading: false });
  }, []);

  return (
    <AuthContext value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext>
  );
}
