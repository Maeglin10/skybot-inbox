# GoodLife Frontend Debug - Pour Antigravity

## 🎯 Problème

Le message de test créé en base de données **n'apparaît PAS** dans l'interface frontend pour le compte GoodLife, même si toutes les données sont présentes en base.

---

## ✅ Backend vérifié - Tout est OK

### 1. Données en base de données

```
✅ Account: Goodlife Costa Rica
   ID: cmkx1ivcf0000r38z098yk4rr

✅ User: goodlife.nexxaagents
   Email: ventas@goodlifecr.com
   Password: 4qFEZPjc8f (hashé avec bcrypt)
   Account ID: cmkx1ivcf0000r38z098yk4rr

✅ Inbox: WhatsApp GoodLife
   ID: cmky7ul5w0000p48z3zm4rmdu
   External ID: 60925012724039335

✅ Conversations: 1 conversation
   - Contact: Cliente Test (+50612345678)
   - Status: OPEN
   - Messages: 1 message
   - Texte: "🧪 Mensaje de prueba - SkyBot Inbox funcionando correctamente! ✅"
```

### 2. Routing vérifié

Le message de test est correctement routé vers le compte GoodLife :
- ✅ Message → Conversation → Inbox → Account GoodLife
- ✅ Isolation multi-tenant OK (le message n'est visible que par GoodLife)

---

## 🔌 Endpoints API à vérifier

### Base URL
```
https://skybot-inbox.onrender.com/api
```

### 1. Login

**Endpoint :**
```
POST /auth/login
```

**Body :**
```json
{
  "username": "goodlife.nexxaagents",
  "password": "4qFEZPjc8f"
}
```

**Réponse attendue :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "cmky5k2mz0000d08zzz99lnq6",
    "username": "goodlife.nexxaagents",
    "email": "ventas@goodlifecr.com",
    "accountId": "cmkx1ivcf0000r38z098yk4rr",
    "role": "USER"
  }
}
```

### 2. Récupérer les conversations

**Endpoint :**
```
GET /conversations
```

**Headers :**
```
Authorization: Bearer <accessToken>
```

**Query params (optionnel) :**
```
?inboxId=cmky7ul5w0000p48z3zm4rmdu
```

**Réponse attendue :**
```json
{
  "data": [
    {
      "id": "cmky7ul660002p48zcqseepn4",
      "status": "OPEN",
      "contact": {
        "id": "...",
        "name": "Cliente Test",
        "phone": "+50612345678"
      },
      "lastMessage": {
        "text": "🧪 Mensaje de prueba - SkyBot Inbox funcionando correctamente! ✅",
        "timestamp": "2026-01-28T..."
      }
    }
  ]
}
```

### 3. Messages d'une conversation

**Endpoint :**
```
GET /conversations/cmky7ul660002p48zcqseepn4/messages
```

**Headers :**
```
Authorization: Bearer <accessToken>
```

---

## 🔍 Checklist de débogage Frontend

### 1. Vérifier le login
- [ ] Le POST `/auth/login` retourne-t-il un token JWT ?
- [ ] Le token est-il stocké (localStorage, cookie, etc.) ?
- [ ] Le `user.accountId` est-il correct ? → `cmkx1ivcf0000r38z098yk4rr`

### 2. Vérifier l'appel conversations
- [ ] Le GET `/conversations` est-il appelé après le login ?
- [ ] L'header `Authorization: Bearer <token>` est-il présent ?
- [ ] La réponse contient-elle bien 1 conversation ?

### 3. Vérifier le filtering
- [ ] Le frontend filtre-t-il par `accountId` ?
- [ ] Le frontend filtre-t-il par `inboxId` ?
- [ ] Y a-t-il un filtre qui masque les conversations de test ?

### 4. Vérifier l'affichage
- [ ] Le composant conversations/inbox affiche-t-il les données reçues ?
- [ ] Y a-t-il des conditions d'affichage qui bloquent ?
- [ ] Les données sont-elles visibles dans React DevTools ?

---

## 🧪 Test Manuel via Browser DevTools

### Ouvrir les DevTools
1. F12 ou Cmd+Option+I
2. Onglet **Network**

### Test de login
1. Se connecter avec `goodlife.nexxaagents` / `4qFEZPjc8f`
2. Chercher la requête **POST auth/login**
3. Vérifier la réponse → doit contenir `accessToken`

### Test conversations
1. Chercher la requête **GET conversations**
2. Vérifier la réponse → doit contenir 1 conversation
3. Si vide → problème de routing backend
4. Si présent mais pas affiché → problème frontend

---

## 🐛 Problèmes potentiels Frontend

### 1. Filtrage par accountId manquant
Le frontend doit filtrer par `user.accountId` pour l'isolation multi-tenant.

**Code à vérifier :**
```typescript
// Le fetch doit inclure l'accountId de l'utilisateur connecté
const response = await fetch('/api/conversations', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

Le backend utilise le JWT pour extraire l'accountId automatiquement via le guard.

### 2. Condition d'affichage des conversations
Vérifier qu'il n'y a pas de condition comme :
```typescript
// ❌ Mauvais
if (conversations.length > 5) {
  return <ConversationList data={conversations} />
}

// ✅ Bon
if (conversations.length > 0) {
  return <ConversationList data={conversations} />
}
```

### 3. Problème de cache/état
Le frontend peut avoir un cache qui ne se rafraîchit pas :
```typescript
// Vérifier qu'il y a un refetch ou invalidation
useEffect(() => {
  fetchConversations();
}, [user, inboxId]);
```

---

## ✅ Confirmation Backend

Pour confirmer que le backend fonctionne, tu peux tester avec curl :

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://skybot-inbox.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"goodlife.nexxaagents","password":"4qFEZPjc8f"}' \
  | jq -r '.accessToken')

# 2. Get conversations
curl -s "https://skybot-inbox.onrender.com/api/conversations" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Si cette commande retourne la conversation, alors **le backend est 100% OK** et c'est un problème frontend.

---

## 📞 IDs importants

```
Account ID:      cmkx1ivcf0000r38z098yk4rr
User ID:         cmky5k2mz0000d08zzz99lnq6
Inbox ID:        cmky7ul5w0000p48z3zm4rmdu
Conversation ID: cmky7ul660002p48zcqseepn4
Message ID:      cmky7ul690003p48zo7s0g1a0
```

---

## 🚀 Prochaine étape

Antigravity doit :
1. Vérifier que le frontend appelle bien GET `/conversations` avec le token JWT
2. Vérifier que la réponse contient bien la conversation de test
3. Si oui → déboguer l'affichage des conversations dans le composant React
4. Si non → vérifier le routing/filtering dans le frontend
