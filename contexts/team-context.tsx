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
  refreshTeam: () => Promise<void>;
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
      console.log('⏭️ Skipping refresh (cached data is fresh)');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Début de refreshTeam');

      const { data: { session } } = await supabase.auth.getSession();
      console.log('📱 Session:', { hasSession: !!session, userId: session?.user?.id, email: session?.user?.email });

      if (!session?.user) {
        console.log('⚠️ Aucune session utilisateur');
        setTeam(null);
        setTeamUser(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(session.user);
      console.log('✅ Utilisateur authentifié:', session.user.id);

      // Récupérer les informations de l'utilisateur depuis Supabase
      console.log('🔍 Récupération des informations team_members pour user_id:', session.user.id);
      let { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      console.log('📊 Résultat team_members par user_id:', { found: !!teamMember, error: memberError?.message });

      // Fallback: If not found by user_id, try searching by email
      // (This can happen if the user_id hasn't been updated yet from the placeholder)
      if (!teamMember && session.user.email) {
        console.log('⚠️ Team member not found by user_id, trying fallback by email:', session.user.email);
        const { data: teamMemberByEmail, error: emailError } = await supabase
          .from('team_members')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        console.log('📊 Résultat team_members par email:', { found: !!teamMemberByEmail, error: emailError?.message });

        if (teamMemberByEmail) {
          console.log('✅ Team member found by email, updating user_id...');
          teamMember = teamMemberByEmail;

          // Update the user_id to the correct Supabase Auth ID
          const { error: updateError } = await supabase
            .from('team_members')
            .update({ user_id: session.user.id })
            .eq('id', teamMember.id);

          if (updateError) {
            console.error('❌ Error updating team_member user_id:', updateError.message);
          } else {
            console.log('✅ Successfully updated team_member user_id');
            teamMember = { ...teamMember, user_id: session.user.id };
          }
        }
      }

      if (!teamMember) {
        console.log('❌ No team member found for user:', session.user.id);
        setTeam(null);
        setTeamUser(null);
      } else {
        console.log('✅ Team member trouvé:', teamMember);
        setTeamUser(teamMember as TeamUser);

        // Récupérer les informations de l'équipe depuis Supabase
        console.log('🔍 Récupération des informations teams pour team_id:', teamMember.team_id);
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamMember.team_id)
          .maybeSingle();

        if (teamError || !teamData) {
          console.error('❌ Erreur récupération team:', teamError?.message || 'Team non trouvée');
          setTeam(null);
        } else {
          console.log('✅ Team trouvée et chargée:', teamData.name);
          setTeam(teamData as Team);
        }
      }

      setLastRefresh(now);
    } catch (error) {
      console.error('❌ Error refreshing team info:', error);
      setTeam(null);
      setTeamUser(null);
    } finally {
      console.log('✅ Fin de refreshTeam');
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTeam(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        refreshTeam(true);
      } else {
        setCurrentUser(null);
        setTeam(null);
        setTeamUser(null);
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
