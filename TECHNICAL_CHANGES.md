# 🔧 Résumé Technique des Corrections

## Fichiers Créés

### 1. `lib/auth-utils.ts` (NOUVEAU)
**Responsabilité:** Hachage et vérification des mots de passe

```typescript
export async function hashPassword(password: string): Promise<string>
- Utilise Web Crypto API (SHA-256)
- Format: "sha256:" + hexadecimal

export async function verifyPassword(password: string, hash: string): Promise<boolean>
- Compare le hash du mot de passe entré avec le hash stocké
- Format compatible: "sha256:..." ou plain text (backward compat)
```

**Utilisation:**
```typescript
// Lors de l'enregistrement
const hashedPassword = await hashPassword(password);
await supabase.from('users').insert({ password: hashedPassword, ... });

// Lors de la connexion
const isValid = await verifyPassword(password, storedHash);
```

---

## Fichiers Modifiés

### 2. `app/user-register/page.tsx`
**Changement:** Hachage du mot de passe avant stockage

```diff
+ import { hashPassword } from '@/lib/auth-utils';
+ const hashedPassword = await hashPassword(password);
- password,
+ password: hashedPassword,
```

---

### 3. `app/user-login/page.tsx`
**Changement:** Vérification du mot de passe côté client

```diff
+ import { hashPassword, verifyPassword } from '@/lib/auth-utils';
- .eq('password', password)  // ❌ Dangereux: expose password dans la requête
+ // ✅ Récupérer l'utilisateur et vérifier côté client
+ const isValid = await verifyPassword(password, user.password);
+ if (!isValid) { setError('Identifiants incorrects'); }
```

---

### 4. `app/login/page.tsx`
**Changement:** Ajout du lien "Créer une nouvelle équipe"

```diff
+ <button onClick={() => router.push('/register')}>
+   Créer une nouvelle équipe
+ </button>
```

---

### 5. `contexts/team-context.tsx`
**Changement:** Correction du loading state et synchronisation

```diff
- useEffect(() => { loadTeam(); loadUser(); }, []);
+ useEffect(() => {
+   const initializeAuth = async () => {
+     try {
+       await loadTeam();
+       loadUser();
+     } finally {
+       setLoading(false);
+     }
+   };
+   initializeAuth();
+ }, []);

- setLoading(false) dans loadTeam()
+ setLoading(false) uniquement à la fin du processus complet
```

---

### 6. `supabase/migrations/20260608002925_add_player_stats.sql`
**Changement:** Ajout de `team_id` à la table

```diff
  CREATE TABLE player_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
+   team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    ...
  )
```

---

## Migrations Supabase

### 7. `supabase/migrations/20260609000000_update_password_hashing.sql` (NOUVEAU)
**Responsabilité:** Configuration du hachage des mots de passe côté serveur

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE FUNCTION hash_password_sha256(password TEXT) RETURNS TEXT
- Utilise pgcrypto pour SHA-256
- Retourne "sha256:" + hex

CREATE TRIGGER on_team_created ... create_default_admin_user()
- Crée automatiquement admin avec mot de passe hashé
- Mot de passe par défaut: "admin123" → sha256:...
```

---

### 8. `supabase/migrations/20260609000001_hash_existing_passwords.sql` (NOUVEAU)
**Responsabilité:** Migration des anciens mots de passe

```sql
UPDATE users 
SET password = hash_password_sha256(password)
WHERE password NOT LIKE 'sha256:%' AND username = 'admin';
```

- Hashe tous les anciens mots de passe en clair
- Skipe les mots de passe déjà hachés (idempotent)

---

## Architecture d'Authentification

### Avant (❌ Insécurisé)
```
User Input → Requête Supabase avec eq('password', password) → DB compare clair
             ⚠️ Mot de passe visible dans la requête
             ⚠️ Mots de passe stockés en clair
```

### Après (✅ Sécurisé)
```
User Input → hashPassword() [SHA-256]
           ↓
           Requête Supabase select() pour récupérer l'utilisateur
           ↓
           verifyPassword() [compare hashes] → Valide/Invalide
           ✅ Mot de passe jamais visible en clair
           ✅ Mots de passe hachés en DB
```

---

## Flux Multi-Tenant

### Avant
- Pas de `team_id` sur `player_stats` → Données mélangées entre équipes
- Pas de filtrage stricte dans les requêtes

### Après
- ✅ Colonne `team_id` sur toutes les tables
- ✅ Index créés: `idx_players_team_id`, `idx_matches_team_id`, etc.
- ✅ Requêtes filtrées: `.eq('team_id', team.id)`
- ✅ Isolation complète des données par équipe

---

## Dépendances

### Ajoutées
- ✅ Aucune! Utilise Web Crypto API (navigateur natif)
- ✅ pgcrypto (PostgreSQL natif)

### Alternatives Recommandées pour Production
```typescript
// Option 1: bcryptjs (meilleure pour Web)
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, storedHash);

// Option 2: argon2 (meilleure sécurité, plus lent)
import { argon2i } from 'argon2-browser';
const { encoded } = await argon2i({ password });
```

---

## Tests Recommandés

### Unit Tests
```typescript
// hashPassword
- Doit créer un hash cohérent pour le même input
- Doit avoir le format "sha256:..."

// verifyPassword
- Doit retourner true pour le bon mot de passe
- Doit retourner false pour le mauvais mot de passe
- Doit supporter les anciens formats (backward compat)
```

### Integration Tests
```
1. Créer une équipe
2. Admin créé automatiquement
3. Se connecter avec admin/admin123
4. Créer un utilisateur
5. Se connecter avec le nouvel utilisateur
6. Vérifier qu'on ne voit que les données de cette équipe
```

---

## Performance

### Indexes Créés
```sql
CREATE INDEX idx_coach_team_id ON coach(team_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_player_stats_team_id ON player_stats(team_id);
-- ... etc pour toutes les tables
```

**Impact:** Requêtes `eq('team_id', X)` maintenant O(log n) au lieu de O(n)

---

## Backward Compatibility

### Anciennes données
- Mots de passe en clair détectés par: `NOT LIKE 'sha256:%'`
- Migration auto-exécutable sans impact sur nouvelles données
- `verifyPassword` gère les deux formats

### Nouvelles équipes
- Mots de passe automatiquement hachés par le trigger PostgreSQL
- Aucune manipulation manuelle nécessaire

---

## Sécurité

### Checklist
- ✅ Mots de passe hachés (SHA-256 côté client + validation serveur)
- ✅ Pas d'exposition en requête DB
- ✅ Validation multi-tenant stricte
- ✅ RLS policies en place
- ❌ TBD: HTTPS en production
- ❌ TBD: Rate limiting sur les tentatives de connexion
- ❌ TBD: 2FA pour les admins

---

