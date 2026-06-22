# 🚀 Guide Rapide - Utiliser Sama ASC

## 1️⃣ Première Utilisation - Créer votre Équipe

### Étape 1: Créer une Équipe
1. Accédez à l'application: `http://localhost:3000/register` (ou cliquez "Créer une nouvelle équipe" depuis la page de connexion)
2. Remplissez le formulaire:
   - **Nom de l'ASC**: Ex: "ASC Diambars"
   - **Identifiant (Slug)**: Ex: "asc-diambars" (sans espaces, caractères spéciaux)
3. Cliquez **"Créer mon équipe"**

✅ **Un compte administrateur est créé automatiquement:**
- Username: `admin`
- Mot de passe: `admin123`

---

### Étape 2: Se Connecter comme Administrateur
1. Entrez votre **identifiant de l'ASC (slug)** : Ex: "asc-diambars"
2. Cliquez **"Continuer"**
3. À la page suivante, entrez:
   - Username: `admin`
   - Mot de passe: `admin123`
4. Cliquez **"Se connecter"**

✅ Vous êtes maintenant administrateur!

---

## 2️⃣ Ajouter des Utilisateurs (Pour les Administrateurs)

### Option 1: Via le Dashboard Admin
1. Allez dans **Menu** → **Admin** (ou `/admin`)
2. Cliquez sur l'onglet **Utilisateurs**
3. Cliquez **"+ Ajouter utilisateur"**
4. Remplissez:
   - Nom complet
   - Username
   - Mot de passe (min 6 caractères)
   - Rôle: `member` (ou `admin` pour un autre admin)
5. Cliquez **"Enregistrer"**

### Option 2: Page d'Enregistrement Libre
1. À la page de connexion utilisateur, cliquez **"Créer un compte"**
2. Remplissez le formulaire
3. Le compte est créé et vous êtes connecté automatiquement

---

## 3️⃣ Se Connecter (Utilisateurs Existants)

### Première Visite
1. Allez à `http://localhost:3000`
2. Entrez votre **identifiant de l'ASC**
3. Entrez vos identifiants (username/password)
4. Cliquez **"Se connecter"**

### Visites Suivantes
1. Si vous étiez connecté, vous êtes redirigé automatiquement vers la page d'accueil
2. Pour changer d'équipe, cliquez **"Changer d'équipe"** dans le menu

---

## 📱 Navigation

### Menu Principal (Bas de l'écran)
- 🏠 **Accueil**: Prochains matchs et annonces
- 👥 **Équipe**: Composition de l'équipe, terrain, statistiques
- 📊 **Classement**: Standings de votre compétition
- 🏆 **Résultats**: Matchs joués et scores
- 🖼️ **Galerie**: Photos et vidéos
- 🎤 **Supporters**: Messages des supporters
- ⚙️ **Admin** (si admin): Gérer les joueurs, matchs, etc.

---

## 🔐 Sécurité

### Mots de Passe
- ✅ Toujours au moins 6 caractères
- ✅ Stockés de manière sécurisée (hachés)
- ✅ Ne jamais partagés par email

### Déconnexion
- Pour vous déconnecter, cliquez sur votre profil → **"Déconnexion"**
- Cela vous ramène à la page de sélection d'équipe

---

## ❓ Dépannage

### Je ne me souviens pas de mon mot de passe
**Solution temporaire:** Un administrateur peut créer un nouveau compte utilisateur avec un nouveau mot de passe

### Je me suis trompé d'équipe
- Cliquez **"Changer d'équipe"** pour retourner à la page de sélection d'équipe

### Mon équipe n'apparaît pas
- Vérifiez que vous entrez le bon **slug** (identifiant de l'équipe)
- Le slug ne peut contenir que: lettres minuscules, chiffres, tirets (-)

### Erreur lors de la création de compte
- Vérifiez que le username n'existe pas déjà dans cette équipe
- Le mot de passe doit contenir au moins 6 caractères
- Les deux mots de passe doivent être identiques

---

## 💡 Conseils Utiles

1. **Slug court et mémorisable**: "mon-asc" plutôt que "association-sportive-culturelle-monequipe"
2. **Partager le slug**: Envoyez le slug à vos utilisateurs pour qu'ils se connectent facilement
3. **Mots de passe forts**: Utilisez des mots de passe différents pour chaque utilisateur
4. **Admin dédié**: Changez le mot de passe admin après la première connexion

---

## 📞 Support

Pour les problèmes techniques, consultez le fichier `AUTHENTICATION_FIX_REPORT.md`

