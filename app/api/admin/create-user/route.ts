import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

// Fonction pour générer un mot de passe sécurisé
function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function POST(req: Request) {
  try {
    const { team_id, first_name, last_name, role } = await req.json();

    if (!team_id || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer l'équipe depuis Supabase
    const supabase = createAdminSupabaseClient();
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Générer l'email automatiquement
    const email = `${first_name.toLowerCase()}.${last_name.toLowerCase()}@${team.slug}.com`;

    // Générer un mot de passe sécurisé
    const password = generateSecurePassword();

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
        team_id: team_id,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user in Supabase Auth:', authError);
      return NextResponse.json(
        { error: 'Error creating user in Supabase Auth' },
        { status: 500 }
      );
    }

    // Créer le membre dans Supabase
    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: team_id,
      user_id: authData.user.id,
      email: email,
      first_name: first_name,
      last_name: last_name,
      role: role,
      is_active: true,
    });

    if (memberError) {
      console.error('Error creating team member in Supabase:', memberError);
      return NextResponse.json(
        { error: 'Error creating team member in Supabase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: email,
      password: password,
      userId: authData.user.id,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
}
