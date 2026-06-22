import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { team_id, temp_user_id, real_user_id } = await req.json();

    if (!team_id || !real_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Updating team_members with correct user ID');
    console.log('  Team ID:', team_id);
    console.log('  Real User ID:', real_user_id);

    const supabase = createAdminSupabaseClient();

    // Update team_members with the real Supabase Auth user ID
    const { error: updateError, data } = await supabase
      .from('team_members')
      .update({ user_id: real_user_id })
      .eq('team_id', team_id)
      .select();

    if (updateError) {
      console.error('Error updating team_members:', updateError);
      return NextResponse.json(
        { error: 'Error updating team_members: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('Successfully updated team_members:', data);

    return NextResponse.json({
      success: true,
      message: 'User ID updated successfully',
      updated_rows: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in update-user-id API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
