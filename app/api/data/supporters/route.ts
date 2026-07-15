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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!team_id) {
      return NextResponse.json({ error: 'Missing team_id' }, { status: 400 });
    }

    const expiryDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: deleteError } = await supabase
      .from('supporters')
      .delete()
      .eq('team_id', team_id)
      .lt('created_at', expiryDate);

    if (deleteError) {
      console.error('Error deleting expired supporters:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('supporters')
      .select('id, name, message, profile_photo_url, message_type, voice_url, sticker_url, created_at')
      .eq('team_id', team_id)
      .gte('created_at', expiryDate)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching supporters:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in supporters API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
