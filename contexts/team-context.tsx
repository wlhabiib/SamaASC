'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

interface Team {
  id: string;
  organization_id: string | null;
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
  user_id: string;
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTeam = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setTeam(null);
        setTeamUser(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(session.user);

      // Récupérer les informations de l'utilisateur depuis Supabase
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

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
          .maybeSingle();

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        refreshTeam();
      } else {
        setCurrentUser(null);
        setTeam(null);
        setTeamUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setTeam(null);
    setTeamUser(null);
    setCurrentUser(null);
    window.location.href = '/login';
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
