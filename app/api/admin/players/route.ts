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
    const { name, photo_url, position, jersey_number, is_starter, team_id } = body;

    if (!name || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('players')
      .insert({ 
        name, 
        photo_url, 
        position: position || 'DEF', 
        jersey_number: jersey_number ? parseInt(jersey_number) : null,
        is_starter: is_starter === 'true',
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
    const { id, name, photo_url, position, jersey_number, is_starter, team_id } = body;

    if (!id || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('players')
      .update({ 
        name, 
        photo_url, 
        position, 
        jersey_number: jersey_number ? parseInt(jersey_number) : null,
        is_starter: is_starter === 'true'
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
      .from('players')
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
