# Guide de déploiement sur Vercel

## Prérequis

- Compte Vercel (gratuit)
- Projet GitHub connecté
- Variables d'environnement Supabase configurées dans `.env`

## Étape 1: Installer Vercel CLI

```bash
npm i -g vercel
```

## Étape 2: Connecter à Vercel

```bash
vercel login
```

Suivez les instructions pour vous connecter à votre compte Vercel.

## Étape 3: Déployer le projet

Depuis le répertoire du projet:

```bash
vercel
```

Suivez les instructions:
1. **Link to existing project?** - Sélectionnez "No"
2. **What's your project's name?** - Entrez "sama-asc" ou le nom souhaité
3. **In which directory is your code located?** - "./" (répertoire actuel)
4. **Want to modify these settings?** - "No"

Vercel va analyser votre projet et détecter qu'il s'agit d'une application Next.js.

## Étape 4: Configurer les variables d'environnement

Après le premier déploiement, vous devez configurer les variables d'environnement:

### Option A: Via le dashboard Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans "Settings" > "Environment Variables"
4. Ajoutez les variables suivantes depuis votre fichier `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option B: Via Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Entrez votre URL Supabase

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Entrez votre clé anon Supabase
```

## Étape 5: Redéployer avec les variables d'environnement

```bash
vercel --prod
```

## Étape 6: Vérifier le déploiement

1. Allez sur le dashboard Vercel
2. Cliquez sur votre projet
3. Vérifiez que le déploiement est réussi
4. Cliquez sur "Visit" pour voir votre application en production

## Déploiements futurs

Pour déployer de nouvelles modifications:

```bash
git add .
git commit -m "votre message"
git push
```

Vercel déploiera automatiquement à chaque push sur la branche principale.

## Dépannage

### Erreur: Variables d'environnement manquantes

Assurez-vous que toutes les variables sont configurées dans le dashboard Vercel et redéployez:

```bash
vercel --prod
```

### Erreur: Build échoue

Vérifiez les logs de build dans le dashboard Vercel pour identifier le problème.

### Supabase RLS Policies

Assurez-vous que les politiques RLS sont correctement configurées dans Supabase pour permettre l'accès public aux données nécessaires.

## Configuration Supabase pour la production

Assurez-vous que:
1. Les migrations SQL ont été appliquées
2. Le bucket `team-assets` existe avec les bonnes permissions
3. Les politiques RLS sont activées
