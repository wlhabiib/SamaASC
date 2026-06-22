import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { name, slug, userId } = await req.json();

    if (!name || !slug || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Créer l'organisation dans Clerk
    const clerk = await clerkClient();
    const organization = await clerk.organizations.createOrganization({
      name: name,
      slug: slug,
      createdBy: userId,
    });

    // Créer l'équipe dans Supabase
    const supabase = createAdminSupabaseClient();

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        clerk_organization_id: organization.id,
        name: name,
        slug: slug,
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team in Supabase:', teamError);
      return NextResponse.json(
        { error: 'Error creating team in Supabase' },
        { status: 500 }
      );
    }

    // Ajouter l'utilisateur comme owner de l'équipe dans Supabase
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    const firstName = user.firstName;
    const lastName = user.lastName;

    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: team.id,
      clerk_user_id: userId,
      email: email,
      first_name: firstName || null,
      last_name: lastName || null,
      role: 'owner',
      is_active: true,
    });

    if (memberError) {
      console.error('Error creating team member in Supabase:', memberError);
      return NextResponse.json(
        { error: 'Error creating team member in Supabase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: organization,
      team: team,
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Error creating organization' },
      { status: 500 }
    );
  }
}
