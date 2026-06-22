import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, name, team_id, role } = body;

    if (!email || !password || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract username from email if not provided (e.g., ama1@amazakh.com -> ama1)
    const extractedUsername = username || email.split('@')[0];
    
    // Use extracted username as name if not provided
    const extractedName = name || extractedUsername;

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Generate a UUID for the user
    const userId = crypto.randomUUID();

    // Create user record in users table (without Supabase Auth)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        team_id,
        username: extractedUsername,
        password: hashedPassword,
        name: extractedName,
        email,
        role: role || 'member',
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    console.log('User created successfully:', userData);
    return NextResponse.json(userData);
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

    // Get user to check role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .eq('team_id', team_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    // Delete user record (no Supabase Auth to delete)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('team_id', team_id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
