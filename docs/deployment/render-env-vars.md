# Variables d'Environnement pour Render Frontend

## ❌ Erreur Actuelle
```
Error: Missing env: API_BASE
```

Le build Next.js échoue car les variables d'environnement ne sont pas configurées dans Render.

---

## ✅ Solution: Ajouter les Variables dans Render Dashboard

### Étape 1: Aller dans Render Dashboard
1. Va sur: https://dashboard.render.com/
2. Sélectionne ton service frontend (skybot-inbox-ui)
3. Click sur **"Environment"** dans le menu de gauche

### Étape 2: Ajouter TOUTES ces variables

Click "Add Environment Variable" et ajoute une par une:

```bash
# API Configuration
API_BASE=https://skybot-inbox.onrender.com
API_URL=https://skybot-inbox.onrender.com
API_KEY=2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=

# Next.js Public Variables
NEXT_PUBLIC_PROXY_BASE=/api/proxy

# App URL (sera ta vraie URL Render une fois déployé)
APP_URL=https://skybot-inbox-ui.onrender.com

# Environment
NODE_ENV=production
```

### Étape 3: Save Changes
- Click **"Save Changes"** en haut de la page
- Render va automatiquement redéployer avec les variables

---

## 📋 Copier-Coller Rapide

Pour aller plus vite, voici les variables au format clé=valeur:

```
API_BASE
https://skybot-inbox.onrender.com

API_URL
https://skybot-inbox.onrender.com

API_KEY
2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=

NEXT_PUBLIC_PROXY_BASE
/api/proxy

APP_URL
https://skybot-inbox-ui.onrender.com

NODE_ENV
production
```

---

## ⚠️ IMPORTANT

**APP_URL**: Remplace `skybot-inbox-ui.onrender.com` par le vrai nom de ton service Render si différent.

Pour trouver le nom exact:
1. Dans Render Dashboard, regarde en haut de la page du service
2. Tu verras l'URL complète (ex: `https://ton-nom.onrender.com`)
3. Utilise cette URL pour `APP_URL`

---

## 🔄 Après avoir ajouté les variables

Render va automatiquement:
1. Détecter le changement de config
2. Redémarrer le build
3. Déployer le frontend en ~2-3 minutes

Le build devrait réussir cette fois! ✅
