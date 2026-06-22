'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { createClientSupabaseClient } from '@/lib/supabase';

interface Team {
  id: string;
  clerk_organization_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  team_photo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  nav_color: string;
  description: string | null;
}

interface TeamUser {
  id: string;
  team_id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
}

interface TeamContextType {
  team: Team | null;
  user: TeamUser | null;
  loading: boolean;
  setTeam: (team: Team | null) => void;
  setUser: (user: TeamUser | null) => void;
  logout: () => void;
  refreshTeam: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { userId } = useClerkAuth();
  const { user } = useClerkUser();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTeam = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        setTeam(null);
        setTeamUser(null);
        setLoading(false);
        return;
      }

      // Récupérer les informations de l'utilisateur depuis Supabase
      const supabase = createClientSupabaseClient();
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('clerk_user_id', userId)
        .single();

      if (memberError || !teamMember) {
        console.error('Error fetching team member:', memberError);
        setTeam(null);
        setTeamUser(null);
      } else {
        setTeamUser(teamMember as TeamUser);

        // Récupérer les informations de l'équipe depuis Supabase
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamMember.team_id)
          .single();

        if (teamError || !teamData) {
          console.error('Error fetching team:', teamError);
          setTeam(null);
        } else {
          setTeam(teamData as Team);
        }
      }
    } catch (error) {
      console.error('Error refreshing team info:', error);
      setTeam(null);
      setTeamUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTeam();
  }, [userId]);

  const logout = async () => {
    // Rediriger vers la page de déconnexion Clerk
    window.location.href = '/sign-out';
  };

  return (
    <TeamContext.Provider value={{ team, user: teamUser, loading, setTeam, setUser: setTeamUser, logout, refreshTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
