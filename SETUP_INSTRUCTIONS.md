# Instructions de configuration pour le multi-tenancy

## 1. Appliquer les migrations de base de données

Exécutez les migrations SQL suivantes dans votre projet Supabase:

```sql
-- Migration 1: Support multi-tenant
-- Fichier: supabase/migrations/20260608020000_add_multi_tenant_support.sql

-- Migration 2: Table users avec authentification
-- Fichier: supabase/migrations/20260608030000_add_users_table.sql
```

Vous pouvez les appliquer via:
- Le dashboard Supabase (SQL Editor)
- En ligne de commande avec Supabase CLI: `supabase db push`

## 2. Créer le bucket Supabase Storage

1. Allez dans le dashboard Supabase
2. Naviguez vers "Storage"
3. Créez un nouveau bucket nommé `team-assets`
4. Configurez les permissions:
   - Public: true (pour permettre l'accès public aux images)
   - File size limit: 5MB (ou selon vos besoins)
5. Ajoutez une politique RLS pour le bucket via SQL Editor:
   ```sql
   -- Politique pour permettre l'upload public
   CREATE POLICY "Public Upload" ON storage.objects FOR INSERT 
   TO anon, authenticated WITH CHECK (bucket_id = 'team-assets');

   -- Politique pour permettre la lecture publique
   CREATE POLICY "Public Read" ON storage.objects FOR SELECT 
   TO anon, authenticated USING (bucket_id = 'team-assets');

   -- Politique pour permettre la mise à jour
   CREATE POLICY "Public Update" ON storage.objects FOR UPDATE 
   TO anon, authenticated USING (bucket_id = 'team-assets');
   ```

## 3. Flux d'authentification

L'application utilise maintenant un système d'authentification à deux niveaux:

### Niveau 1: Connexion à l'ASC (équipe)
- Page: `/login`
- L'utilisateur entre le slug de son ASC
- Redirection vers la page de connexion utilisateur

### Niveau 2: Connexion utilisateur
- Page: `/user-login`
- L'utilisateur entre son nom d'utilisateur et mot de passe
- Chaque équipe a un compte admin par défaut:
  - Identifiant: `admin`
  - Mot de passe: `admin123`
- Les utilisateurs peuvent créer des comptes via `/user-register`

### Création d'une équipe
- Page: `/register`
- L'utilisateur crée d'abord son équipe (ASC)
- Un compte admin est automatiquement créé (admin/admin123)
- Redirection vers la page de connexion utilisateur

## 4. Tester l'application

1. Lancez le serveur de développement: `npm run dev`
2. Accédez à http://localhost:3000
3. Vous serez redirigé vers la page de connexion équipe
4. Option 1: Créer une nouvelle équipe via "Créer une équipe"
   - Connectez-vous ensuite avec admin/admin123
5. Option 2: Connectez-vous avec une équipe existante
   - Entrez le slug de l'équipe
   - Connectez-vous avec admin/admin123 ou créez un compte utilisateur
6. Configurez votre équipe dans la page "Paramètres" (logo, couleurs)
7. Ajoutez des joueurs, matchs, etc. via la page "Admin"

## Fonctionnalités implémentées

✅ Multi-tenancy: Chaque équipe a ses propres données isolées
✅ Authentification à deux niveaux: Équipe puis utilisateur
✅ Admin par défaut: Chaque équipe a un compte admin (admin/admin123)
✅ Page de paramètres: Personnalisation des couleurs et logo de l'équipe
✅ Upload de fichiers direct: Remplacement des URLs par des uploads depuis l'appareil
✅ Filtrage par équipe: Toutes les pages utilisent team_id pour isoler les données
✅ Protection des pages: Vérification d'authentification sur toutes les pages
✅ Rôle admin: Seuls les admins peuvent accéder à la page Admin et Paramètres

## Structure des données

- `teams`: Table des équipes avec configuration (couleurs, logo)
- `users`: Table des utilisateurs avec rôle (admin/member) liés à une équipe
- `players`, `matches`, `announcements`, `standings`, `gallery`, `supporters`: Toutes les tables ont un `team_id`
- `match_votes`, `match_lineup`, `player_stats`, `coach`: Également liées à une équipe

## Notes importantes

- Assurez-vous que le bucket `team-assets` est créé avant d'essayer d'uploader des images
- Les équipes sont identifiées par leur `slug` (identifiant unique)
- Le compte admin par défaut est créé automatiquement lors de la création d'une équipe
- Seuls les utilisateurs avec le rôle 'admin' peuvent accéder à la page Admin et Paramètres
- Les couleurs personnalisées peuvent être utilisées pour thémiser l'application (à implémenter)
