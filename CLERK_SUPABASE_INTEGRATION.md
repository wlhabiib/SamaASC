# Documentation Technique : Intégration Clerk et Supabase

## Vue d'ensemble

Ce document décrit l'intégration de Clerk (authentification) et Supabase (base de données) dans le projet SamaASC, une application SaaS multi-tenant pour la gestion d'équipes de football.

## Architecture

### Technologies utilisées
- **Clerk** : Authentification des utilisateurs et gestion des organisations
- **Supabase** : Base de données PostgreSQL avec Row Level Security (RLS)
- **Next.js 13** : Framework React avec App Router
- **TypeScript** : Typage statique

### Architecture multi-tenant
L'application utilise une architecture multi-tenant avec isolation des données par équipe :
- Chaque équipe est une organisation Clerk
- Les données sont isolées par équipe grâce aux politiques RLS de Supabase
- Les utilisateurs peuvent appartenir à plusieurs équipes avec différents rôles

## Configuration

### Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Middleware Clerk

Le middleware Clerk est configuré dans `middleware.ts` pour protéger les routes :

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/register(.*)',
  '/user-login(.*)',
  '/user-register(.*)',
  '/api/webhooks/clerk(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});
```

## Schéma de base de données

### Table `teams`

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_organization_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  team_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table `team_members`

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Politiques RLS (Row Level Security)

Les politiques RLS assurent l'isolation des données par équipe :

```sql
-- Activer RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Politique pour la table teams
CREATE POLICY "Teams can be read by organization members"
ON teams FOR SELECT
USING (
  clerk_organization_id IN (
    SELECT clerk_organization_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text
  )
);

-- Politique pour la table team_members
CREATE POLICY "Team members can be read by team members"
ON team_members FOR SELECT
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text
  )
);
```

## Webhooks Clerk

### Configuration

1. Allez dans le dashboard Clerk → Webhooks
2. Créez un nouveau webhook avec l'URL : `https://votre-domaine.com/api/webhooks/clerk`
3. Sélectionnez les événements :
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.deleted`

### Implémentation

L'API webhook est implémentée dans `app/api/webhooks/clerk/route.ts` :

```typescript
export async function POST(req: Request) {
  // Vérification de la signature du webhook
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(body, headers);
  
  // Gestion des événements
  switch (evt.type) {
    case 'organization.created':
      await handleOrganizationCreated(evt.data);
      break;
    case 'user.created':
      await handleUserCreated(evt.data);
      break;
    // ...
  }
}
```

## Contextes React

### Contexte d'authentification (`lib/auth-context.tsx`)

Le contexte d'authentification utilise Clerk pour gérer l'authentification :

```typescript
export function UserProvider({ children }: { children: ReactNode }) {
  const { userId } = useClerkAuth();
  const { user } = useClerkUser();
  
  // Récupère les informations de l'utilisateur depuis Supabase
  const refreshUserInfo = async () => {
    const supabase = createClientSupabaseClient();
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('clerk_user_id', userId)
      .single();
  };
}
```

### Contexte d'équipe (`contexts/team-context.tsx`)

Le contexte d'équipe gère les informations de l'équipe actuelle :

```typescript
export function TeamProvider({ children }: { children: ReactNode }) {
  const { userId } = useClerkAuth();
  
  const refreshTeam = async () => {
    const supabase = createClientSupabaseClient();
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();
    
    // Récupère les informations de l'équipe
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamMember.team_id)
      .single();
  };
}
```

## API Routes

### Création d'organisation (`app/api/admin/create-organization/route.ts`)

Crée une organisation dans Clerk et l'équipe correspondante dans Supabase :

```typescript
export async function POST(req: Request) {
  const { name, slug, userId } = await req.json();
  
  // Créer l'organisation dans Clerk
  const organization = await clerk.organizations.createOrganization({
    name: name,
    slug: slug,
    createdBy: userId,
  });
  
  // Créer l'équipe dans Supabase
  const { data: team } = await supabase
    .from('teams')
    .insert({
      clerk_organization_id: organization.id,
      name: name,
      slug: slug,
    })
    .select()
    .single();
}
```

### Création d'utilisateur (`app/api/admin/create-user/route.ts`)

Crée un utilisateur dans Clerk et l'ajoute à l'organisation :

```typescript
export async function POST(req: Request) {
  const { team_id, first_name, last_name, role } = await req.json();
  
  // Générer l'email automatiquement
  const email = `${first_name.toLowerCase()}.${last_name.toLowerCase()}@${team.slug}.com`;
  
  // Générer un mot de passe sécurisé
  const password = generateSecurePassword();
  
  // Créer l'utilisateur dans Clerk
  const user = await clerk.users.createUser({
    emailAddress: [email],
    password: password,
    firstName: first_name,
    lastName: last_name,
  });
  
  // Ajouter à l'organisation
  await clerk.organizations.createOrganizationMembership({
    organizationId: team.clerk_organization_id,
    userId: user.id,
    role: role === 'admin' ? 'admin' : 'org:member',
  });
}
```

### Changement de mot de passe (`app/api/user/change-password/route.ts`)

Permet à l'utilisateur de changer son mot de passe via Clerk :

```typescript
export async function POST(req: Request) {
  const user = await currentUser();
  const { currentPassword, newPassword } = await req.json();
  
  // Changer le mot de passe via Clerk
  await clerk.users.updateUser(user.id, {
    password: newPassword,
  });
}
```

## Pages principales

### Page de création d'équipe (`app/create-team/page.tsx`)

Permet de créer une nouvelle équipe (organisation Clerk) :

```typescript
const handleCreateTeam = async (e: React.FormEvent) => {
  const response = await fetch('/api/admin/create-organization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: teamName,
      slug: slug,
      userId: userId,
    }),
  });
};
```

### Page d'administration des utilisateurs (`app/admin/users/page.tsx`)

Permet à l'administrateur de gérer les membres de l'équipe :

```typescript
const loadMembers = async () => {
  const response = await fetch(`/api/admin/team-members?team_id=${team.id}`);
  const data = await response.json();
  setMembers(data || []);
};
```

### Page de gestion de l'équipe (`app/parametres/page.tsx`)

Permet de modifier les paramètres de l'équipe (nom, couleurs, logo, etc.).

## Déploiement

### Vercel

1. **Ajouter les variables d'environnement dans Vercel :**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Configurer le webhook Clerk après déploiement :**
   - Récupérez l'URL de votre application Vercel
   - Configurez le webhook Clerk avec l'URL : `https://votre-app.vercel.app/api/webhooks/clerk`

### Test local

Pour tester localement, utilisez ngrok pour exposer votre localhost :

```bash
ngrok http 3000
```

Configurez le webhook Clerk avec l'URL ngrok.

## Sécurité

### Rôles et permissions

- **Owner** : Peut gérer l'équipe, ajouter/supprimer des membres, modifier les paramètres
- **Admin** : Peut gérer les membres et modifier certains paramètres
- **Member** : Peut uniquement consulter les données de l'équipe

### Isolation des données

Les politiques RLS assurent que chaque équipe ne peut accéder qu'à ses propres données. Les utilisateurs ne peuvent voir que les données des équipes auxquelles ils appartiennent.

## Dépannage

### Erreurs courantes

1. **Erreur de build TypeScript**
   - Vérifiez que les interfaces TypeScript correspondent au schéma de base de données
   - Assurez-vous que les noms de colonnes sont corrects (clerk_organization_id vs clerk_org_id)

2. **Webhook Clerk ne fonctionne pas**
   - Vérifiez que le CLERK_WEBHOOK_SECRET est correct
   - Assurez-vous que l'URL du webhook est accessible depuis Internet
   - Vérifiez les logs du webhook dans le dashboard Clerk

3. **Erreur RLS Supabase**
   - Vérifiez que les politiques RLS sont correctement configurées
   - Assurez-vous que l'utilisateur est authentifié avec Clerk
   - Vérifiez que clerk_user_id est correctement synchronisé

## Ressources

- [Documentation Clerk](https://clerk.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)

## Support

Pour toute question ou problème, contactez l'équipe de développement.
