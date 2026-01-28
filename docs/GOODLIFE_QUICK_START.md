# GoodLife - Quick Start Guide 🚀

## ✅ Réponses rapides à tes questions

### 1. JWT_SECRET - Un ou plusieurs ?
**Réponse:** **UN SEUL** JWT_SECRET pour toute l'application !
- Tous les utilisateurs (Nexxa, Demo, GoodLife) utilisent le même JWT_SECRET
- Chaque utilisateur a son propre token JWT signé avec ce secret
- L'isolation multi-tenant se fait via `accountId` dans la DB, pas via le JWT

### 2. Où configurer dans Render ?
**Service:** `skybot-inbox` (le backend NestJS)

**Étapes:**
1. Va sur https://dashboard.render.com
2. Clique sur **skybot-inbox** (PAS skybot-inbox-ui, PAS skybot-inbox-db)
3. Onglet **Environment**
4. Ajoute ces variables :
   ```
   JWT_SECRET=<copie depuis ton .env local>
   SEED_SECRET_KEY=<génère une clé aléatoire>
   ```
5. Clique **Save Changes** → Render redeploy automatiquement

**Les autres services:**
- `skybot-inbox-ui` : Frontend, pas besoin de JWT
- `skybot-inbox-db` : Database, pas de variables à ajouter
- `skybot` : Service séparé, on ne touche pas

### 3. Est-ce que tout est prêt ?

✅ **Déjà prêt:**
- Compte GoodLife en base
- User `goodlife.nexxaagents` créé
- Auth JWT fonctionnelle
- Isolation multi-tenant OK

⚠️ **Manque encore:**
- Variables env sur Render (2 min)
- ClientConfig pour GoodLife (automatisé ci-dessous)
- ExternalAccount WhatsApp (automatisé ci-dessous)

### 4. On peut tester avant le vrai WhatsApp ?

**OUI !** Tu peux tout tester sans avoir le numéro WhatsApp :
- ✅ Se connecter avec goodlife.nexxaagents
- ✅ Vérifier l'isolation des données
- ✅ Tester l'interface
- ✅ Simuler des webhooks (avec script de test)

---

## 🎯 Setup automatisé (2 commandes)

### Étape 1: Setup GoodLife (local)
```bash
npm run setup:goodlife
```

Ce script va :
- ✅ Vérifier que le compte GoodLife existe
- ✅ Créer le ClientConfig automatiquement
- ✅ Te demander si tu as le phone_number_id WhatsApp
- ✅ Configurer ExternalAccount si tu l'as

**Si tu n'as pas encore le phone_number_id:** Pas grave ! Le script le créera plus tard.

### Étape 2: Tester GoodLife (local)
```bash
npm run test:goodlife
```

Ce script va vérifier :
- ✅ Compte et utilisateur OK
- ✅ ClientConfig configuré
- ✅ WhatsApp configuré (si phone_number_id fourni)
- ✅ Isolation multi-tenant OK

---

## 📋 Checklist complète

### A. Configuration locale (5 min)

- [ ] **1. Setup automatique**
  ```bash
  npm run setup:goodlife
  ```

- [ ] **2. Tests automatiques**
  ```bash
  npm run test:goodlife
  ```

### B. Configuration Render (2 min)

- [ ] **1. Ajouter les variables**
  - Va sur Render Dashboard
  - Service: `skybot-inbox`
  - Onglet: Environment
  - Ajoute:
    - `JWT_SECRET` (depuis ton .env)
    - `SEED_SECRET_KEY` (génère une clé)
  - Save Changes

- [ ] **2. Activer les backups**
  - Service: `skybot-inbox-db`
  - Onglet: Backups
  - Active "Automatic Backups"
  - Fréquence: Daily

### C. Configuration WhatsApp (après avoir le numéro)

- [ ] **1. Meta Business Manager**
  - Ajoute le numéro GoodLife
  - Récupère le `phone_number_id`

- [ ] **2. Configure en base**
  ```bash
  npm run setup:goodlife
  # Entre le phone_number_id quand demandé
  ```

### D. Tests finaux

- [ ] **1. Test connexion**
  - URL: https://skybot-inbox-ui.onrender.com
  - Username: `goodlife.nexxaagents`
  - Password: (depuis vault sécurisé)

- [ ] **2. Test isolation**
  - Se connecter avec GoodLife
  - Vérifier qu'il ne voit PAS les données Demo/Nexxa
  - Dashboard vide = normal !

- [ ] **3. Test webhook** (après config WhatsApp)
  - Envoyer un message au numéro GoodLife
  - Vérifier qu'il apparaît dans l'inbox

---

## 🆘 Troubleshooting

### Problème: "Account not found"
**Solution:** Lance d'abord le seed général
```bash
npm run db:seed
```

### Problème: "JWT verification failed"
**Solution:** Vérifie que JWT_SECRET est le même en local et sur Render

### Problème: "No data in dashboard"
**Solution:** C'est normal ! GoodLife n'a pas encore de données.
- Soit tu attends les vrais messages WhatsApp
- Soit tu crées des données de test manuellement

### Problème: "Cannot connect to database"
**Solution:** Vérifie DATABASE_URL dans .env

---

## 📞 Résumé rapide

**Pour setup GoodLife en local:**
```bash
npm run setup:goodlife
npm run test:goodlife
```

**Sur Render:**
1. Service `skybot-inbox` > Environment
2. Ajoute JWT_SECRET et SEED_SECRET_KEY
3. Save Changes

**C'est tout !** 🎉

---

## 🔐 Credentials (stockage sécurisé uniquement)

- Username: `goodlife.nexxaagents`
- Password: Voir vault/1Password
- Account ID: Voir output de `npm run test:goodlife`

---

## 📚 Documentation complète

Pour plus de détails, voir: [`GOODLIFE_SETUP_MANUAL_STEPS.md`](./GOODLIFE_SETUP_MANUAL_STEPS.md)
