export interface User {
  id: string;
  team_id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  profile_photo_url: string | null;
  created_at: string;
}

export interface Coach {
  id: string;
  name: string;
  photo_url: string | null;
  role: string;
}

export interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  position: 'GK' | 'DEF' | 'MIL' | 'ATT';
  jersey_number: number | null;
  is_starter: boolean;
}

export interface Match {
  id: string;
  opponent: string;
  match_date: string;
  match_time: string | null;
  venue: string | null;
  competition: string | null;
  is_home: boolean;
  status: 'upcoming' | 'live' | 'completed' | 'postponed';
  score_home: number | null;
  score_away: number | null;
  poster_url: string | null;
  formation: string;
  scorers: string | null;
  opponent_logo: string | null;
}

export interface MatchLineup {
  id: string;
  match_id: string;
  player_id: string;
  position_slot: number;
  is_substitute: boolean;
  player?: Player;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'match' | 'training' | 'meeting' | 'other';
  event_date: string | null;
}

export interface Standing {
  id: string;
  competition_name: string;
  position: number;
  team_name: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string | null;
  event_type: string;
}

export interface MatchVote {
  id: string;
  match_id: string;
  player_id: string;
  voter_name: string | null;
}

export interface Supporter {
  id: string;
  name: string;
  message: string;
  profile_photo_url: string | null;
  created_at: string;
}

export interface PlayerStat {
  id: string;
  player_id: string;
  competition_name: string;
  goals: number;
  assists: number;
  matches_played: number;
  created_at: string;
  updated_at: string;
  player?: Player;
}

export interface Competition {
  id: string;
  name: string;
  team_id: string;
  created_at: string;
  updated_at: string;
}

export type PositionLabel = {
  [key: string]: string;
};

export const POSITION_LABELS: PositionLabel = {
  GK: 'Gardien',
  DEF: 'Défenseur',
  MIL: 'Milieu',
  ATT: 'Attaquant',
};
