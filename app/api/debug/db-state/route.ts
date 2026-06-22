import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');

    // Get all team_members
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('*');

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    return NextResponse.json({
      teams: teams || [],
      teamMembers: teamMembers || [],
      users: users || [],
      errors: {
        teamsError,
        membersError,
        usersError
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
