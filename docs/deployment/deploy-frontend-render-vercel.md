# Déployer le Frontend sur Render

## Étapes Rapides (5 minutes)

### 1. Aller sur Render Dashboard
https://dashboard.render.com/

### 2. Créer un nouveau Web Service
- Click "New +" → "Web Service"
- Connect ton repo GitHub: `Maeglin10/skybot-inbox`
- Nom: `skybot-inbox-ui`

### 3. Configuration
```yaml
Root Directory: skybot-inbox-ui
Build Command: npm install && npm run build
Start Command: npm start
```

### 4. Variables d'environnement à ajouter
```bash
API_URL=https://skybot-inbox.onrender.com
API_BASE=https://skybot-inbox.onrender.com
API_KEY=2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=
NEXT_PUBLIC_PROXY_BASE=/api/proxy
APP_URL=https://skybot-inbox-ui.onrender.com
NODE_ENV=production
```

### 5. Déployer
Click "Create Web Service"

Après ~2-3 minutes, ton frontend sera accessible sur:
**https://skybot-inbox-ui.onrender.com** (ou le nom que tu choisis)

---

## Alternative: Vercel (Recommandé pour Next.js - plus rapide)

### 1. Aller sur Vercel
https://vercel.com/

### 2. Import ton repo
- Click "Add New..." → "Project"
- Connect GitHub: `Maeglin10/skybot-inbox`
- **Root Directory**: `skybot-inbox-ui`

### 3. Variables d'environnement
Ajouter les mêmes variables que ci-dessus

### 4. Deploy
Click "Deploy"

Après ~1 minute, ton frontend sera accessible sur:
**https://skybot-inbox-ui.vercel.app**
