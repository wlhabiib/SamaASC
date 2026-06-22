import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const { team_name, team_domain, admin_email, admin_username } = await req.json();

    if (!team_name || !team_domain || !admin_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating team via RPC:', { team_name, team_domain, admin_email });

    // Call the RPC function to create team and admin user
    const { data, error: rpcError } = await supabase.rpc('create_team_with_admin', {
      p_team_name: team_name,
      p_team_domain: team_domain,
      p_admin_email: admin_email,
      p_admin_username: admin_username,
      p_admin_password_hash: '',
    });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      
      // Handle specific database errors
      const errorMessage = rpcError.message || '';
      let userMessage = 'Erreur lors de la création de l\'équipe';
      
      if (errorMessage.includes('unique constraint') || errorMessage.includes('slug')) {
        userMessage = 'Ce domaine d\'équipe existe déjà. Veuillez choisir un autre domaine.';
      } else if (errorMessage.includes('duplicate')) {
        userMessage = 'Certaines données existent déjà. Vérifiez vos entrées.';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      );
    }

    const result = data as { success?: boolean; error?: string; team_id?: string; user_id?: string };

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.team_id || !result.user_id) {
      return NextResponse.json(
        { error: 'Failed to create team or user' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in create-team API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
