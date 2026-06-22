import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase côté serveur avec auth Clerk
export function createServerSupabaseClient() {
  // Cette fonction ne doit être utilisée que dans les composants serveur
  // Pour les composants clients, utilisez createClientSupabaseClient
  throw new Error('createServerSupabaseClient should only be used in server components');
}

// Créer un client Supabase côté client avec auth Clerk
export function createClientSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Créer un client Supabase avec le service role key (pour les opérations admin)
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
