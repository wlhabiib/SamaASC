import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user data from custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch team data
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', userData.team_id)
      .single();

    if (teamError) {
      console.error('Error fetching team data:', teamError);
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        team_id: userData.team_id,
        username: userData.username,
        name: userData.username,
        role: userData.role,
      },
      team: teamData,
    });
  } catch (error) {
    console.error('Error in auth user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
