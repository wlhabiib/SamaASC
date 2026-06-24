# Rapport d'Analyse des Performances - Sama ASC

## Architecture Actuelle

### Stack Technique
- **Framework**: Next.js 16.2.9 (App Router)
- **UI**: React 18.2.0 + TailwindCSS
- **Data Fetching**: SWR 2.4.2 + Supabase
- **State Management**: Context API (TeamContext, AuthContext)
- **Build**: Turbopack activé

### Pages Principales
- Page d'accueil (`app/page.tsx`)
- Admin (`app/admin/page.tsx`)
- Équipe (`app/equipe/page.tsx`)
- Classement (`app/classement/page.tsx`)
- Galerie (`app/galerie/page.tsx`)
- Supporters (`app/supporters/page.tsx`)
- Résultats (`app/resultats/page.tsx`)

---

## Analyse des Requêtes Supabase

### Index Existant (Vérifié dans 001_complete_schema.sql)
✅ **Index présents sur toutes les colonnes de filtrage**:
- `idx_players_team_id`
- `idx_matches_team_id`
- `idx_matches_match_date`
- `idx_announcements_team_id`
- `idx_gallery_team_id`
- `idx_standings_team_id`
- `idx_standings_competition_name`
- `idx_player_stats_team_id`
- `idx_competitions_team_id`

### Requêtes API Actuelles
Toutes les requêtes utilisent le pattern:
```typescript
await supabase
  .from('table')
  .select('*')
  .eq('team_id', team_id)
  .order('date', { ascending: false })
```

**Problème identifié**: `select('*')` charge toutes les colonnes, y compris celles inutiles.

---

## Analyse du Cache SWR

### Configuration Actuelle (`hooks/use-supabase-query.ts`)
```typescript
dedupingInterval: 30000, // 30 secondes
revalidateOnFocus: false
revalidateOnReconnect: true
```

### Cache Local (`utils/cache.ts`)
- Durée: 2 minutes (120000ms)
- Stockage: localStorage
- Utilisé sur: page d'accueil uniquement

**Problème identifié**: Deux systèmes de cache différents (SWR + localStorage) créent une incohérence.

---

## Analyse des Composants

### Page d'Accueil (`app/page.tsx`)
**Chargement actuel**:
- 5 requêtes parallèles (announcements, matches, players, gallery, users)
- Bloquant: `setLoading(true)` → attend toutes les requêtes → `setLoading(false)`
- UX: Écran de chargement pendant toute la durée des requêtes

**Problème**: Pattern "loading bloquant" au lieu de "affichage immédiat + chargement en arrière-plan"

### Page Admin (`app/admin/page.tsx`)
**Chargement actuel**:
- 10 requêtes parallèles (players, matches, announcements, standings, gallery, coach, player-stats, match-lineup, competitions, users)
- Bloquant avec early return si `userLoading`
- UX: Écran de chargement pendant toute la durée

**Problème**: Trop de requêtes simultanées, pas de lazy loading des onglets

---

## Taille du Bundle (Estimation)

### Dépendances Lourdes
- `@radix-ui/*`: 30+ packages (~500KB)
- `recharts`: ~200KB
- `embla-carousel-react`: ~50KB
- `lucide-react`: ~100KB (toutes les icônes)

**Problème**: Import de toutes les icônes Lucide au lieu de l'arbre dynamique.

---

## Requêtes en Cascade

### Identifié dans `contexts/team-context.tsx`
```typescript
const refreshTeam = async () => {
  // 1. getSession
  const { data: { session } } = await supabase.auth.getSession();
  
  // 2. Query team_members
  const { data: teamMember } = await supabase.from('team_members')...
  
  // 3. Fallback query par email
  const { data: teamMemberByEmail } = await supabase.from('team_members')...
  
  // 4. Query teams
  const { data: teamData } = await supabase.from('teams')...
}
```

**Problème**: Requêtes séquentielles au lieu de parallèles.

---

## 10 Éléments les Plus Lents (Estimés)

### 1. Page Admin - Chargement initial
**Estimation**: 800-1500ms
**Cause**: 10 requêtes parallèles + rendering complexe
**Correction**: Lazy loading des onglets, chargement progressif

### 2. Page Accueil - Chargement initial
**Estimation**: 500-1000ms
**Cause**: 5 requêtes parallèles + pattern bloquant
**Correction**: Pattern skeleton + chargement en arrière-plan

### 3. Context Team - refreshTeam
**Estimation**: 300-600ms
**Cause**: Requêtes séquentielles (getSession → team_members → teams)
**Correction**: Requêtes parallèles, éliminer le fallback

### 4. Page Équipe - Chargement
**Estimation**: 400-800ms
**Cause**: 5 requêtes (players, coach, stats, matches, lineups)
**Correction**: Lazy loading des sections

### 5. Page Résultats - Chargement
**Estimation**: 400-700ms
**Cause**: 4 requêtes (matches, players, votes, competitions)
**Correction**: Pagination, lazy loading

### 6. Page Galerie - Chargement
**Estimation**: 300-600ms
**Cause**: Chargement de toutes les images sans pagination
**Correction**: Pagination + lazy loading images

### 7. Page Classement - Chargement
**Estimation**: 200-400ms
**Cause**: 2 requêtes (standings, competitions)
**Correction**: OK, mais peut être optimisé

### 8. Page Supporters - Chargement
**Estimation**: 300-500ms
**Cause**: 1 requête supporters + rendering
**Correction**: Pagination

### 9. Bundle JS - Taille
**Estimation**: 1.5-2MB (non gzippé)
**Cause**: Trop de dépendances Radix, icônes Lucide complètes
**Correction**: Tree-shaking, dynamic imports

### 10. Navigation entre pages
**Estimation**: 200-500ms
**Cause**: Pas de prefetch des routes, rechargement complet
**Correction**: Prefetch, React Suspense

---

## Corrections Recommandées

### 1. Implémenter le Pattern Skeleton Loading
**Objectif**: Afficher immédiatement → charger en arrière-plan

```typescript
// Au lieu de:
const [loading, setLoading] = useState(true);
useEffect(() => {
  loadData().then(() => setLoading(false));
}, []);
if (loading) return <LoadingSpinner />;

// Faire:
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  loadData().then(setData).finally(() => setIsLoading(false));
}, []);
return (
  <div>
    {isLoading ? <Skeleton /> : <Content data={data} />}
  </div>
);
```

### 2. Lazy Loading des Onglets Admin
```typescript
const PlayersTab = dynamic(() => import('./tabs/players-tab'));
const MatchesTab = dynamic(() => import('./tabs/matches-tab'));
```

### 3. Optimiser les Requêtes Supabase
```typescript
// Au lieu de select('*'):
.select('id, name, position, jersey_number, photo_url')

// Ajouter limit pour les grandes tables:
.limit(50)
```

### 4. Paralléliser les Requêtes dans Context
```typescript
const [session, teamMember] = await Promise.all([
  supabase.auth.getSession(),
  supabase.from('team_members').select('*').eq('user_id', user.id).maybeSingle()
]);
```

### 5. Pagination pour Galerie et Supporters
```typescript
.select('*')
.range(0, 19) // 20 items par page
```

### 6. Optimiser les Imports Lucide
```typescript
// Au lieu de:
import { Users, Calendar, Megaphone } from 'lucide-react';

// Faire:
import Users from 'lucide-react/dist/esm/icons/users';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
```

### 7. Unifier le Cache SWR + LocalStorage
Supprimer `utils/cache.ts` et utiliser uniquement SWR avec configuration appropriée.

### 8. Prefetch des Routes Next.js
```typescript
// Dans layout.tsx ou middleware
import { prefetch } from 'next/prefetch';
prefetch('/equipe');
prefetch('/classement');
```

### 9. React Suspense pour Chargement Progressif
```typescript
<Suspense fallback={<Skeleton />}>
  <TeamSection />
</Suspense>
```

### 10. Monitoring en Production
Ajouter le hook `use-performance-monitor.ts` sur les pages critiques.
