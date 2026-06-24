'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

interface UserContextType {
  user: User | null;
  userRole: 'owner' | 'admin' | 'member' | null;
  teamId: string | null;
  loading: boolean;
  refreshUserInfo: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserInfo = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setUserRole(null);
        setTeamId(null);
        return;
      }

      setUser(session.user);

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!teamMember) {
        setUserRole(null);
        setTeamId(null);
      } else {
        setUserRole(teamMember.role as 'owner' | 'admin' | 'member');
        setTeamId(teamMember.team_id);
      }
    } catch (error) {
      console.error('Error refreshing user info:', error);
      setUser(null);
      setUserRole(null);
      setTeamId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        refreshUserInfo();
      } else {
        setUser(null);
        setUserRole(null);
        setTeamId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, userRole, teamId, loading, refreshUserInfo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAuthUser must be used within a UserProvider');
  }
  return context;
}
