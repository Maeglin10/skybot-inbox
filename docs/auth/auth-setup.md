# 🔐 Authentication & SSO Setup Guide

## 📋 Overview

Ce guide explique comment mettre en place l'authentification complète avec SSO (Single Sign-On) pour SkyBot Inbox.

---

## 🎯 Stratégies d'Authentification

### 1. **JWT (JSON Web Tokens)** ✅ Base
- Tokens signés pour sessions
- Access token (15 min) + Refresh token (7 jours)
- Stockés en HTTP-only cookies

### 2. **Google OAuth 2.0** ✅ SSO
- Login avec compte Google
- Pas besoin de mot de passe
- Auto-création du UserAccount

### 3. **Magic Links** ⏳ À implémenter
- Email passwordless
- Token unique valide 15 minutes
- Parfait pour onboarding

---

## 🏗️ Architecture

```
Frontend (Next.js)
    ↓
POST /auth/login (email + password)
    ↓
Backend vérif credentials
    ↓
Génère JWT access + refresh tokens
    ↓
Retourne tokens + user info
    ↓
Frontend stocke dans cookies HTTP-only
```

---

## 📦 Dépendances Installées

```bash
✅ @nestjs/passport
✅ @nestjs/jwt
✅ passport
✅ passport-google-oauth20
✅ passport-jwt
✅ bcrypt
```

---

## 🔨 Structure des Fichiers

```
src/auth/
├── auth.module.ts           # Module principal
├── auth.service.ts          # Logique auth (login, register, etc.)
├── auth.controller.ts       # Endpoints (/login, /register, /google, etc.)
├── strategies/
│   ├── jwt.strategy.ts      # Passport JWT strategy
│   └── google.strategy.ts   # Passport Google OAuth strategy
├── guards/
│   ├── jwt-auth.guard.ts    # Guard pour protéger routes
│   └── google-auth.guard.ts # Guard pour Google OAuth
└── dto/
    ├── login.dto.ts         # { email, password }
    ├── register.dto.ts      # { email, password, name }
    └── tokens.dto.ts        # { accessToken, refreshToken }
```

---

## 🚀 Endpoints à Implémenter

### **Auth Endpoints**

#### `POST /auth/register`
```typescript
Body: {
  email: string;
  password: string;
  name: string;
  accountId: string; // Account à rattacher
}

Response: {
  user: UserAccount;
  accessToken: string;
  refreshToken: string;
}
```

#### `POST /auth/login`
```typescript
Body: {
  email: string;
  password: string;
}

Response: {
  user: UserAccount;
  accessToken: string;
  refreshToken: string;
}
```

#### `POST /auth/refresh`
```typescript
Headers: {
  Authorization: "Bearer <refreshToken>"
}

Response: {
  accessToken: string;
}
```

#### `POST /auth/logout`
```typescript
Response: {
  success: true;
}
```

---

### **Google OAuth Endpoints**

#### `GET /auth/google`
- Redirige vers Google login page
- Callback: `GET /auth/google/callback`

#### `GET /auth/google/callback`
```typescript
Query: {
  code: string; // Google auth code
}

Response: {
  user: UserAccount;
  accessToken: string;
  refreshToken: string;
}
```

---

## 🔐 JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;        // userAccountId
  email: string;
  accountId: string;  // Business account
  role: 'ADMIN' | 'USER';
  iat: number;        // Issued at
  exp: number;        // Expires at
}
```

---

## 🛡️ Protéger les Routes

### **Avec JWT Guard**

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/crm')
@UseGuards(JwtAuthGuard) // Protège toutes les routes
export class CrmController {
  @Get('leads')
  async getLeads(@Req() req) {
    const user = req.user; // JwtPayload automatiquement injecté
    return this.crmService.getLeads(user.accountId);
  }
}
```

---

## ⚙️ Configuration

### **Variables d'Environnement**

Ajouter dans `.env` et `.env.production.example` :

```bash
# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.nexxa.com/auth/google/callback

# Frontend URL (for redirects)
FRONTEND_URL=https://dashboard.nexxa.com
```

---

## 🔧 Google OAuth Setup

### **1. Créer un projet Google Cloud**

1. Va sur https://console.cloud.google.com
2. Crée un nouveau projet "SkyBot Inbox"
3. Active l'API "Google+ API"

### **2. Créer OAuth Credentials**

1. Va dans "APIs & Services" → "Credentials"
2. Crée "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Authorized redirect URIs:
   - Development: `http://localhost:3001/auth/google/callback`
   - Production: `https://api.nexxa.com/auth/google/callback`

5. Copie `Client ID` et `Client Secret` dans `.env`

---

## 📝 Exemple d'Implémentation

### **auth.service.ts**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string, accountId: string) {
    // 1. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Create user
    const user = await this.prisma.userAccount.create({
      data: {
        accountId,
        email,
        passwordHash,
        name,
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // 3. Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    // 1. Find user
    const user = await this.prisma.userAccount.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      accountId: user.accountId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async validateGoogleUser(profile: any) {
    // 1. Check if user exists
    let user = await this.prisma.userAccount.findFirst({
      where: { email: profile.email },
    });

    // 2. Create if doesn't exist
    if (!user) {
      const demoAccount = await this.prisma.account.findFirst({
        where: { isDemo: true },
      });

      user = await this.prisma.userAccount.create({
        data: {
          accountId: demoAccount.id,
          email: profile.email,
          name: profile.displayName,
          avatarUrl: profile.picture,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
    }

    return user;
  }
}
```

---

## 🧪 Testing

### **Login avec cURL**

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe",
    "accountId": "account_id_here"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# Use access token
curl -X GET http://localhost:3001/api/crm/leads \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🎨 Frontend Integration (Next.js)

### **Login Form**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Store tokens in localStorage or cookies
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>

      {/* Google OAuth */}
      <a href="http://localhost:3001/auth/google">
        <button type="button">Login with Google</button>
      </a>
    </form>
  );
}
```

---

## ✅ Checklist d'Implémentation

### Phase 1: JWT Auth (1-2h)
- [ ] Créer `auth.service.ts` avec register/login
- [ ] Créer `jwt.strategy.ts` pour validation tokens
- [ ] Créer `jwt-auth.guard.ts` pour protéger routes
- [ ] Endpoints `/auth/register` et `/auth/login`
- [ ] Tester avec cURL

### Phase 2: Google OAuth (1h)
- [ ] Setup Google Cloud project
- [ ] Créer `google.strategy.ts`
- [ ] Endpoint `/auth/google` et `/auth/google/callback`
- [ ] Tester login Google

### Phase 3: Magic Links (2h)
- [ ] Générer token unique (crypto.randomBytes)
- [ ] Stocker dans DB avec expiration (15 min)
- [ ] Envoyer email avec lien
- [ ] Endpoint `/auth/magic-link/:token` pour valider
- [ ] Tester flow complet

### Phase 4: Frontend Integration (2-3h)
- [ ] Login form (email/password)
- [ ] Google OAuth button
- [ ] Token refresh logic
- [ ] Protected routes HOC
- [ ] Logout functionality

---

## 📚 Ressources

- [NestJS Auth Docs](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

**Status**: Structure créée, prêt pour implémentation complète
**Temps estimé**: 6-8h pour implémentation complète (tous phases)
**Priorité**: P1 (important mais non-bloquant pour MVP)
