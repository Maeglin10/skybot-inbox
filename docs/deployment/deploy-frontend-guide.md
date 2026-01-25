# 🚀 Déployer le Frontend - Instructions Précises

## Étape 1: Ajouter les Variables d'Environnement (2 min)

### A. Accéder à la Configuration

1. Va sur: **https://dashboard.render.com/**
2. Dans la liste de tes services, trouve et click sur **ton service frontend**
   (Le nom contient probablement "skybot-inbox-ui" ou "inbox-ui")
3. Dans le menu de gauche, click sur **"Environment"**

### B. Ajouter CHAQUE Variable

Click sur le bouton **"Add Environment Variable"** et ajoute une par une:

#### Variable 1: API_BASE
- **Key:** `API_BASE`
- **Value:** `https://skybot-inbox.onrender.com`

#### Variable 2: API_URL
- **Key:** `API_URL`
- **Value:** `https://skybot-inbox.onrender.com`

#### Variable 3: API_KEY
- **Key:** `API_KEY`
- **Value:** `2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=`

#### Variable 4: NEXT_PUBLIC_PROXY_BASE
- **Key:** `NEXT_PUBLIC_PROXY_BASE`
- **Value:** `/api/proxy`

#### Variable 5: APP_URL
- **Key:** `APP_URL`
- **Value:** `https://skybot-inbox-ui.onrender.com`
- ⚠️ **IMPORTANT:** Si ton service Render a un nom différent, utilise cette URL à la place
- Pour trouver ton URL: regarde en haut de la page, il y a l'URL complète du service

#### Variable 6: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`

### C. Sauvegarder

1. Une fois TOUTES les 6 variables ajoutées, click sur **"Save Changes"** (bouton en haut)
2. Render va automatiquement **redéployer** le frontend
3. Le build prendra **~2-3 minutes**

---

## Étape 2: Vérifier le Déploiement

### Suivre le Build

1. Dans Render Dashboard, click sur **"Logs"** (menu de gauche)
2. Tu verras le build en temps réel
3. Cherche ces messages de succès:
   ```
   ✓ Compiled successfully
   ✓ Collecting page data
   ✓ Generating static pages
   ```

### Une fois déployé

Ton frontend sera accessible sur:
```
https://skybot-inbox-ui.onrender.com
```
(ou l'URL de ton service si différent)

---

## Étape 3: Configurer Meta (Pendant que ça build)

Pendant les 2-3 minutes de build, tu peux configurer Meta:

### A. Activer GitHub Pages (30 sec)

1. Va sur: https://github.com/Maeglin10/skybot-inbox/settings/pages
2. **Source:** "Deploy from a branch"
3. **Branch:** `main`
4. **Folder:** `/docs`
5. Click **"Save"**

### B. Configurer Meta Privacy Policy (1 min)

1. Va sur: https://developers.facebook.com/apps/
2. Sélectionne ton app (ID: 1554026052411956)
3. **Settings → Basic**
4. **Privacy Policy URL:** `https://maeglin10.github.io/skybot-inbox/privacy-policy.html`
5. **Terms of Service URL:** `https://maeglin10.github.io/skybot-inbox/terms-of-service.html`
6. Click **"Save Changes"**

### C. Configurer Meta Webhooks (2 min)

Une fois le backend Render redéployé (vérifie que `/privacy-policy` fonctionne):

#### Pour Instagram:
1. **Webhooks → Configure Webhooks**
2. **Callback URL:** `https://skybot-inbox.onrender.com/webhooks/meta`
3. **Verify Token:** `3e8e83f4540e6849940c2998c7d4d182b7771498bb62d8b46183f78b1c58e8a7`
4. **Subscribe to:** `messages`

#### Pour Facebook Messenger:
1. Same callback URL et verify token
2. **Subscribe to:** `messages`

---

## ✅ Checklist Finale

- [ ] 6 variables d'environnement ajoutées dans Render
- [ ] Save changes → Build triggered
- [ ] GitHub Pages activé
- [ ] Meta Privacy Policy URL configurée
- [ ] Meta Webhooks configurés
- [ ] Frontend accessible sur ton URL Render
- [ ] Backend privacy policy endpoint accessible

**Temps total:** ~10 minutes

**Résultat:** Frontend et backend déployés en production, Meta configuré, prêt pour tests! 🚀
