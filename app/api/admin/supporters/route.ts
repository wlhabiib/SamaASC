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
    const { name, message, team_id, profile_photo_url } = body;

    console.log('Creating supporter:', { name, message, team_id, profile_photo_url });

    if (!name || !message || !team_id) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('supporters')
      .insert({ name, message, team_id, profile_photo_url })
      .select()
      .single();

    if (error) {
      console.error('Error creating supporter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Supporter created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in supporters API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
