import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get('team_id');

    if (!team_id) {
      return NextResponse.json({ error: 'Missing team_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('custom_stickers')
      .select('*')
      .eq('team_id', team_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom stickers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in custom stickers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team_id, name, url, uploaded_by } = body;

    console.log('Creating custom sticker:', { team_id, name, url, uploaded_by });

    if (!team_id || !name || !url || !uploaded_by) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('custom_stickers')
      .insert({ team_id, name, url, uploaded_by })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom sticker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Custom sticker created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in custom stickers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
