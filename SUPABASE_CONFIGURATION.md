# Configuration des Tables Supabase - SAMA ASC

## Structure des Tables

### 1. Table `users` (Profils Utilisateurs)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  auth_id TEXT UNIQUE NOT NULL,  -- Reference to auth.users.id
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Objectif**: Stocker les profils utilisateurs avec lien vers Supabase Auth

---

### 2. Table `teams` (Équipes)
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Objectif**: Stocker les informations des équipes

---

### 3. Table `team_members` (Membres de l'Équipe)
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  user_id TEXT NOT NULL,  -- Reference to auth.users.id (UUID as TEXT)
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL,     -- 'owner', 'admin', 'member'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

**Objectif**: Gérer les membres des équipes et leurs rôles

---

### 4. Tables de Contenu (players, matches, announcements, gallery, etc.)
Toutes les autres tables utilisent `team_id` pour l'isolation multi-tenant

---

## Flux de Création d'Équipe

### Étape 1: Utilisateur remplit le formulaire
- Nom de l'équipe
- Nom/Email administrateur
- Mot de passe administrateur
- Domaine

### Étape 2: Appel API `/api/auth/create-complete-team` (côté serveur)
```json
{
  "team_name": "ASC AMA",
  "team_domain": "asc-ama.fr",
  "admin_email": "admin@asc-ama.fr",
  "admin_first_name": "Admin",
  "admin_password": "MonMotDePasseSecurisé123"
}
```

### Étape 3: API exécute les étapes suivantes (utilise SERVICE_ROLE_KEY)

1. **Crée le compte Supabase Auth**
   - Email: admin@asc-ama.fr
   - Password: MonMotDePasseSecurisé123
   - Auto-confirm email
   - Récupère l'UUID généré: `550e8400-e29b-41d4-a716-446655440000`

2. **Crée l'équipe dans `teams`**
   ```
   id: new UUID
   name: "ASC AMA"
   slug: "asc-ama"
   domain: "asc-ama.fr"
   ```

3. **Crée le profil dans `users`**
   ```
   auth_id: "550e8400-e29b-41d4-a716-446655440000"
   email: "admin@asc-ama.fr"
   first_name: "Admin"
   ```

4. **Crée team_member dans `team_members`**
   ```
   team_id: <UUID de l'équipe créée>
   user_id: "550e8400-e29b-41d4-a716-446655440000"
   email: "admin@asc-ama.fr"
   role: "owner"
   ```

### Étape 4: Retour au client
```json
{
  "success": true,
  "team_id": "aaa-bbb-ccc",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "team_member_id": "xxx-yyy-zzz",
  "slug": "asc-ama",
  "email": "admin@asc-ama.fr"
}
```

### Étape 5: Affichage des identifiants
L'app affiche les identifiants créés avec avertissement de sauvegarder

### Étape 6: Redirection vers login
Après 3 secondes, redirection vers `/login`

---

## Flux de Connexion

### Étape 1: Utilisateur entre identifiants
- Email: admin@asc-ama.fr
- Password: MonMotDePasseSecurisé123

### Étape 2: Client appelle `supabase.auth.signInWithPassword()`
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@asc-ama.fr',
  password: 'MonMotDePasseSecurisé123'
});

// Résultat:
// data.user.id = "550e8400-e29b-41d4-a716-446655440000"
// data.session.access_token = "JWT token..."
```

### Étape 3: Récupérer les infos team
```typescript
const userId = data.user.id; // "550e8400-e29b-41d4-a716-446655440000"

const { data: teamMember } = await supabase
  .from('team_members')
  .select('team_id, role, teams(id, name, slug)')
  .eq('user_id', userId)
  .eq('is_active', true)
  .single();

// Résultat:
// {
//   team_id: "aaa-bbb-ccc",
//   role: "owner",
//   teams: { id: "aaa-bbb-ccc", name: "ASC AMA", slug: "asc-ama" }
// }
```

### Étape 4: Stocker dans le contexte applicatif
```typescript
{
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@asc-ama.fr"
  },
  team: {
    id: "aaa-bbb-ccc",
    name: "ASC AMA",
    slug: "asc-ama"
  },
  role: "owner"
}
```

### Étape 5: Redirection vers home
`router.push('/')` → charge le dashboard avec les données de l'équipe

---

## Sécurité - Row Level Security (RLS)

### Principes
- ✅ Chaque utilisateur ne voit que ses propres équipes
- ✅ Chaque administrateur ne gère que les membres de son équipe
- ❌ Impossible d'accéder aux données d'une autre équipe
- ✅ Les données anonymes sont protégées

### Policies Implémentées

#### 1. Table `users`
```sql
-- SELECT: Utilisateurs ne voient que leur propre profil
-- OU admins voient les profils de leurs équipes
SELECT ON users
  USING (auth_id = auth.uid()::text OR 
         EXISTS (SELECT 1 FROM team_members tm 
                 WHERE tm.user_id = users.auth_id 
                 AND tm.team_id IN (SELECT team_id FROM team_members 
                                   WHERE user_id = auth.uid()::text 
                                   AND role IN ('owner', 'admin'))))

-- UPDATE: Utilisateurs ne peuvent modifier que leur propre profil
UPDATE ON users
  USING (auth_id = auth.uid()::text)
```

#### 2. Table `team_members`
```sql
-- SELECT: Utilisateurs voient leurs propres infos ET les membres de leurs équipes
SELECT ON team_members
  USING (user_id = auth.uid()::text OR
         EXISTS (SELECT 1 FROM team_members tm2 
                 WHERE tm2.team_id = team_members.team_id 
                 AND tm2.user_id = auth.uid()::text))

-- INSERT/UPDATE: Seuls owners et admins peuvent ajouter des membres
INSERT/UPDATE ON team_members
  WITH CHECK (EXISTS (SELECT 1 FROM team_members admin_tm 
              WHERE admin_tm.team_id = team_members.team_id 
              AND admin_tm.user_id = auth.uid()::text 
              AND admin_tm.role IN ('owner', 'admin')))

-- DELETE: Seuls owners peuvent supprimer
DELETE ON team_members
  USING (EXISTS (SELECT 1 FROM team_members admin_tm 
         WHERE admin_tm.team_id = team_members.team_id 
         AND admin_tm.user_id = auth.uid()::text 
         AND admin_tm.role = 'owner'))
```

#### 3. Tables de Contenu (players, matches, announcements, etc.)
```sql
-- SELECT: Utilisateurs voient uniquement les données de leurs équipes
SELECT ON players/matches/announcements/gallery/etc
  USING (EXISTS (SELECT 1 FROM team_members 
         WHERE team_members.team_id = <table>.team_id 
         AND team_members.user_id = auth.uid()::text))

-- INSERT/UPDATE: Seuls admins et owners
INSERT/UPDATE ON players/matches/announcements/gallery/etc
  WITH CHECK (EXISTS (SELECT 1 FROM team_members 
              WHERE team_members.team_id = <table>.team_id 
              AND team_members.user_id = auth.uid()::text 
              AND team_members.role IN ('owner', 'admin')))

-- DELETE: Seuls admins et owners
DELETE ON players/matches/announcements/gallery/etc
  USING (EXISTS (SELECT 1 FROM team_members 
         WHERE team_members.team_id = <table>.team_id 
         AND team_members.user_id = auth.uid()::text 
         AND team_members.role IN ('owner', 'admin')))
```

---

## Mise en Œuvre

### 1. Appliquer les migrations
```bash
# Appliquer migration 001 (structure de base)
supabase db push

# Appliquer migration 002 (users, améliorations RLS)
supabase db push
```

### 2. Vérifier les tables
```sql
-- Vérifier que les tables existent
SELECT tablename FROM pg_tables 
WHERE tablename IN ('users', 'teams', 'team_members');

-- Vérifier les policies RLS
SELECT tablename, policyname 
FROM pg_policies 
ORDER BY tablename;
```

### 3. Tester le flux
1. Aller à `/register`
2. Créer une équipe avec identifiants
3. Vérifier les données en base (teams, users, team_members)
4. Aller à `/login`
5. Se connecter avec les identifiants
6. Vérifier que vous accédez au dashboard avec les données de l'équipe

### 4. Tests de Sécurité
- [ ] Un utilisateur ne peut voir que ses équipes
- [ ] Un utilisateur ne peut pas accéder aux données d'une autre équipe
- [ ] Un admin ne peut gérer que les membres de son équipe
- [ ] Un non-admin ne peut pas ajouter de membres
- [ ] Impossible de byteorder les RLS policies avec des requêtes directes

---

## Configuration des Variables d'Environnement

**.env.local** (Côté client - PUBLIC)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**.env** (Côté serveur - SECRET)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **IMPORTANT**: `SUPABASE_SERVICE_ROLE_KEY` ne doit JAMAIS être exposé au client. Il est uniquement accessible côté serveur dans les API routes.

---

## Vérification Finale

1. ✅ Les identifiants admin créés fonctionnent
2. ✅ La session persiste après login
3. ✅ Les données de l'équipe se chargent correctement
4. ✅ Les RLS policies empêchent l'accès non autorisé
5. ✅ Les redirects fonctionnent correctement
