import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Initialiser Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Récupérer les headers
    const headerList = await headers();
    const svix_id = headerList.get('svix-id');
    const svix_timestamp = headerList.get('svix-timestamp');
    const svix_signature = headerList.get('svix-signature');

    // Vérifier si les headers sont présents
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Récupérer le corps de la requête
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Vérifier la signature du webhook
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    let evt: any;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Gérer les différents événements
    const eventType = evt.type;
    console.log(`Webhook received: ${eventType}`);

    switch (eventType) {
      case 'organization.created':
        await handleOrganizationCreated(evt.data);
        break;
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      case 'organizationMembership.created':
        await handleOrganizationMembershipCreated(evt.data);
        break;
      case 'organizationMembership.deleted':
        await handleOrganizationMembershipDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Gérer la création d'une organisation (équipe)
async function handleOrganizationCreated(data: any) {
  const { id, name, slug } = data;

  // Générer le slug à partir du nom si non fourni
  const teamSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

  // Créer l'équipe dans Supabase
  const { error } = await supabase.from('teams').insert({
    clerk_organization_id: id,
    name: name,
    slug: teamSlug,
  });

  if (error) {
    console.error('Error creating team in Supabase:', error);
    throw error;
  }

  console.log(`Team created in Supabase: ${name} (${teamSlug})`);
}

// Gérer la création d'un utilisateur
async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name } = data;
  const email = email_addresses[0]?.email_address;

  if (!email) {
    console.error('User has no email address');
    return;
  }

  // L'utilisateur sera ajouté à team_members lors de la création de l'organisationMembership
  console.log(`User created in Clerk: ${email}`);
}

// Gérer la mise à jour d'un utilisateur
async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name } = data;
  const email = email_addresses[0]?.email_address;

  if (!email) {
    console.error('User has no email address');
    return;
  }

  // Mettre à jour les informations de l'utilisateur dans Supabase
  const { error } = await supabase
    .from('team_members')
    .update({
      email: email,
      first_name: first_name || null,
      last_name: last_name || null,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', id);

  if (error) {
    console.error('Error updating user in Supabase:', error);
    throw error;
  }

  console.log(`User updated in Supabase: ${email}`);
}

// Gérer la suppression d'un utilisateur
async function handleUserDeleted(data: any) {
  const { id } = data;

  // Désactiver l'utilisateur dans Supabase
  const { error } = await supabase
    .from('team_members')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', id);

  if (error) {
    console.error('Error deactivating user in Supabase:', error);
    throw error;
  }

  console.log(`User deactivated in Supabase: ${id}`);
}

// Gérer la création d'un membership d'organisation
async function handleOrganizationMembershipCreated(data: any) {
  const { organization, public_user_id, role } = data;
  const { id: orgId, name, slug } = organization;

  // Récupérer les informations de l'utilisateur depuis Clerk
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(public_user_id);
  const email = user.emailAddresses[0]?.emailAddress;
  const firstName = user.firstName;
  const lastName = user.lastName;

  if (!email) {
    console.error('User has no email address');
    return;
  }

  // Récupérer l'équipe depuis Supabase
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('clerk_organization_id', orgId)
    .single();

  if (teamError || !team) {
    console.error('Team not found in Supabase:', teamError);
    return;
  }

  // Déterminer le rôle
  const teamRole = role === 'admin' ? 'owner' : 'member';

  // Créer ou mettre à jour le membre dans Supabase
  const { error } = await supabase.from('team_members').upsert({
    clerk_user_id: public_user_id,
    team_id: team.id,
    email: email,
    first_name: firstName || null,
    last_name: lastName || null,
    role: teamRole,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'clerk_user_id,team_id'
  });

  if (error) {
    console.error('Error creating team member in Supabase:', error);
    throw error;
  }

  console.log(`Team member created in Supabase: ${email} -> ${name}`);
}

// Gérer la suppression d'un membership d'organisation
async function handleOrganizationMembershipDeleted(data: any) {
  const { organization, public_user_id } = data;
  const { id: orgId } = organization;

  // Récupérer l'équipe depuis Supabase
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('clerk_organization_id', orgId)
    .single();

  if (teamError || !team) {
    console.error('Team not found in Supabase:', teamError);
    return;
  }

  // Supprimer le membre dans Supabase
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('clerk_user_id', public_user_id)
    .eq('team_id', team.id);

  if (error) {
    console.error('Error deleting team member in Supabase:', error);
    throw error;
  }

  console.log(`Team member deleted in Supabase: ${public_user_id}`);
}
