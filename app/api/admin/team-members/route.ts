import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team_id = searchParams.get('team_id');

    if (!team_id) {
      return NextResponse.json(
        { error: 'Missing team_id parameter' },
        { status: 400 }
      );
    }

    // Récupérer les membres de l'équipe depuis Supabase
    const supabase = createAdminSupabaseClient();
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json(
        { error: 'Error fetching team members' },
        { status: 500 }
      );
    }

    return NextResponse.json(members || []);
  } catch (error) {
    console.error('Error in team-members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
