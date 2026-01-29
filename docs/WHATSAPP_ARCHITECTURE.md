# Architecture WhatsApp Business - Explication Complète

## 🔍 Différence entre Token et Compte WhatsApp Business

### 1️⃣ Le Compte WhatsApp Business (sur Meta)

**C'est VOTRE compte sur Meta Business Manager qui contient:**

```
📱 Compte WhatsApp Business
├── 🏢 Business Manager (Meta)
│   ├── App Meta (ID: votre_app_id)
│   │   ├── App Secret (pour sécurité)
│   │   └── Webhooks configurés
│   │
│   ├── 📞 Numéro WhatsApp Business
│   │   ├── Phone Number ID (ex: 123456789)
│   │   ├── Display Name (ex: "GoodLife")
│   │   └── Profile Picture
│   │
│   └── 🔑 Tokens d'Accès
│       ├── Token Temporaire (60 jours)
│       └── Token Permanent (celui que vous avez fourni ✅)
```

### 2️⃣ Le Token d'Accès (WHATSAPP_ACCESS_TOKEN)

**C'est une CLÉ qui permet à SkyBot Inbox de parler à Meta:**

```
┌─────────────────┐                    ┌──────────────────┐
│  SkyBot Inbox   │                    │   Meta Graph API │
│                 │                    │                  │
│  "Je veux       │  ──Token──>       │  "Token valide?  │
│   envoyer un    │  <──OK────        │   ✅ Oui, vas-y" │
│   message"      │                    │                  │
└─────────────────┘                    └──────────────────┘
```

**Le token sert à:**
- ✅ Authentifier les requêtes vers Meta
- ✅ Envoyer des messages WhatsApp
- ✅ Télécharger des médias reçus
- ✅ Publier des stories WhatsApp
- ✅ Gérer le profil business

**Le token NE sert PAS à:**
- ❌ Recevoir des messages (ça c'est le webhook)
- ❌ Remplacer le compte WhatsApp

---

## 🏗️ Architecture Complète

```
┌─────────────────────────────────────────────────────────────┐
│                     META BUSINESS MANAGER                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  WhatsApp Business Account                             │ │
│  │  ├── Numéro: +506 6021 3707 (exemple)                 │ │
│  │  ├── Phone Number ID: 60925012724039335                │ │
│  │  └── Display Name: GoodLife                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Meta App                                              │ │
│  │  ├── App ID: votre_app_id                             │ │
│  │  ├── App Secret: WHATSAPP_APP_SECRET                  │ │
│  │  └── Webhook URL: https://skybot-inbox.onrender.com/  │ │
│  │      api/webhooks/whatsapp                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Access Token (permanent)                              │ │
│  │  EAAWFY... (celui que vous avez fourni)               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Webhook POST
                           │ (client envoie message)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SKYBOT INBOX (Backend)                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Webhook Receiver                                        ││
│  │ POST /api/webhooks/whatsapp                             ││
│  │ ├── Vérifie signature (WHATSAPP_APP_SECRET)            ││
│  │ ├── Parse le message                                    ││
│  │ ├── Sauvegarde en DB                                    ││
│  │ └── Envoie à N8N si configuré                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Message Sender                                          ││
│  │ POST to Meta Graph API                                  ││
│  │ ├── Utilise WHATSAPP_ACCESS_TOKEN                      ││
│  │ ├── Phone Number ID: 60925012724039335                 ││
│  │ └── Envoie le message au client                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Variables d'Environnement WhatsApp

### Ce que vous DEVEZ configurer:

```bash
# 1. Token d'accès (pour ENVOYER des messages)
WHATSAPP_ACCESS_TOKEN=EAAWFYOLTYjQBQulGjUOH... ✅ Vous l'avez fourni

# 2. App Secret (pour VÉRIFIER les webhooks entrants)
WHATSAPP_APP_SECRET=votre_app_secret_meta      ⚠️ À configurer

# 3. Token de vérification (pour ACTIVER le webhook)
WHATSAPP_VERIFY_TOKEN=votre_token_secret       ⚠️ À configurer

# 4. Phone Number ID (pour identifier QUEL numéro utiliser)
# Pas dans .env actuellement, mais devrait être ajouté
WHATSAPP_PHONE_NUMBER_ID=60925012724039335     ⚠️ À ajouter
```

---

## 📋 Checklist Configuration WhatsApp

### Sur Meta Business Manager:

- [ ] **Créer l'App Meta** (si pas déjà fait)
- [ ] **Connecter le numéro WhatsApp Business**
- [ ] **Générer le Token Permanent** ✅ (vous l'avez)
- [ ] **Configurer le Webhook URL**
  - URL: `https://skybot-inbox.onrender.com/api/webhooks/whatsapp`
  - Verify Token: Le même que `WHATSAPP_VERIFY_TOKEN` dans .env
- [ ] **Activer les Subscriptions**
  - messages
  - message_status
  - message_reactions (optionnel)

### Dans SkyBot Inbox:

- [x] **Token d'accès configuré** ✅ (dans .env)
- [ ] **App Secret configuré** (dans .env et Render)
- [ ] **Verify Token configuré** (dans .env et Render)
- [ ] **Phone Number ID ajouté** (dans .env et Render)

---

## 🧪 Comment Tester

### 1. Test Webhook (Réception)
```bash
# Envoyez un message à votre numéro WhatsApp Business
# depuis votre téléphone
# Le webhook devrait recevoir:

curl https://skybot-inbox.onrender.com/api/webhooks/whatsapp/debug \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456",
      "changes": [{
        "value": {
          "messages": [{
            "from": "50612345678",
            "text": {"body": "Test"}
          }]
        }
      }]
    }]
  }'
```

### 2. Test Envoi de Message
```bash
# Depuis SkyBot Inbox vers un client
# Nécessite WHATSAPP_ACCESS_TOKEN ✅

curl -X POST "https://graph.facebook.com/v19.0/60925012724039335/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "50612345678",
    "type": "text",
    "text": {"body": "Hello from SkyBot!"}
  }'
```

---

## 💡 En Résumé

| Élément | Rôle | Où le trouver |
|---------|------|---------------|
| **Compte WhatsApp Business** | Le compte Meta qui possède le numéro | Meta Business Manager |
| **WHATSAPP_ACCESS_TOKEN** | Clé pour envoyer des messages | Meta Business Manager > Tokens ✅ |
| **WHATSAPP_APP_SECRET** | Clé pour vérifier les webhooks | Meta App Dashboard > Settings |
| **WHATSAPP_PHONE_NUMBER_ID** | ID du numéro à utiliser | Meta Business Manager > WhatsApp > Phone Numbers |
| **WHATSAPP_VERIFY_TOKEN** | Token secret pour activer webhook | Vous le créez (random string) |

**Le token que vous avez fourni permet à SkyBot Inbox de SE CONNECTER à votre compte WhatsApp Business sur Meta, mais ce n'est PAS le compte lui-même.**

---

## 🎯 Prochaines Étapes

1. **Vérifier sur Meta** que tous les éléments sont configurés
2. **Ajouter les variables manquantes** dans .env et Render
3. **Configurer le webhook** sur Meta (pointer vers SkyBot Inbox)
4. **Tester l'envoi et la réception** de messages

Voulez-vous que je vous aide à trouver ces informations sur Meta Business Manager?
