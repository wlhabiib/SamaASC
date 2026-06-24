'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
  profile_photo_url: string | null;
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
  refreshTeam: (force?: boolean) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with localStorage for session persistence
const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storageKey: 'supabase.auth.token',
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem(key)
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value)
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key)
          }
        },
      },
    },
  }
);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  const refreshTeam = async (force = false) => {
    const now = Date.now();
    // Skip refresh if less than 30 seconds ago and not forced
    if (!force && lastRefresh && now - lastRefresh < 30000) {
      return;
    }

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
      let { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Fallback: If not found by user_id, try searching by email
      if (!teamMember && session.user.email) {
        const { data: teamMemberByEmail } = await supabase
          .from('team_members')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (teamMemberByEmail) {
          teamMember = teamMemberByEmail;

          // Update the user_id to the correct Supabase Auth ID
          await supabase
            .from('team_members')
            .update({ user_id: session.user.id })
            .eq('id', teamMember.id);

          teamMember = { ...teamMember, user_id: session.user.id };
        }
      }

      if (!teamMember) {
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
          setTeam(null);
        } else {
          setTeam(teamData as Team);
        }
      }

      setLastRefresh(now);
    } catch (error) {
      console.error('❌ Error refreshing team info:', error);
      setTeam(null);
      setTeamUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        refreshTeam(true);
      } else {
        setCurrentUser(null);
        setTeam(null);
        setTeamUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Appeler l'API de déconnexion pour nettoyer les cookies serveur
      await fetch('/api/auth/logout', { method: 'POST' });
      
      await supabase.auth.signOut();
      setTeam(null);
      setTeamUser(null);
      setCurrentUser(null);
      
      // Nettoyer TOUTES les clés Supabase dans localStorage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.removeItem('supabase.auth.token');
      }
      
      // Redirection forcée
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Nettoyer localStorage même en cas d'erreur
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.removeItem('supabase.auth.token');
      }
      // Même en cas d'erreur, forcer la redirection
      window.location.href = '/login';
    }
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
