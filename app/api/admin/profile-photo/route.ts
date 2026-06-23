import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, team_id, profile_photo_url } = body;

    if (!user_id || !team_id || !profile_photo_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update profile photo in team_members
    const { data, error } = await supabase
      .from('team_members')
      .update({ profile_photo_url })
      .eq('user_id', user_id)
      .eq('team_id', team_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile photo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in profile photo API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
