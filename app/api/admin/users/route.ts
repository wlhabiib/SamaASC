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
    const { email, password, name, team_id, role } = body;

    if (!email || !password || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    // Split name into first_name and last_name
    const nameParts = (name || email.split('@')[0]).split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Add user to team_members table
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id,
        user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: role || 'member',
        is_active: true,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating team member:', memberError);
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    console.log('Team member created successfully:', memberData);
    return NextResponse.json(memberData);
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const team_id = searchParams.get('team_id');

    if (!id || !team_id) {
      return NextResponse.json({ error: 'Missing id or team_id' }, { status: 400 });
    }

    // Get team member to check role
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role, user_id')
      .eq('id', id)
      .eq('team_id', team_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Prevent deletion of admin users
    if (member.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    // Delete team member record
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('team_id', team_id);

    if (deleteError) {
      console.error('Error deleting team member:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Delete Supabase Auth user
    await supabase.auth.admin.deleteUser(member.user_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
