# SkyBot Inbox - Production-Ready Roadmap

**Date**: 2026-01-29
**Analysé par**: Claude Sonnet 4.5
**Source**: Analyse de 7 projets open source production-grade

---

## 📊 Executive Summary

Après analyse approfondie de Stack Auth, Chatwoot, SaaSFly, Invoify, Luro-AI, DiceUI et CodeJeet, SkyBot Inbox a **5 vulnérabilités critiques** et **15 améliorations majeures** nécessaires pour être production-ready à 100%.

**Status actuel**: ⚠️ Fonctionnel mais avec risques de sécurité et stabilité

**Status cible**: ✅ Production-ready enterprise-grade

---

## 🚨 VULNÉRABILITÉS CRITIQUES (P0)

### 1. Cross-Account Data Leak 🔴 **CRITIQUE**

**Vulnérabilité**:
```typescript
// conversations.service.ts - ACTUEL
async findOne(id: string) {
  return await this.prisma.conversation.findUnique({ where: { id } });
}

// ❌ PROBLÈME: Account A peut lire conversations de Account B en devinant l'ID!
```

**Impact**: Tout utilisateur peut lire les données d'un autre compte

**Fix requis**:
```typescript
async findOne(id: string, accountId: string) {  // Ajouter accountId!
  const conversation = await this.prisma.conversation.findFirst({
    where: {
      id,
      inbox: { accountId }  // Vérification OBLIGATOIRE
    }
  });

  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }

  return conversation;
}
```

**Fichiers à corriger**:
- ✅ `/src/conversations/conversations.service.ts` - TOUTES les méthodes
- ✅ `/src/messages/messages.service.ts` - TOUTES les méthodes
- ✅ `/src/contacts/contacts.service.ts` - TOUTES les méthodes
- ✅ `/src/crm/crm.service.ts` - TOUTES les méthodes
- ✅ `/src/analytics/analytics.service.ts` - TOUTES les méthodes

### 2. No Refresh Token Storage 🔴 **CRITIQUE**

**Problème**: Tokens refresh seulement validés via JWT, pas de base de données

**Risques**:
- Impossible de révoquer une session compromise
- Pas de tracking d'activité suspecte
- Pas de gestion multi-device
- Tokens volés valides jusqu'à expiration

**Fix requis**:
```prisma
model RefreshToken {
  id            String   @id @default(cuid())
  token         String   @unique
  userAccountId String
  accountId     String
  expiresAt     DateTime
  lastActiveAt  DateTime
  ipAddress     String?
  userAgent     String?
  isRevoked     Boolean  @default(false)
  createdAt     DateTime @default(now())

  userAccount UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  account     Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([userAccountId])
  @@index([accountId])
  @@index([expiresAt])
}
```

### 3. No WebSocket Gateway 🔴 **CRITIQUE**

**Problème**: AUCUN fichier WebSocket gateway trouvé dans le code

**Impact**:
- Pas de real-time pour nouveaux messages
- Users doivent refresh manuellement
- Mauvaise UX (pas moderne)

**Fix requis**:
- Créer `src/websockets/conversations.gateway.ts`
- Authentifier via JWT
- Rooms par accountId
- Events: `message:created`, `conversation:status`, etc.

### 4. No Error Boundaries (Frontend) 🔴 **CRITIQUE**

**Problème**: Pas de `error.tsx` dans app directory

**Impact**: Erreur → App crash complètement

**Fix requis**:
```tsx
// src/app/[locale]/error.tsx
export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ErrorUI error={error} onRetry={reset} />
    </div>
  );
}
```

### 5. No Global Exception Filter (Backend) 🔴 **CRITIQUE**

**Problème**: Erreurs retournent stack traces bruts en production

**Risques**:
- Information leakage (paths, secrets dans stack traces)
- Pas de format standardisé
- Pas de tracking Sentry

**Fix requis**:
- Créer `AllExceptionsFilter`
- Standardiser format erreurs
- Masquer stack traces en prod
- Intégrer Sentry

---

## 🔥 BUGS MAJEURS (P1)

### 6. Message Duplication

**Problème**: Pas d'idempotency token

**Impact**: Double-click → duplicate message

**Fix**: Ajouter `idempotencyKey` + cache Redis

### 7. No Rate Limiting

**Problème**: Pas de rate limiting sur login/API

**Impact**: Brute force possible, DoS vulnérable

**Fix**: Rate limiter avec Redis (5 attempts/15min)

### 8. No Background Jobs

**Problème**: Tout synchrone (emails, webhooks, N8N)

**Impact**: Requêtes lentes, timeouts

**Fix**: Implémenter Bull + Redis

### 9. Timing Attack Vulnerability

**Problème**:
```typescript
if (!user || !user.passwordHash) {
  throw new UnauthorizedException();
}
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Fix**: Toujours hasher même si user inexistant (constant-time)

### 10. No Stripe Webhook Verification

**Problème**: Webhooks Stripe pas signés

**Impact**: Attaquant peut forger webhooks

**Fix**: `stripe.webhooks.constructEvent()`

---

## 📈 AMÉLIORATIONS ARCHITECTURE (P2)

### 11. No Composite Indexes

**Impact**: Queries lentes sur gros volumes

**Fix**:
```prisma
@@index([accountId, status, lastActivityAt])
@@index([conversationId, createdAt])
```

### 12. No Health Checks

**Impact**: Load balancers ne peuvent pas vérifier status

**Fix**: Endpoints `/health` et `/ready`

### 13. No Feature Flags

**Impact**: Impossible de rollout progressif

**Fix**: Database-driven feature flags per tenant

### 14. No Email System

**Impact**: Pas de notifications transactionnelles

**Fix**: Intégrer Resend

### 15. No Monitoring

**Impact**: Bugs silencieux en production

**Fix**: Activer Sentry + health dashboards

---

## 📅 PLAN D'IMPLÉMENTATION

### Week 1: Critical Security (P0)

**Day 1-2**: Cross-Account Validation
- [ ] Add `accountId` param to ALL service methods
- [ ] Update controllers to extract from JWT
- [ ] Write tests for access control

**Day 3-4**: Refresh Token Storage
- [ ] Create RefreshToken model
- [ ] Update auth.service to store tokens
- [ ] Add session management endpoints

**Day 5**: Exception Handling
- [ ] Create global exception filter
- [ ] Add structured error types
- [ ] Integrate Sentry properly

### Week 2: Real-Time & UX (P0 + P1)

**Day 1-2**: WebSocket Gateway
- [ ] Create conversations gateway
- [ ] Authenticate connections
- [ ] Emit events on message/status changes

**Day 3-4**: Frontend Error Handling
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Implement toast notifications (Sonner)

**Day 5**: Message Idempotency
- [ ] Add idempotency keys
- [ ] Implement deduplication logic
- [ ] Add rate limiting

### Week 3: Background Jobs & Monitoring (P1)

**Day 1-2**: Bull Queue System
- [ ] Install Bull + Redis
- [ ] Create message queue
- [ ] Move email/webhooks to background

**Day 3**: Health & Monitoring
- [ ] Add health check endpoints
- [ ] Configure Sentry alerts
- [ ] Add slow query logging

**Day 4-5**: Stripe Security
- [ ] Add webhook signature verification
- [ ] Add idempotency tracking
- [ ] Add transaction wrapping

### Week 4: Architecture Improvements (P2)

**Day 1-2**: Database Optimization
- [ ] Add composite indexes
- [ ] Add check constraints
- [ ] Optimize frequent queries

**Day 3**: Feature Flags
- [ ] Create FeatureFlag model
- [ ] Add admin UI
- [ ] Implement flag checks

**Day 4-5**: Email System
- [ ] Integrate Resend
- [ ] Create email templates
- [ ] Add delivery tracking

---

## 🎯 SUCCESS METRICS

### Security
- ✅ 0 cross-account data leaks
- ✅ All sessions revocable
- ✅ All webhooks verified
- ✅ Rate limiting active

### Reliability
- ✅ 99.9% uptime
- ✅ < 500ms p95 response time
- ✅ 0 silent errors (all tracked)
- ✅ Graceful degradation on failures

### User Experience
- ✅ Real-time updates (<1s delay)
- ✅ No full-page crashes
- ✅ Clear error messages
- ✅ Responsive on mobile

---

## 📚 LEARNED PATTERNS (From Open Source)

### From Stack Auth:
- Refresh token database storage
- Timing attack prevention
- Multi-tenancy at schema level
- KnownError hierarchy

### From Chatwoot:
- Account-first query scoping
- Conversation lifecycle hooks
- Message idempotency
- Background job patterns

### From SaaSFly:
- Feature flags architecture
- Stripe webhook security
- Database migration safety
- Monitoring setup

### From UI Projects:
- Error boundaries best practices
- Toast notification patterns
- File upload with validation
- WebSocket reconnection logic

---

## 🔗 REFERENCES

- [Stack Auth](https://github.com/stack-auth/stack-auth)
- [Chatwoot](https://github.com/chatwoot/chatwoot)
- [SaaSFly](https://github.com/nextify-limited/saasfly)
- [Invoify](https://github.com/al1abb/invoify)
- [DiceUI](https://www.diceui.com/docs/components/file-upload)
- [Luro-AI](https://github.com/Shreyas-29/luro-ai)
- [CodeJeet](https://github.com/ayush-that/codejeet)

---

**Next Action**: Commencer l'implémentation des fixes P0 (cross-account validation + refresh tokens)
