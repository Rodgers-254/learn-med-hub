// src/lib/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;          // NEW
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);  // NEW

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setUser(data.session.user);
        setSession(data.session);   // NEW
      }
    };

    getSession();

    const subscription = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setSession(session ?? null);  // NEW
      }
    );

    return () => {
      subscription.data?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
