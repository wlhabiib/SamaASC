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
    const { name, photo_url, role, team_id } = body;

    console.log('Coach API - POST request:', { name, photo_url, role, team_id });

    if (!name || !team_id) {
      console.error('Coach API - Missing required fields:', { name, team_id });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payload = { name, photo_url, role: role || 'Entraineur', team_id };
    console.log('Coach API - Inserting payload:', payload);

    const { data, error } = await supabase
      .from('coach')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Coach API - Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Coach API - Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Coach API - Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, photo_url, role, team_id } = body;

    console.log('Coach API - PUT request:', { id, name, photo_url, role, team_id });

    if (!id || !team_id) {
      console.error('Coach API - Missing required fields:', { id, team_id });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payload = { name, photo_url, role };
    console.log('Coach API - Updating payload:', payload);

    const { data, error } = await supabase
      .from('coach')
      .update(payload)
      .eq('id', id)
      .eq('team_id', team_id)
      .select()
      .single();

    if (error) {
      console.error('Coach API - Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Coach API - Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Coach API - Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
