import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { team_name, team_domain, admin_email, admin_first_name, admin_password } = await req.json();

    // Validate inputs
    if (!team_name || !team_domain || !admin_email || !admin_password) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Create a Supabase server client to access admin APIs
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    console.log('📝 Starting team creation process for:', admin_email);

    // Step 1: Create Supabase Auth account
    console.log('1️⃣ Creating Supabase Auth account...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: admin_first_name || 'Admin',
      },
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      
      // Handle specific auth errors
      let userMessage = 'Erreur lors de la création du compte';
      if (authError.message.includes('already registered')) {
        userMessage = 'Cet email est déjà utilisé';
      } else if (authError.message.includes('password')) {
        userMessage = 'Le mot de passe ne respecte pas les critères';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte utilisateur' },
        { status: 500 }
      );
    }

    console.log('✅ Auth user created:', userId);

    // Step 2: Create team
    console.log('2️⃣ Creating team...');
    const slug = team_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: team_name,
        domain: team_domain,
        slug: slug,
      })
      .select()
      .single();

    if (teamError) {
      console.error('❌ Team creation error:', teamError);
      
      // Delete the auth user if team creation fails
      await supabase.auth.admin.deleteUser(userId);
      
      let userMessage = 'Erreur lors de la création de l\'équipe';
      if (teamError.message.includes('unique constraint')) {
        userMessage = 'Ce domaine ou slug d\'équipe existe déjà';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      );
    }

    const teamId = teamData.id;
    console.log('✅ Team created:', teamId);

    // Step 3: Create user profile
    console.log('3️⃣ Creating user profile...');
    const { error: userProfileError } = await supabase
      .from('users')
      .insert({
        auth_id: userId,
        email: admin_email,
        first_name: admin_first_name || 'Admin',
        is_active: true,
      });

    if (userProfileError) {
      console.error('⚠️ User profile creation error (non-critical):', userProfileError);
      // Continue even if profile creation fails
    } else {
      console.log('✅ User profile created');
    }

    // Step 4: Add user as team member with owner role
    console.log('4️⃣ Adding user as team member...');
    const { data: teamMemberData, error: teamMemberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        email: admin_email,
        first_name: admin_first_name || 'Admin',
        role: 'owner',
        is_active: true,
      })
      .select()
      .single();

    if (teamMemberError) {
      console.error('❌ Team member creation error:', teamMemberError);
      
      // Delete everything if team member creation fails
      await supabase.from('users').delete().eq('auth_id', userId);
      await supabase.from('teams').delete().eq('id', teamId);
      await supabase.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout du membre à l\'équipe' },
        { status: 500 }
      );
    }

    console.log('✅ Team member created');

    // Return success response
    console.log('🎉 Team creation complete!');
    return NextResponse.json({
      success: true,
      team_id: teamId,
      user_id: userId,
      team_member_id: teamMemberData.id,
      slug: slug,
      email: admin_email,
      message: 'Équipe créée avec succès',
    });

  } catch (error) {
    console.error('❌ Unexpected error in create-complete-team:', error);
    return NextResponse.json(
      { error: 'Erreur interne: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
