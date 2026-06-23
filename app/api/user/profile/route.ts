import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(request: NextRequest) {
  try {
    const { user_id, team_id, first_name, last_name } = await request.json();

    if (!user_id || !team_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('team_members')
      .update({
        first_name,
        last_name,
      })
      .eq('user_id', user_id)
      .eq('team_id', team_id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No user found to update');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Profile updated successfully:', data[0]);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
