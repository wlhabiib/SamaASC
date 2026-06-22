# Rapport de Correction - Problèmes de Connexion et Création d'Équipe

## Problèmes Identifiés et Résolus

### 1. 🔴 **Faille de Sécurité: Mots de Passe en Clair**
**Problème:** Les mots de passe étaient stockés en clair dans la base de données et vérifiés par une requête Supabase directe (`eq('password', password)`).

**Solution Appliquée:**
- Créé `lib/auth-utils.ts` avec fonctions de hachage SHA-256
- Implémenté `hashPassword()` et `verifyPassword()` côté client
- Les mots de passe sont maintenant hachés avant stockage
- Vérification du mot de passe fait côté client, pas dans la requête DB

**Fichiers modifiés:**
- ✅ `lib/auth-utils.ts` (nouveau)
- ✅ `app/user-register/page.tsx` - Utilise `hashPassword()`
- ✅ `app/user-login/page.tsx` - Utilise `verifyPassword()`

---

### 2. 🔴 **Colonne `team_id` Manquante dans `player_stats`**
**Problème:** La table `player_stats` n'avait pas de colonne `team_id`, cassant le système multi-tenant.

**Solution Appliquée:**
- Ajouté `team_id UUID REFERENCES teams(id) ON DELETE CASCADE` à `player_stats`
- Filtrage multi-tenant maintenant possible

**Fichiers modifiés:**
- ✅ `supabase/migrations/20260608002925_add_player_stats.sql`

---

### 3. 🔴 **Contexte d'Authentification Non Synchronisé**
**Problème:** Le `TeamProvider` avait une race condition - `setLoading(false)` était appelé avant que les données ne soient chargées.

**Solution Appliquée:**
- Restructuré `loadTeam()` et `loadUser()` avec gestion correcte du loading
- Les deux fonctions s'exécutent séquentiellement, pas en parallèle
- État de chargement maintenu jusqu'à la fin de l'initialisation

**Fichiers modifiés:**
- ✅ `contexts/team-context.tsx`

---

### 4. 🔴 **Trigger de Création d'Admin Cassé**
**Problème:** Le trigger PostgreSQL ne créait pas d'utilisateur admin avec mot de passe hashé.

**Solution Appliquée:**
- Créé nouvelle migration `20260609000000_update_password_hashing.sql` avec:
  - Fonction PostgreSQL `hash_password_sha256()` utilisant pgcrypto
  - Trigger mis à jour pour créer admin avec mot de passe hashé
  - Migration `20260609000001_hash_existing_passwords.sql` pour hasher les mots de passe existants

**Fichiers créés:**
- ✅ `supabase/migrations/20260609000000_update_password_hashing.sql`
- ✅ `supabase/migrations/20260609000001_hash_existing_passwords.sql`

---

### 5. 🟡 **Navigation UX Améliorée**
**Problème:** Les utilisateurs ne savaient pas comment créer une équipe depuis la page de connexion.

**Solution Appliquée:**
- Ajouté bouton "Créer une nouvelle équipe" dans `/login` avec lien vers `/register`
- Ajouté lien "Changer d'équipe" dans `/user-login`
- Flux de navigation maintenant clair: `register` → `login` → `user-login` → home

**Fichiers modifiés:**
- ✅ `app/login/page.tsx` - Ajouté bouton de création d'équipe

---

## 📋 Flux d'Authentification Corrigé

### Première fois (Créer une équipe)
```
/register → Créer équipe + admin auto
         ↓
         Redirection vers /user-login
         ↓
/user-login → Se connecter avec admin/admin123
           ↓
           → Home (/)
```

### Fois suivantes (Se connecter)
```
/login → Entrer slug de l'équipe
       ↓
       Redirection vers /user-login
       ↓
/user-login → Entrer username + password
            ↓
            → Home (/)
```

---

## 🧪 Comment Tester

### Test 1: Créer une Nouvelle Équipe
1. Accédez à `http://localhost:3000/register`
2. Entrez un nom d'équipe: "Mon Équipe"
3. Entrez un slug: "mon-equipe"
4. Cliquez "Créer mon équipe"
5. **Résultat attendu:** Message de succès, redirection automatique vers `/user-login`

### Test 2: Se Connecter (Admin)
1. À la page `/user-login`, entrez:
   - Username: `admin`
   - Password: `admin123`
2. Cliquez "Se connecter"
3. **Résultat attendu:** Redirection vers la page d'accueil (/)

### Test 3: Créer un Nouveau Compte Utilisateur
1. À la page `/user-login`, cliquez "Créer un compte"
2. Remplissez le formulaire:
   - Nom complet: "Jean Dupont"
   - Username: "jean"
   - Mot de passe: "motdepasse123"
3. Cliquez "Créer mon compte"
4. **Résultat attendu:** Compte créé, connexion automatique, redirection vers home

### Test 4: Se Connecter avec le Nouvel Utilisateur
1. Cliquez "Changer d'équipe" pour retourner à `/login`
2. Entrez le slug: "mon-equipe"
3. Cliquez "Continuer"
4. À `/user-login`, entrez:
   - Username: `jean`
   - Password: `motdepasse123`
5. **Résultat attendu:** Connexion réussie, redirection vers home

---

## 🔒 Améliorations de Sécurité

### Mots de Passe
- ✅ Hachés avec SHA-256 avant stockage
- ✅ Vérifiés côté client (pas d'exposition en requête DB)
- ✅ Stockage format: `sha256:hexadecimal`
- ✅ Backward compatible avec anciennes données grâce à la migration

### Multi-Tenant
- ✅ Colonne `team_id` sur toutes les tables
- ✅ Index créés pour performance
- ✅ RLS policies permettent lecture publique (data isolation côté app)

---

## 📝 Notes Importantes

1. **Mot de passe par défaut admin:** `admin123`
   - Fonction PostgreSQL le hache automatiquement lors de la création

2. **Support backward compatibility:**
   - Les anciens mots de passe en clair sont hashés par la migration
   - La fonction `verifyPassword` gère les deux formats

3. **Environnement local vs Production:**
   - Extensions pgcrypto nécessaire: `CREATE EXTENSION pgcrypto`
   - Vérifier que les migrations s'exécutent dans l'ordre numérique

---

## ✅ Checklist Post-Déploiement

- [ ] Exécuter toutes les migrations Supabase dans l'ordre
- [ ] Vérifier que la table `users` a la colonne `password`
- [ ] Tester la création d'une équipe
- [ ] Tester la connexion admin (admin/admin123)
- [ ] Tester la création d'un utilisateur
- [ ] Tester la déconnexion et reconnexion
- [ ] Vérifier que les RLS policies n'affectent pas les opérations

---

## 🚀 Prochaines Étapes Recommandées

1. **Implémenter bcryptjs ou argon2** pour un hachage plus robuste
2. **Ajouter validation de password strength** (au moins 8 caractères, majuscules, etc.)
3. **Implémenter reset de mot de passe** via email
4. **Ajouter 2FA** pour les comptes admin
5. **Logger les tentatives de connexion échouées**

