# 🔐 SSO Testing Guide

Le système SSO complet est maintenant implémenté ! Voici comment tester chaque fonctionnalité.

## ✅ Implémenté

- ✅ JWT Authentication (register, login, refresh)
- ✅ Google OAuth 2.0
- ✅ Magic Links (passwordless login)
- ✅ Route protection with guards
- ✅ Public routes decorator

## 📋 Endpoints Disponibles

### 1. Register (JWT)

```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "accountId": "<get-from-db>"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "cm...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "USER",
    "accountId": "..."
  }
}
```

### 2. Login (JWT)

```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Refresh Token

```bash
POST http://localhost:3001/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response**:
```json
{
  "accessToken": "new_access_token..."
}
```

### 4. Get Current User (Protected Route)

```bash
GET http://localhost:3001/api/auth/me
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "id": "cm...",
  "email": "test@example.com",
  "accountId": "...",
  "role": "USER"
}
```

### 5. Request Magic Link

```bash
POST http://localhost:3001/api/auth/magic-link
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response**:
```json
{
  "message": "If an account exists, a magic link has been sent to your email"
}
```

**Check console** pour voir le token généré :
```
🔗 Magic link token for test@example.com: abc123...
🔗 Expires at: 2026-01-24T...
```

### 6. Verify Magic Link

```bash
GET http://localhost:3001/api/auth/magic-link/verify?email=test@example.com&token=abc123...
```

**Response** : Same as login (access + refresh tokens)

### 7. Google OAuth Login

**Dans le navigateur** :
```
http://localhost:3001/api/auth/google
```

→ Redirects to Google login
→ Après auth, redirects vers `http://localhost:3000/auth/callback?accessToken=...&refreshToken=...`

### 8. Logout

```bash
POST http://localhost:3001/api/auth/logout
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

## 🧪 Tests avec cURL

### Test 1: Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "password123",
    "name": "New User",
    "accountId": "YOUR_ACCOUNT_ID"
  }'
```

### Test 2: Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "password123"
  }'
```

### Test 3: Access Protected Route

```bash
# Remplace ACCESS_TOKEN par le token reçu du login
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Test 4: Magic Link Flow

```bash
# 1. Request magic link
curl -X POST http://localhost:3001/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@test.com"}'

# 2. Check server console for token, then verify
curl -X GET "http://localhost:3001/api/auth/magic-link/verify?email=newuser@test.com&token=TOKEN_FROM_CONSOLE"
```

## 🔐 Configuration Requise

### Variables d'Environnement (.env)

```bash
# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Pour Google OAuth

1. Va sur [Google Cloud Console](https://console.cloud.google.com/)
2. Crée un nouveau projet ou sélectionne un projet existant
3. Active **Google+ API**
4. Va dans **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure :
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`
6. Copie `Client ID` et `Client Secret` dans ton `.env`

## 🛡️ Protection des Routes

Le guard JWT est appliqué **globalement** sur toutes les routes. Pour rendre une route publique :

```typescript
import { Public } from './auth/decorators/public.decorator';

@Public()
@Get('some-public-route')
async publicRoute() {
  return { message: 'This is public' };
}
```

## 🧑‍💻 Utilisation dans les Contrôleurs

### Obtenir l'utilisateur connecté

```typescript
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Get('profile')
async getProfile(@CurrentUser() user: any) {
  console.log(user); // { id, email, accountId, role }
  return { user };
}
```

## 📊 Données Créées Automatiquement

Lors du register ou Google OAuth, le système crée automatiquement :

1. **UserAccount** dans la DB
2. **UserPreference** avec valeurs par défaut :
   - theme: DEFAULT
   - language: EN
   - timezone: UTC
   - dateFormat: YYYY-MM-DD
   - timeFormat: 24h

## 🚀 Prochaines Étapes

1. **Frontend Integration** :
   - Créer formulaire de login/register
   - Stocker tokens dans localStorage
   - Implémenter auto-refresh des tokens
   - Gérer les redirections OAuth

2. **Email Service** :
   - Intégrer un service d'emails (SendGrid, Mailgun, etc.)
   - Envoyer les magic links par email au lieu de console.log

3. **Production** :
   - Changer JWT_SECRET et JWT_REFRESH_SECRET
   - Configurer Google OAuth avec domaine production
   - Activer HTTPS
   - Implémenter rate limiting sur /auth endpoints

## ⚠️ Notes Importantes

- Les access tokens expirent en **15 minutes**
- Les refresh tokens expirent en **7 jours**
- Les magic links expirent en **15 minutes**
- Tous les endpoints /auth/* sont **publics** sauf `/auth/me`
- Les tokens sont **stateless** (pas stockés en DB, seulement signés avec JWT)
