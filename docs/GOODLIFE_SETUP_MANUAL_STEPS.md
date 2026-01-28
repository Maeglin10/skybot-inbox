# GoodLife Setup - Etapes Manuelles

**Date:** 28 Janvier 2026
**Status:** En cours de configuration

---

## 1. Variables d'Environnement (Render)

### A ajouter dans Render Dashboard > skybot-inbox > Environment:

```bash
# CRITIQUE - Authentification utilisateurs
# Utilise la valeur de JWT_SECRET depuis ton .env local
JWT_SECRET=<voir .env>

# Seed secret key pour les endpoints de seed demo
SEED_SECRET_KEY=<genere une clé aléatoire sécurisée>

# URL du portail de facturation (remplace par ton URL Stripe si applicable)
BILLING_PORTAL_URL=https://billing.nexxa.com

# Monitoring erreurs (optionnel - creer projet sur sentry.io)
SENTRY_DSN=
LOG_LEVEL=info
```

**Apres ajout:** Redeploy le service

---

## 2. Backups Postgres (Render)

### Activation:
1. Va sur **Render Dashboard** > **skybot_inbox** (database)
2. Onglet **Backups**
3. Active **Automatic Backups**
4. Choisis la frequence: **Daily** recommande

### Verification:
- Les backups sont stockes 7 jours par defaut
- Tu peux faire un backup manuel avant les migrations

---

## 3. Configuration WhatsApp pour GoodLife

### Etape A: Cote Meta Business Manager

1. **Connecte-toi** a [Meta Business Manager](https://business.facebook.com)

2. **Va dans ton App** (ID: `1554026052411956`)

3. **Ajoute le numero WhatsApp GoodLife:**
   - WhatsApp > Configuration > Ajouter un numero
   - Suis le processus de verification du numero
   - **Note le `phone_number_id`** qui sera genere (ex: `573012345678`)

4. **Verifie le Webhook** (deja configure):
   ```
   Callback URL: https://skybot-inbox.onrender.com/api/webhooks/whatsapp
   Verify Token: <voir WHATSAPP_VERIFY_TOKEN dans .env>
   Champs: messages
   ```

### Etape B: Cote Base de Donnees

Une fois que tu as le `phone_number_id` de Meta, tu dois creer les enregistrements dans la base.

**Option 1: Via Prisma Studio** (plus simple)
```bash
npx prisma studio
```
Puis cree manuellement les enregistrements.

**Option 2: Via SQL** (plus rapide)

Connecte-toi a ta base Postgres et execute:

```sql
-- 1. Recupere l'ID du compte GoodLife
SELECT id, name FROM "Account" WHERE name = 'GoodLife';
-- Note l'ID (ex: clxyz123...)

-- 2. Recupere l'ID de l'utilisateur GoodLife
SELECT id, username FROM "User" WHERE username = 'goodlife.nexxaagents';
-- Note l'ID (ex: clxyz456...)

-- 3. Cree le ClientConfig pour GoodLife
INSERT INTO "ClientConfig" (id, "accountId", "clientKey", name, channels, "routingMode", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'ID_COMPTE_GOODLIFE',  -- Remplace par l'ID du compte
  'goodlife',
  'GoodLife WhatsApp',
  ARRAY['WHATSAPP']::text[],
  'ROUND_ROBIN',
  NOW(),
  NOW()
);

-- 4. Cree l'ExternalAccount qui lie le numero WhatsApp au compte
INSERT INTO "ExternalAccount" (id, "accountId", channel, "externalId", "clientKey", name, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'ID_COMPTE_GOODLIFE',  -- Remplace par l'ID du compte
  'WHATSAPP',
  'PHONE_NUMBER_ID_META',  -- Remplace par le phone_number_id de Meta
  'goodlife',
  'GoodLife WhatsApp',
  NOW(),
  NOW()
);
```

### Etape C: Verification du Routing

**Point Important:** Le code actuel route les webhooks vers le compte "Demo" par defaut.

Pour que GoodLife fonctionne correctement, verifie que:
1. L'ExternalAccount est bien cree avec le bon `phone_number_id`
2. Le ClientConfig existe avec `clientKey = 'goodlife'`

Le systeme devrait automatiquement:
- Recevoir le webhook de Meta
- Trouver l'ExternalAccount via le `phone_number_id`
- Router vers le bon compte GoodLife

---

## 4. Tests a Effectuer

### Test 1: Connexion GoodLife
```
URL: https://skybot-inbox-ui.onrender.com
Username: goodlife.nexxaagents
Password: <voir credentials stockées de manière sécurisée>
```
- [ ] Connexion reussie
- [ ] Dashboard affiche (vide, normal)
- [ ] Pas d'erreur console

### Test 2: Isolation Multi-Tenant
- [ ] Connecte avec `goodlife.nexxaagents`
- [ ] Verifie qu'il ne voit PAS les donnees Nexxa/Demo
- [ ] Connecte avec `Nexxa@admin`
- [ ] Verifie qu'il ne voit PAS les donnees GoodLife

### Test 3: Webhook WhatsApp (apres config)
1. Envoie un message WhatsApp au numero GoodLife
2. Verifie dans les logs Render que le webhook est recu
3. Connecte-toi avec `goodlife.nexxaagents`
4. Verifie que la conversation apparait dans l'Inbox

---

## 5. Checklist Finale

### Variables Render
- [ ] JWT_SECRET ajoute
- [ ] BILLING_PORTAL_URL ajoute (ou vide si pas de billing)
- [ ] Service redeploy

### Backups
- [ ] Automatic Backups active sur la database

### WhatsApp GoodLife
- [ ] Numero ajoute dans Meta Business Manager
- [ ] `phone_number_id` recupere
- [ ] ClientConfig cree en base
- [ ] ExternalAccount cree en base
- [ ] Test webhook reussi

### Tests
- [ ] Login GoodLife OK
- [ ] Isolation multi-tenant OK
- [ ] Reception messages WhatsApp OK

---

## Credentials GoodLife (Reference)

| Champ | Valeur |
|-------|--------|
| Username | `goodlife.nexxaagents` |
| Password | `<credentials sécurisées - voir 1Password/vault>` |
| Role | USER |
| Account | GoodLife |
| Features | inbox, crm, analytics, channels, calendar, alerts |

---

## Support

Si probleme:
1. Verifie les logs Render
2. Verifie que les variables d'environnement sont bien definies
3. Verifie la connexion base de donnees
4. Teste le webhook manuellement avec le script: `npx tsx scripts/development/sign-whatsapp.ts`
