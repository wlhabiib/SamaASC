import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineup, team_id } = body;

    if (!lineup || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete existing lineup for the match
    if (lineup.match_id) {
      await supabase
        .from('match_lineup')
        .delete()
        .eq('match_id', lineup.match_id)
        .eq('team_id', team_id);
    }

    // Insert new lineup
    const inserts = lineup.players.map((p: any) => ({
      match_id: lineup.match_id,
      player_id: p.player_id,
      position_slot: p.position_slot,
      is_substitute: p.is_substitute,
      team_id
    }));

    if (inserts.length > 0) {
      const { error } = await supabase
        .from('match_lineup')
        .insert(inserts);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
