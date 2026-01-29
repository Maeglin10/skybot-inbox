# 🔄 Synchronisation DB Production - Guide

## Vue d'ensemble

Ce guide explique comment synchroniser la base de données de production (Render) avec les données nécessaires pour que SkyBot Inbox fonctionne correctement pour GoodLife.

---

## Problème

**Symptôme:** Les fonctionnalités ne marchent pas en production alors qu'elles fonctionnent en local.

**Cause:** La DB production n'a pas les données nécessaires (inbox, corporate contacts, etc.)

**Solution:** Utiliser le script `sync-production-db.ts` pour synchroniser la DB.

---

## Étapes de Synchronisation

### 1. Récupérer l'URL de la DB Render

1. Va sur [https://dashboard.render.com](https://dashboard.render.com)
2. Clique sur ta database **skybot-inbox-db**
3. Dans l'onglet **Connections**, copie l'**External Database URL**
4. Elle ressemble à:
   ```
   postgresql://user:password@host.region.render.com:5432/dbname
   ```

### 2. Exécuter le script de synchronisation

```bash
# À la racine du projet skybot-inbox (backend)
DATABASE_URL="<ton_url_render>" npx tsx scripts/sync-production-db.ts
```

**Exemple:**
```bash
DATABASE_URL="postgresql://skybot_xyz:abc123@dpg-xyz.oregon-postgres.render.com:5432/skybot_inbox_xyz" npx tsx scripts/sync-production-db.ts
```

### 3. Vérifier les résultats

Le script affichera:
```
🔄 SYNCHRONISATION DB PRODUCTION

============================================================

📊 1. Account GoodLife
------------------------------------------------------------
✅ Account existe: Goodlife Costa Rica (cmkxxx...)

👤 2. User goodlife.nexxaagents
------------------------------------------------------------
✅ User existe: ventas@goodlifecr.com (cmkyyy...)

📋 3. ClientConfig
------------------------------------------------------------
✅ ClientConfig existe: goodlife (cmkzzz...)

📥 4. Inbox WhatsApp
------------------------------------------------------------
✅ Inbox créé: cmkabc...
   External ID: 966520989876579

🔗 5. ExternalAccount (WhatsApp routing)
------------------------------------------------------------
✅ ExternalAccount créé: cmkdef...

🏢 6. Corporate Contacts
------------------------------------------------------------
✅ Corporate contacts: 16 créés, 0 existants
   Total: 16/16

⚙️  7. User Preferences
------------------------------------------------------------
✅ User preferences créées

============================================================
✅ SYNCHRONISATION TERMINÉE

Résumé:
  Account ID: cmkxxx...
  User ID: cmkyyy...
  Inbox ID: cmkabc...
  ExternalAccount ID: cmkdef...
  Corporate Contacts: 16

La DB production est maintenant synchronisée! 🎉
```

---

## Ce que le Script Crée/Vérifie

### ✅ Account GoodLife
- Nom: "Goodlife Costa Rica"
- Domain: "goodlifecr.com"
- Status: ACTIVE

### ✅ User
- Email: ventas@goodlifecr.com
- Username: goodlife.nexxaagents
- Password: (hashé avec bcrypt)
- Role: USER

### ✅ ClientConfig
- Client Key: "goodlife"
- Channels: ["WHATSAPP"]
- Status: ACTIVE

### ✅ Inbox WhatsApp
- Name: "WhatsApp GoodLife"
- Channel: WHATSAPP
- External ID: 966520989876579 (Phone Number ID)

### ✅ ExternalAccount
- Channel: WHATSAPP
- External ID: 966520989876579
- Client Key: "goodlife"
- **Rôle:** Route les webhooks WhatsApp vers le bon account

### ✅ Corporate Contacts (16 contacts)
Liste complète dans le script avec:
- Brandon Cookhorn Etiplast
- Yeudy Araya Herrera
- Erick Marchena
- Michael Streda
- Goodlife Lindora
- Goodlife Santa Ana
- Yenci Benavides Etiquetas
- Helen Valverde Sport City Curri
- Vivian Villegas SportCity Curri
- Isabel Mesén Sport City Curri
- Wendy Vargas Etiplast
- Rosy Bolanos Jacks
- Tatiana Alfaro Alajuela
- Adriana Rojas Alajuela
- Alejandra Villalobos Multiplaza
- Gabriela Torres Forum

### ✅ User Preferences
- Theme: DEFAULT
- Language: ES
- Timezone: America/Costa_Rica

---

## Sécurité

Le script est **idempotent**:
- ✅ N'écrase JAMAIS les données existantes
- ✅ Ne crée que les données manquantes
- ✅ Peut être exécuté plusieurs fois sans danger
- ✅ Met à jour seulement les champs nécessaires (ex: externalId de l'inbox)

---

## Après la Synchronisation

### 1. Vérifier que le backend a redémarré

Render redémarre automatiquement après un push. Attends 2-3 minutes puis vérifie:

```bash
curl https://skybot-inbox.onrender.com/api/health
```

Devrait retourner:
```json
{"status":"ok","service":"skybot-inbox","timestamp":"..."}
```

### 2. Tester les endpoints

#### Login
```bash
curl -X POST https://skybot-inbox.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"goodlife.nexxaagents","password":"4qFEZPjc8f"}'
```

#### Corporate Alerts (avec le token du login)
```bash
curl https://skybot-inbox.onrender.com/api/corporate-alerts \
  -H "Authorization: Bearer <token>"
```

Devrait retourner les 16 contacts corporate.

### 3. Tester dans l'interface

1. Va sur ton frontend (ex: skybot-inbox-ui.onrender.com)
2. Login avec **goodlife.nexxaagents** / **4qFEZPjc8f**
3. Va dans **Alerts > Corporativo**
4. Tu devrais voir les 16 contacts corporate ✅

---

## Troubleshooting

### Erreur: "Cannot connect to database"

**Cause:** L'URL de la DB est incorrecte ou la DB n'est pas accessible.

**Solution:**
- Vérifie que tu as copié l'**External Database URL** (pas Internal)
- Vérifie que la DB est bien démarrée sur Render
- Essaie de te connecter avec `psql` pour vérifier:
  ```bash
  psql "postgresql://user:pass@host:5432/dbname"
  ```

### Le script dit "✅ Inbox existe" mais l'External ID est faux

**Cause:** L'inbox existe avec un ancien phone_number_id.

**Solution:** Le script met automatiquement à jour l'External ID. Tu verras:
```
⚠️  Mise à jour External ID: ancien_id → 966520989876579
✅ External ID mis à jour
```

### Les corporate contacts ne s'affichent toujours pas

**Vérifications:**

1. **Le backend est-il redémarré?**
   ```bash
   curl https://skybot-inbox.onrender.com/api/health
   ```

2. **L'endpoint fonctionne-t-il?**
   ```bash
   # Login
   TOKEN=$(curl -s -X POST https://skybot-inbox.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"goodlife.nexxaagents","password":"4qFEZPjc8f"}' \
     | jq -r '.accessToken')

   # Test corporate alerts
   curl -s "https://skybot-inbox.onrender.com/api/corporate-alerts" \
     -H "Authorization: Bearer $TOKEN" | jq '.'
   ```

3. **Le frontend utilise-t-il le bon endpoint?**
   - Vérifie que `alertsAdapter.ts` appelle `/corporate-alerts`
   - Vérifie les logs réseau dans Chrome DevTools

---

## Scripts d'Audit Disponibles

### Audit complet via API
```bash
npx tsx scripts/audit-production-api.ts
```
Teste tous les endpoints et affiche les résultats.

### Audit direct de la DB
```bash
DATABASE_URL="<render_url>" npx tsx scripts/audit-production-db.ts
```
Inspecte directement la DB et affiche toutes les données.

### Vérifier External Account
```bash
DATABASE_URL="<render_url>" npx tsx scripts/check-external-account.ts
```
Vérifie la configuration WhatsApp routing.

---

## Maintenance

### Quand re-synchroniser?

Re-exécute le script de sync si:
- ✅ Tu ajoutes un nouveau contact corporate
- ✅ Tu changes le phone_number_id WhatsApp
- ✅ Tu reset la DB de production
- ✅ Un utilisateur signale que des données sont manquantes

### Script régulier

Tu peux ajouter ce script dans ton workflow CI/CD pour synchroniser automatiquement après chaque déploiement.

---

## Support

Si tu rencontres des problèmes:

1. Vérifie d'abord le rapport d'audit: `PRODUCTION-AUDIT-REPORT.md`
2. Lance l'audit API: `npx tsx scripts/audit-production-api.ts`
3. Vérifie les logs Render: https://dashboard.render.com > skybot-inbox > Logs

---

## Résumé

```bash
# 1. Récupérer l'URL DB Render
# 2. Exécuter le script
DATABASE_URL="<ton_url>" npx tsx scripts/sync-production-db.ts

# 3. Vérifier
curl https://skybot-inbox.onrender.com/api/health

# 4. Tester
npx tsx scripts/audit-production-api.ts
```

✅ DB synchronisée = Plateforme fonctionnelle ! 🎉
