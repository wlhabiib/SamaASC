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
    const { competition_name, team_name, points, played, won, drawn, lost, goals_for, goals_against, position, team_id } = body;

    if (!competition_name || !team_name || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('standings')
      .insert({ 
        competition_name,
        team_name,
        points: parseInt(points) || 0,
        played: parseInt(played) || 0,
        won: parseInt(won) || 0,
        drawn: parseInt(drawn) || 0,
        lost: parseInt(lost) || 0,
        goals_for: parseInt(goals_for) || 0,
        goals_against: parseInt(goals_against) || 0,
        position: parseInt(position) || 1,
        team_id 
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, competition_name, team_name, points, played, won, drawn, lost, goals_for, goals_against, position, team_id } = body;

    if (!id || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('standings')
      .update({ 
        competition_name,
        team_name,
        points: parseInt(points) || 0,
        played: parseInt(played) || 0,
        won: parseInt(won) || 0,
        drawn: parseInt(drawn) || 0,
        lost: parseInt(lost) || 0,
        goals_for: parseInt(goals_for) || 0,
        goals_against: parseInt(goals_against) || 0,
        position: parseInt(position) || 1
      })
      .eq('id', id)
      .eq('team_id', team_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const team_id = searchParams.get('team_id');

    if (!id || !team_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { error } = await supabase
      .from('standings')
      .delete()
      .eq('id', id)
      .eq('team_id', team_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
