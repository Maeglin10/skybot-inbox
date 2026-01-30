# 🚀 Déployer le Frontend SkyBot Inbox sur Vercel

## Pourquoi Vercel?

- ✅ **Gratuit** pour les projets personnels
- ✅ **Conçu pour Next.js** (par l'équipe Next.js)
- ✅ **Deploy automatique** à chaque git push
- ✅ **URL publique** pour ton client
- ✅ **SSL gratuit** (HTTPS automatique)
- ✅ **CDN global** pour performances optimales

## 📋 Étapes de déploiement

### 1. Crée un compte Vercel

Va sur [vercel.com](https://vercel.com) et connecte-toi avec GitHub.

### 2. Importe le projet

1. Clique sur **"Add New Project"**
2. Importe le repo `skybot-inbox`
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `skybot-inbox-ui`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Configure les variables d'environnement

Dans Vercel, ajoute ces variables:

```bash
API_URL=https://skybot-inbox.onrender.com/api
API_BASE=https://skybot-inbox.onrender.com/api
API_KEY=2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=
NEXT_PUBLIC_PROXY_BASE=/api/proxy
```

### 4. Deploy!

Clique sur **"Deploy"**. En 2-3 minutes, ton frontend sera en ligne!

Tu recevras une URL du type:
- `https://skybot-inbox.vercel.app`
- Ou un domaine personnalisé si tu en configures un

## 🔄 Mises à jour automatiques

Une fois configuré, **chaque git push sur main** déploiera automatiquement la nouvelle version!

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push
# ↓ Vercel déploie automatiquement!
```

## 🌐 URL de Production

Après le déploiement, partage l'URL avec ton client:
- **Frontend**: `https://skybot-inbox.vercel.app` (ou ton domaine)
- **Backend API**: `https://skybot-inbox.onrender.com`

## 🔐 Domaine personnalisé (optionnel)

Pour utiliser ton propre domaine (ex: `inbox.goodlifecr.com`):

1. Va dans **Settings > Domains** sur Vercel
2. Ajoute ton domaine
3. Configure les DNS selon les instructions Vercel

## ✅ Test après déploiement

1. Va sur ton URL Vercel
2. Login avec: `goodlife.nexxaagents` / `4qFEZPjc8f`
3. Va dans **Alerts > Corporativo**
4. Tu devrais voir les **17 contacts corporate**!

## 🎯 Alternative: Render (si tu préfères tout sur Render)

Si tu veux héberger le frontend sur Render aussi:

1. Ajoute ce service dans `render.yaml`:

```yaml
  - type: web
    name: skybot-inbox-ui
    env: node
    region: oregon
    plan: free
    buildCommand: cd skybot-inbox-ui && npm install && npm run build
    startCommand: cd skybot-inbox-ui && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: API_URL
        value: https://skybot-inbox.onrender.com/api
      - key: API_BASE
        value: https://skybot-inbox.onrender.com/api
      - key: API_KEY
        sync: false
```

Mais **Vercel est recommandé** car c'est plus rapide et optimisé pour Next.js.

## 📊 À propos du MCP

Le serveur MCP (`mcp-server/`) est un **outil pour MOI (Claude)** pour monitorer ta prod en temps réel. Il ne se "déploie" pas - il s'installe dans ma config pour que je puisse voir ce qui se passe sur ta plateforme instantanément.

Ton client n'a pas besoin du MCP - il utilise juste le frontend déployé sur Vercel!
