'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { createClientSupabaseClient } from '@/lib/supabase';

interface UserContextType {
  userRole: 'owner' | 'admin' | 'member' | null;
  teamId: string | null;
  loading: boolean;
  refreshUserInfo: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { userId } = useClerkAuth();
  const { user } = useClerkUser();
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserInfo = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        setUserRole(null);
        setTeamId(null);
        setLoading(false);
        return;
      }

      // Récupérer les informations de l'utilisateur depuis Supabase
      const supabase = createClientSupabaseClient();
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('clerk_user_id', userId)
        .single();

      if (error || !teamMember) {
        console.error('Error fetching user info:', error);
        setUserRole(null);
        setTeamId(null);
      } else {
        setUserRole(teamMember.role as 'owner' | 'admin' | 'member');
        setTeamId(teamMember.team_id);
      }
    } catch (error) {
      console.error('Error refreshing user info:', error);
      setUserRole(null);
      setTeamId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserInfo();
  }, [userId]);

  return (
    <UserContext.Provider value={{ userRole, teamId, loading, refreshUserInfo }}>
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
