# 🚀 Instructions de Déploiement

## Prérequis

- Node.js 18+ installé
- Supabase CLI installé (`npm install -g supabase`)
- Projet Supabase créé (avec `supabase init`)
- Variables d'environnement configurées (`.env.local`)

---

## 📋 Checklist Avant le Déploiement

### 1. Vérifier les Variables d'Environnement
```bash
# .env.local doit contenir:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx
```

### 2. Vérifier les Migrations
Les fichiers suivants doivent exister:
```
supabase/migrations/
├── 20260608001241_create_sama_asc_schema.sql
├── 20260608002925_add_player_stats.sql ✏️ MODIFIÉ
├── 20260608004204_add_formation_to_matches.sql
├── 20260608020000_add_multi_tenant_support.sql
├── 20260608030000_add_users_table.sql
├── 20260609000000_update_password_hashing.sql ✨ NOUVEAU
└── 20260609000001_hash_existing_passwords.sql ✨ NOUVEAU
```

---

## 🔧 Étapes de Déploiement

### Option A: Développement Local avec Supabase Local

#### 1. Démarrer Supabase Local
```bash
cd supabase
supabase start
```

**Attend:** Services lancés (PostgreSQL, Supabase Studio)

#### 2. Appliquer les Migrations
```bash
supabase migration up
```

**Vérifie:** Les migrations s'exécutent sans erreur
- Les tables sont créées/modifiées
- Les triggers sont en place
- Les RLS policies sont appliquées

#### 3. Vérifier les Extensions PostgreSQL
```bash
supabase db pull
```

Vérifiez que `pgcrypto` est chargée:
```sql
-- Dans Supabase Studio → SQL Editor
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

#### 4. Installer les Dépendances Node.js
```bash
npm install
```

#### 5. Démarrer l'Application
```bash
npm run dev
```

**Accédez à:** `http://localhost:3000`

---

### Option B: Déploiement en Production (Supabase Cloud)

#### 1. Configurer la Connexion
```bash
# Login à Supabase
supabase login

# Link au projet cloud
supabase link --project-ref xxxxx
```

#### 2. Pousser les Migrations
```bash
supabase db push
```

**Vérifie:** Les migrations s'appliquent sur le cloud
- Consultez Supabase Dashboard pour confirmer

#### 3. Vérifier les Extensions
```bash
supabase db pull
```

Assurez-vous que `pgcrypto` est présent. Si pas:
```sql
-- Exécutez dans Supabase Studio
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

#### 4. Installer et Build
```bash
npm install
npm run build
```

#### 5. Déployer (Vercel/Netlify/autre)
```bash
# Vercel (exemple)
vercel deploy
```

**Configurez les variables d'environnement sur la plateforme:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Vérifier que Tout Fonctionne

### 1. Test de Création d'Équipe
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Team",
    "slug": "test-team"
  }'
```

**Résultat attendu:** Équipe créée, utilisateur admin créé

### 2. Test de Connexion Admin
1. Allez à `http://localhost:3000/register`
2. Créez une équipe: "Test", slug "test"
3. Allez à `/login`, entrez "test"
4. Entrez admin/admin123
5. **Résultat:** Connecté ✅

### 3. Test de Création d'Utilisateur
1. Allez à `/user-register`
2. Créez un compte: "testuser", "test123"
3. **Résultat:** Connecté automatiquement ✅

### 4. Test de Changement d'Équipe
1. Cliquez "Changer d'équipe" → Revenir à /login
2. Entrez une autre équipe
3. **Résultat:** Redirection vers login utilisateur ✅

### 5. Vérifier les Données en BD
```sql
-- Supabase Studio → SQL Editor
SELECT * FROM teams LIMIT 5;
SELECT * FROM users LIMIT 5;
SELECT password FROM users LIMIT 1;  -- Doit commencer par "sha256:"
```

---

## 🐛 Dépannage

### Erreur: "Extension pgcrypto not found"
**Solution:**
```sql
-- Supabase Studio SQL Editor
CREATE EXTENSION pgcrypto;
```

### Erreur: "Relation 'teams' does not exist"
**Cause:** Migrations non exécutées
**Solution:**
```bash
supabase migration list
supabase migration up
```

### Les mots de passe ne sont pas hachés
**Cause:** Migration 20260609000000 non exécutée
**Solution:**
```bash
supabase migration up --step 1  # Exécuter une étape
```

### Erreur de connection Supabase
**Vérifier:**
- `NEXT_PUBLIC_SUPABASE_URL` est correct
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correct
- Supabase est accessible (`curl https://xxxxx.supabase.co`)

### Page blanche après connexion
**Cause:** Contexte TeamProvider pas initialisé
**Solution:**
```bash
# Vider le cache navigateur
# Ctrl+Shift+Delete (navigateur)
# Ou: localStorage.clear() dans console
```

---

## 📊 Monitoring

### Vérifier les Connexions
```sql
-- Supabase Studio
SELECT username, team_id, created_at FROM users ORDER BY created_at DESC;
```

### Vérifier les Équipes
```sql
SELECT * FROM teams;
```

### Vérifier que les Mots de Passe Sont Hashés
```sql
SELECT username, 
       CASE 
         WHEN password LIKE 'sha256:%' THEN 'Hashé ✅'
         ELSE 'Clair ❌'
       END as status
FROM users;
```

---

## 🔄 Mise à Jour

### Si une nouvelle migration est ajoutée
```bash
# Local
supabase migration up

# Production
supabase db push
```

### Si les dépendances npm changent
```bash
npm install
npm run build
```

---

## 📈 Performance Optimization

### Après déploiement, considérez:

1. **Caching:**
```typescript
// app/page.tsx
const revalidate = 60; // ISR avec revalidation après 60s
```

2. **Images Optimisées:**
```typescript
import Image from 'next/image';
// Utiliser au lieu de <img>
```

3. **Database Indexes:**
```bash
supabase db pull --linked  # Vérifier les indexes
```

---

## 📞 Support

**Problèmes fréquents:** Consultez `AUTHENTICATION_FIX_REPORT.md`
**Guide utilisateur:** Consultez `QUICK_START.md`
**Détails techniques:** Consultez `TECHNICAL_CHANGES.md`

