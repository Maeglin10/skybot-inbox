# GoodLife - Checklist du Matin 🌅

**Date :** 28 Janvier 2026
**Baptême du feu :** Première intégration client !

---

## 🎯 Objectif

Vérifier que le master router renvoie bien les messages WhatsApp de GoodLife vers leur inbox.

---

## ✅ Pré-requis (déjà fait hier soir)

- [x] Build Render OK
- [x] JWT_SECRET + SEED_SECRET_KEY dans Render
- [x] ClientConfig GoodLife créé
- [x] Compte GoodLife en base
- [x] User goodlife.nexxaagents créé
- [x] Calendrier désactivé pour GoodLife

---

## 📋 Étapes du matin (10 min max)

### 1. Vérifier Meta Business Manager (2 min)

**URL :** https://business.facebook.com
**App ID :** 1554026052411956

**Checklist :**
- [ ] Va dans WhatsApp > Numéros de téléphone
- [ ] Note le `phone_number_id` de Nexxa (si pas déjà fait)
- [ ] Vérifie que le webhook est actif (voyant vert)
- [ ] Status : `https://skybot-inbox.onrender.com/api/webhooks/whatsapp`

### 2. Ajouter le numéro GoodLife dans Meta (3 min)

**Quand GoodLife te donne leur numéro :**

1. **Dans Meta :** WhatsApp > Numéros de téléphone > "Ajouter un numéro"
2. **Entre le numéro** de GoodLife
3. **Vérifie le numéro** (code SMS envoyé à GoodLife)
4. **IMPORTANT :** Note le `phone_number_id` généré (ex: `573012345678`)
5. **Screenshot :** Prends une capture pour archiver

### 3. Configurer l'ExternalAccount (1 min)

**Sur ta machine locale :**

```bash
# Configure le phone_number_id dans la base
npm run setup:goodlife

# Quand demandé "As-tu le phone_number_id ?", réponds: y
# Entre le phone_number_id de GoodLife
# Exemple: 573012345678
```

**Le script va :**
- ✅ Créer ExternalAccount avec le phone_number_id
- ✅ Lier au compte GoodLife
- ✅ Activer le routing automatique

### 4. Vérifier le routing (1 min)

```bash
# Test complet du routing
npm run test:webhook-routing
```

**Tu dois voir :**
```
✅ ExternalAccounts WhatsApp: 2 (2 actifs)
   - Nexxa (phone_number_id: xxx)
   - GoodLife (phone_number_id: yyy)

✅ Routing configuré pour plusieurs comptes !
```

### 5. Test en production (3 min)

**Test 1 : Connexion**
- URL : https://skybot-inbox-ui.onrender.com
- Login : `goodlife.nexxaagents`
- Password : (vault)
- ✅ Connexion OK
- ✅ Dashboard vide (normal)
- ✅ Pas de calendrier visible

**Test 2 : Message WhatsApp**
- Demande à GoodLife d'envoyer un message test à leur numéro
- Message : "Test 123"
- Attends 5-10 secondes
- Rafraîchis l'inbox de GoodLife
- ✅ Message apparaît dans leur inbox

**Test 3 : Isolation**
- Se connecter avec `demo@skybot.com` / `DemoAdmin2024!`
- Vérifier qu'il ne voit PAS le message de GoodLife
- ✅ Isolation OK

---

## 🔍 Vérifications Meta (avant d'ajouter le numéro)

Va dans ton App Meta et vérifie :

### Webhook Configuration
```
Callback URL: https://skybot-inbox.onrender.com/api/webhooks/whatsapp
Verify Token: REDACTED_VERIFY_TOKEN
Subscribe to: messages
Status: Active ✅
```

### Numéros actuels
- [ ] Numéro Nexxa : `+506 7199 6544`
- [ ] Phone Number ID Nexxa : `895555790308240` (déjà dans .env)
- [ ] Numéro GoodLife : (à obtenir)
- [ ] Phone Number ID GoodLife : (à noter lors de l'ajout)

---

## 🚨 Troubleshooting

### Problème : Message n'arrive pas dans l'inbox

**Checklist :**
1. Vérifie les logs Render : https://dashboard.render.com > skybot-inbox > Logs
2. Cherche : `[WhatsApp Webhook]` dans les logs
3. Vérifie que le phone_number_id dans le webhook correspond à celui en base
4. Vérifie que ExternalAccount existe :
   ```bash
   npm run test:webhook-routing
   ```

### Problème : 401 Unauthorized

**Solution :**
- Vérifie JWT_SECRET dans Render > Environment
- Redeploy si nécessaire

### Problème : Message apparaît dans le mauvais compte

**Cause :** Mauvais phone_number_id dans ExternalAccount
**Solution :**
```bash
# Relance le setup et corrige le phone_number_id
npm run setup:goodlife
```

---

## 📊 Résumé du Flow

```
Message WhatsApp → Numéro GoodLife
   ↓
Meta envoie webhook → skybot-inbox.onrender.com/api/webhooks/whatsapp
   ↓
Webhook contient: { "from": "phone_number_id" }
   ↓
Backend cherche ExternalAccount avec ce phone_number_id
   ↓
Trouve Account GoodLife via ExternalAccount.accountId
   ↓
Route vers l'inbox de goodlife.nexxaagents
   ↓
✅ Message visible dans l'inbox GoodLife uniquement
```

---

## 🎉 Critères de succès

- [x] Numéro GoodLife ajouté dans Meta
- [x] Phone_number_id récupéré et noté
- [x] ExternalAccount créé en base
- [x] Test webhook routing : 2 comptes actifs
- [x] Message test reçu dans l'inbox GoodLife
- [x] Isolation multi-tenant OK
- [x] Pas de calendrier visible pour GoodLife

---

## 📞 Commands rapides

```bash
# Setup GoodLife avec phone_number_id
npm run setup:goodlife

# Test routing complet
npm run test:webhook-routing

# Test account GoodLife
npm run test:goodlife

# Disable calendar
npm run goodlife:disable-calendar
```

---

## 📚 Documentation de référence

- Setup complet : `docs/GOODLIFE_SETUP_MANUAL_STEPS.md`
- Quick start : `docs/GOODLIFE_QUICK_START.md`

---

**Bonne chance pour le baptême du feu ! 🔥🚀**
