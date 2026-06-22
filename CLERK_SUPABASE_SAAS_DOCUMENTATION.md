# Documentation Technique - SaaS Multi-Tenant avec Clerk + Supabase

## Vue d'ensemble

Ce document décrit l'architecture complète du système SaaS multi-tenant implémenté avec Clerk pour l'authentification et la gestion des organisations, et Supabase pour la base de données, le stockage et les règles de sécurité (RLS).

## Architecture

### Stack Technique

- **Framework**: Next.js 13.5.1 avec App Router
- **Authentification**: Clerk (Organizations)
- **Base de données**: Supabase PostgreSQL
- **Stockage**: Supabase Storage
- **Sécurité**: Supabase Row Level Security (RLS)
- **Langage**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa

### Structure du Projet

```
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── create-organization/route.ts
│   │   │   ├── create-user/route.ts
│   │   │   └── team-members/route.ts
│   │   ├── user/
│   │   │   └── change-password/route.ts
│   │   └── webhooks/
│   │       └── clerk/route.ts
│   ├── admin/users/page.tsx
│   ├── change-password/page.tsx
│   ├── create-team/page.tsx
│   ├── layout.tsx
│   └── ...
├── components/
│   └── ...
├── contexts/
│   └── team-context.tsx
├── lib/
│   ├── auth-context.tsx
│   ├── supabase.ts
│   └── ...
└── supabase/
    └── migrations/
        ├── 001_create_teams_schema.sql
        └── 002_create_rls_policies.sql
```

## Configuration

### Variables d'Environnement

Ajoutez les variables suivantes à votre fichier `.env.local` :

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=votre_clé_publique_clerk
CLERK_SECRET_KEY=votre_clé_secrète_clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
CLERK_WEBHOOK_SECRET=votre_secret_webhook_clerk

# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase
```

### Middleware Clerk

Le fichier `middleware.ts` configure les routes publiques et protège les routes nécessitant une authentification.

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
    auth().protect();
  }
});
```

## Schéma de Base de Données

### Table `teams`

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  logo_url TEXT,
  team_photo_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#3b82f6',
  accent_color TEXT DEFAULT '#f59e0b',
  nav_color TEXT DEFAULT '#1e293b',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table `team_members`

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, team_id)
);
```

## Politiques RLS (Row Level Security)

### Politiques pour `teams`

```sql
-- Les utilisateurs peuvent voir les équipes auxquelles ils appartiennent
CREATE POLICY "Users can view teams they are members of"
ON teams FOR SELECT
USING (
  id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text
  )
);

-- Les owners/admins peuvent modifier l'équipe
CREATE POLICY "Team owners and admins can update team"
ON teams FOR UPDATE
USING (
  id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- Seuls les owners peuvent supprimer l'équipe
CREATE POLICY "Team owners can delete team"
ON teams FOR DELETE
USING (
  id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role = 'owner'
  )
);
```

### Politiques pour `team_members`

```sql
-- Les utilisateurs peuvent voir les membres de leurs équipes
CREATE POLICY "Users can view team members of their teams"
ON team_members FOR SELECT
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text
  )
);

-- Les owners/admins peuvent ajouter des membres
CREATE POLICY "Team owners and admins can insert team members"
ON team_members FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- Les owners/admins peuvent modifier les membres
CREATE POLICY "Team owners and admins can update team members"
ON team_members FOR UPDATE
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role IN ('owner', 'admin')
  )
);

-- Seuls les owners peuvent supprimer des membres
CREATE POLICY "Team owners can delete team members"
ON team_members FOR DELETE
USING (
  team_id IN (
    SELECT team_id 
    FROM team_members 
    WHERE clerk_user_id = auth.uid()::text 
    AND role = 'owner'
  )
);
```

## Webhooks Clerk

### Configuration

1. Allez dans votre dashboard Clerk
2. Naviguez vers "Webhooks"
3. Ajoutez un nouveau webhook avec l'URL : `https://votre-domaine.com/api/webhooks/clerk`
4. Sélectionnez les événements :
   - `organization.created`
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organizationMembership.created`
   - `organizationMembership.deleted`

### Événements Gérés

#### `organization.created`

Crée automatiquement l'équipe dans Supabase et ajoute le créateur comme owner.

#### `user.created`

L'utilisateur est ajouté à `team_members` lors de la création du membership d'organisation.

#### `user.updated`

Synchronise les informations de l'utilisateur dans Supabase.

#### `user.deleted`

Désactive l'utilisateur dans Supabase.

#### `organizationMembership.created`

Ajoute l'utilisateur à l'équipe dans Supabase avec le rôle approprié.

#### `organizationMembership.deleted`

Supprime l'utilisateur de l'équipe dans Supabase.

## API Routes

### POST `/api/admin/create-organization`

Crée une nouvelle organisation dans Clerk et l'équipe correspondante dans Supabase.

**Corps de la requête :**
```json
{
  "name": "ASC Teenbi",
  "slug": "teenbi",
  "userId": "user_123456789"
}
```

**Réponse :**
```json
{
  "success": true,
  "organization": {...},
  "team": {...}
}
```

### POST `/api/admin/create-user`

Crée un nouvel utilisateur dans Clerk et l'ajoute à l'équipe dans Supabase.

**Corps de la requête :**
```json
{
  "team_id": "uuid-de-l-equipe",
  "first_name": "Modou",
  "last_name": "Fall",
  "role": "admin"
}
```

**Réponse :**
```json
{
  "success": true,
  "email": "modou.fall@teenbi.com",
  "password": "Yx7@9LmP42",
  "userId": "user_123456789"
}
```

### GET `/api/admin/team-members`

Récupère tous les membres d'une équipe.

**Paramètres de requête :**
- `team_id`: UUID de l'équipe

**Réponse :**
```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "clerk_user_id": "user_123",
    "email": "modou.fall@teenbi.com",
    "first_name": "Modou",
    "last_name": "Fall",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST `/api/user/change-password`

Change le mot de passe de l'utilisateur actuel.

**Corps de la requête :**
```json
{
  "currentPassword": "ancien_mot_de_passe",
  "newPassword": "nouveau_mot_de_passe"
}
```

**Réponse :**
```json
{
  "success": true
}
```

## Contextes React

### UserProvider (`lib/auth-context.tsx`)

Fournit les informations de l'utilisateur actuel, y compris son rôle et son équipe.

```typescript
const { userRole, teamId, loading, refreshUserInfo } = useUser();
```

### TeamProvider (`contexts/team-context.tsx`)

Fournit les informations de l'équipe actuelle.

```typescript
const { team, user, loading, setTeam, setUser, logout, refreshTeam } = useTeam();
```

## Gestion des Rôles

### Owner

- Peut gérer l'équipe
- Peut modifier l'équipe
- Peut supprimer l'équipe
- Peut ajouter des utilisateurs
- Peut modifier des utilisateurs
- Peut désactiver des utilisateurs
- Peut réinitialiser les mots de passe
- Peut gérer tous les paramètres

### Admin

- Peut ajouter des utilisateurs
- Peut modifier des utilisateurs (sauf le rôle owner)
- Peut gérer les fonctionnalités métier autorisées

### Member

- Peut uniquement se connecter
- Peut utiliser les fonctionnalités métier autorisées
- Ne peut pas ajouter des utilisateurs
- Ne peut pas modifier les paramètres de l'équipe
- Ne peut pas accéder aux fonctions d'administration

## Création d'Équipe

1. L'utilisateur navigue vers `/create-team`
2. Il remplit le formulaire avec le nom de l'équipe
3. Le slug est généré automatiquement
4. Le système crée l'organisation dans Clerk
5. Le système crée l'équipe dans Supabase
6. L'utilisateur est ajouté comme owner de l'équipe
7. L'utilisateur est redirigé vers le tableau de bord

## Création d'Utilisateur

1. L'administrateur navigue vers `/admin/users`
2. Il clique sur "Ajouter un utilisateur"
3. Il remplit le formulaire avec le prénom et le nom
4. Il sélectionne le rôle (admin ou member)
5. Le système génère automatiquement l'email : `prenom.nom@domaine.com`
6. Le système génère un mot de passe sécurisé
7. L'utilisateur est créé dans Clerk
8. L'utilisateur est ajouté à l'organisation Clerk
9. L'utilisateur est ajouté à `team_members` dans Supabase
10. Les informations de connexion sont affichées à l'administrateur

## Changement de Mot de Passe

1. L'utilisateur se connecte pour la première fois
2. Le système détecte qu'il doit changer son mot de passe
3. L'utilisateur est redirigé vers `/change-password`
4. Il entre son mot de passe actuel et le nouveau
5. Le mot de passe est modifié dans Clerk
6. L'utilisateur est redirigé vers le tableau de bord

## Isolation Multi-Tenant

### Sécurité

- Toutes les tables métier doivent contenir `team_id`
- Toutes les politiques RLS filtrent les données par `team_id`
- Les utilisateurs ne peuvent voir que les données de leur équipe
- Les utilisateurs ne peuvent pas accéder aux données d'autres équipes

### Exemple

**ASC Teenbi**
- Utilisateurs : admin@teenbi.com, modou.fall@teenbi.com, astou.diop@teenbi.com
- Données : uniquement celles de Teenbi

**ASC Jamono**
- Utilisateurs : admin@jamono.com, moussa.ba@jamono.com, khady.ndiaye@jamono.com
- Données : uniquement celles de Jamono

Les utilisateurs Teenbi ne peuvent jamais voir ou accéder aux données Jamono.

## Déploiement

### Vercel

1. Configurez les variables d'environnement dans Vercel
2. Déployez le projet
3. Configurez le webhook Clerk avec l'URL de production

### Supabase

1. Exécutez les migrations SQL dans votre projet Supabase
2. Configurez les politiques RLS
3. Activez Row Level Security

### Clerk

1. Configurez les webhooks
2. Activez les Organizations
3. Configurez les templates JWT pour Supabase

## Maintenance

### Sauvegardes

Supabase gère automatiquement les sauvegardes de la base de données.

### Monitoring

Utilisez les dashboards Clerk et Supabase pour surveiller :
- Les connexions utilisateurs
- Les erreurs d'API
- Les performances de la base de données
- Les webhooks

### Mises à jour

Pour mettre à jour le système :
1. Testez les modifications en environnement de développement
2. Exécutez les migrations SQL si nécessaire
3. Déployez sur Vercel
4. Surveillez les erreurs post-déploiement

## Support

Pour toute question ou problème technique, consultez :
- Documentation Clerk : https://clerk.com/docs
- Documentation Supabase : https://supabase.com/docs
- Documentation Next.js : https://nextjs.org/docs
