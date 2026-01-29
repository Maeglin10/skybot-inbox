# Guide de Test WhatsApp - GoodLife

**Date**: 2026-01-29
**Status**: Numéro mis à jour ✅
**Phone Number ID**: `966520989876579`

---

## ✅ Configuration Actuelle

### Variables d'Environnement (.env)
```bash
WHATSAPP_ACCESS_TOKEN=EAAWFYOLTYjQBQulGjUOH... ✅
WHATSAPP_PHONE_NUMBER_ID=966520989876579        ✅
WHATSAPP_BUSINESS_NUMBER=50660213707            ✅
WHATSAPP_APP_SECRET=***                         ✅
WHATSAPP_VERIFY_TOKEN=***                       ✅
```

### Base de Données
```
✅ Account: Goodlife Costa Rica
✅ Inbox: WhatsApp GoodLife
   - External ID: 966520989876579 (mis à jour)
   - 17 conversations existantes
✅ ClientConfig: goodlife (ACTIVE)
```

### Webhook Meta
```
✅ URL: https://skybot-inbox.onrender.com/api/webhooks/whatsapp
✅ Verify Token: configuré
✅ Subscriptions: messages, message_status
```

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier le Webhook (GET)

**Ce que Meta fait pour vérifier le webhook:**

```bash
# Simulation de la requête GET de Meta
curl "https://skybot-inbox.onrender.com/api/webhooks/whatsapp?\
hub.mode=subscribe&\
hub.verify_token=REDACTED_VERIFY_TOKEN&\
hub.challenge=test123"
```

**Résultat attendu:**
```
test123
```

Si ça retourne le challenge, le webhook est **valide** ✅

---

### Test 2: Envoyer un Message WhatsApp

**Action:**
1. Depuis votre téléphone
2. Envoyez un message WhatsApp à: **+506 6021 3707**
3. Message de test: `Hello SkyBot!`

**Vérification Backend (Logs Render):**

Allez sur: https://dashboard.render.com/web/srv-xxx/logs

Cherchez:
```
✅ [WEBHOOK] Received WhatsApp webhook
✅ [WEBHOOK] Message from: +506XXXXXXXX
✅ [WEBHOOK] Text: Hello SkyBot!
✅ [WEBHOOK] Conversation created/found
✅ [WEBHOOK] Message saved to database
```

---

### Test 3: Vérifier en Base de Données

```bash
npx ts-node scripts/check-whatsapp-config.ts
```

**Résultat attendu:**
```
✅ Account: Goodlife Costa Rica
✅ Inbox: WhatsApp GoodLife (External ID: 966520989876579)
✅ Conversations: 18 (ou plus si message reçu)
```

---

### Test 4: API - Récupérer les Conversations

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://skybot-inbox.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"goodlife-admin","password":"4qFEZPjc8f"}' \
  | jq -r '.accessToken')

# 2. Get conversations
curl -s "https://skybot-inbox.onrender.com/api/conversations" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
```

**Résultat attendu:**
```
18  # (ou plus si nouveau message)
```

---

### Test 5: Frontend - Voir le Message

1. **Allez sur**: https://skybot-inbox-ui.onrender.com
2. **Login**:
   - Username: `goodlife-admin`
   - Password: `4qFEZPjc8f`
3. **Vérifiez**:
   - La conversation apparaît dans l'inbox
   - Le message est visible
   - Le contact s'affiche correctement

---

## 🐛 Debugging

### Problème: Le webhook ne reçoit rien

**Vérifications:**

1. **Le webhook est-il accessible?**
   ```bash
   curl https://skybot-inbox.onrender.com/api/health
   # Doit retourner: {"status":"ok"}
   ```

2. **Le verify_token est-il correct?**
   - Comparez `WHATSAPP_VERIFY_TOKEN` dans .env
   - Avec celui configuré sur Meta

3. **Les logs Render montrent-ils des erreurs?**
   - Cherchez: `[WEBHOOK]`, `[ERROR]`, `WhatsApp`

---

### Problème: Message reçu mais pas en base

**Vérifications:**

1. **L'External ID est-il correct?**
   ```bash
   npx ts-node scripts/check-whatsapp-config.ts
   ```

   Le Phone Number ID doit correspondre:
   - `.env`: `966520989876579`
   - DB Inbox: `966520989876579`
   - Meta: `966520989876579`

2. **Vérifiez les logs:**
   ```
   ✅ [WEBHOOK] Received
   ✅ [WEBHOOK] Parsed
   ❌ [ERROR] Cannot find inbox for phone_number_id
   ```

   Si cette erreur → Le Phone Number ID ne match pas

---

### Problème: Message en base mais pas dans le frontend

**Vérifications:**

1. **L'API retourne-t-elle les conversations?**
   ```bash
   # Avec le token JWT de l'utilisateur connecté
   curl -H "Authorization: Bearer $TOKEN" \
     https://skybot-inbox.onrender.com/api/conversations
   ```

2. **Le frontend appelle-t-il l'API?**
   - Ouvrir DevTools (F12)
   - Onglet Network
   - Chercher: `GET conversations`
   - Vérifier la réponse

3. **Isolation multi-tenant OK?**
   - L'utilisateur est-il connecté avec le bon accountId?
   - Le JWT contient-il `accountId: cmkx1ivcf0000r38z098yk4rr`?

---

## 📊 Endpoints de Debug

### Debug Webhook (sans vérification signature)

```bash
curl -X POST https://skybot-inbox.onrender.com/api/webhooks/whatsapp/debug \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "966520989876579",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "phone_number_id": "966520989876579"
          },
          "messages": [{
            "from": "50612345678",
            "id": "wamid.test123",
            "timestamp": "1738161234",
            "type": "text",
            "text": {
              "body": "Test message from debug endpoint"
            }
          }]
        }
      }]
    }]
  }'
```

**Résultat attendu:**
```json
{
  "received": true,
  "processed": true
}
```

---

## 🎯 Checklist Finale

### Configuration
- [x] Phone Number ID mis à jour en base: `966520989876579`
- [x] Token d'accès permanent configuré
- [x] Webhook configuré sur Meta
- [x] Variables d'environnement à jour

### Tests
- [ ] Test 1: GET webhook verification ✓
- [ ] Test 2: Envoyer message WhatsApp
- [ ] Test 3: Message visible en base
- [ ] Test 4: API retourne conversation
- [ ] Test 5: Frontend affiche message

### Production
- [ ] Logs Render montrent réception webhook
- [ ] Aucune erreur de routing
- [ ] Isolation multi-tenant OK
- [ ] Messages s'affichent dans l'UI

---

## 🆘 En Cas de Problème

1. **Vérifier les logs Render en temps réel**
   ```
   https://dashboard.render.com/web/srv-xxx/logs
   ```

2. **Tester avec l'endpoint debug**
   ```bash
   curl -X POST .../api/webhooks/whatsapp/debug -d '{...}'
   ```

3. **Vérifier la config**
   ```bash
   npx ts-node scripts/check-whatsapp-config.ts
   ```

4. **Comparer Phone Number IDs**
   - Meta Dashboard
   - .env local
   - Base de données
   - Logs webhook

---

## 📞 Support

Si le webhook ne fonctionne toujours pas:
1. Vérifiez que le service Render est UP
2. Vérifiez que la base de données est accessible
3. Testez avec le numéro de test Meta d'abord
4. Puis avec votre numéro production

**Le numéro de test Meta**: Disponible dans Meta Developers > WhatsApp > API Setup > "Phone numbers" (test number)
