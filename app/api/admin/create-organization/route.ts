import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { name, slug, userId, createAdmin } = await req.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const supabase = createAdminSupabaseClient();

    let adminEmail: string | null = null;
    let adminPassword: string | null = null;
    let createdUserId: string | null = userId || null;

    // Si createAdmin est true, créer l'utilisateur admin automatiquement
    if (createAdmin) {
      // Générer l'email admin
      adminEmail = `admin@${slug}.com`;
      
      // Générer un mot de passe sécurisé
      adminPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

      // Créer l'utilisateur dans Clerk
      const user = await clerk.users.createUser({
        emailAddress: [adminEmail],
        password: adminPassword,
        firstName: 'Admin',
        lastName: name,
      });

      createdUserId = user.id;
    }

    // Créer l'organisation dans Clerk
    const organization = await clerk.organizations.createOrganization({
      name: name,
      slug: slug,
      createdBy: createdUserId || undefined,
    });

    // Créer l'équipe dans Supabase
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
    if (createdUserId) {
      let email = adminEmail;
      let firstName = 'Admin';
      let lastName = name;

      // Si userId est fourni (cas où l'utilisateur est déjà connecté), récupérer ses infos
      if (userId && !createAdmin) {
        const user = await clerk.users.getUser(userId);
        email = user.emailAddresses[0]?.emailAddress || email;
        firstName = user.firstName || firstName;
        lastName = user.lastName || lastName;
      }

      const { error: memberError } = await supabase.from('team_members').insert({
        team_id: team.id,
        clerk_user_id: createdUserId,
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
    }

    const response: any = {
      success: true,
      organization: organization,
      team: team,
    };

    // Si createAdmin est true, retourner les identifiants admin
    if (createAdmin && adminEmail && adminPassword) {
      response.adminEmail = adminEmail;
      response.adminPassword = adminPassword;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Error creating organization' },
      { status: 500 }
    );
  }
}
