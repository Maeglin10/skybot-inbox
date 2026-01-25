# 🚀 Production Readiness Checklist

**Date de création**: 2026-01-25
**Version**: 1.0
**Objectif**: Valider que SkyBot-Inbox est prêt pour l'intégration client

---

## 📋 Instructions

- [ ] Cocher chaque élément après vérification
- [ ] Ajouter des notes si problèmes détectés
- [ ] Bloquer le déploiement si items P0 non résolus

**Priorités**:
- 🔴 **P0** - Bloquant, doit être résolu
- 🟡 **P1** - Important, devrait être résolu
- 🟢 **P2** - Nice to have

---

## 1️⃣ Auth & RBAC

### Authentication ✅
- [x] 🔴 Username-based login fonctionnel (`valentinmilliand.nexxa`, `nexxa.admin`, `nexxa.demo`, `goodlife.nexxaagents`)
- [x] 🔴 JWT tokens (15min access + 7d refresh) générés correctement
- [x] 🔴 Bcrypt password hashing (10 rounds) appliqué
- [x] 🔴 Email optionnel (uniquement pour recovery)
- [x] 🟡 Magic Links fonctionnels (email à configurer)
- [x] 🟡 Google OAuth conditionnel (si GOOGLE_CLIENT_ID configuré)

**Status**: ✅ Complet

### RBAC ✅
- [x] 🔴 JwtAuthGuard appliqué globalement
- [x] 🔴 @Public() decorator sur routes publiques (login, health)
- [x] 🔴 Roles ADMIN/USER distincts dans JWT payload
- [x] 🟡 RolesGuard implémenté (dans plan DevOps)
- [x] 🟡 Admin endpoints `/api/admin/users/*` protégés

**Status**: ✅ Complet (RBAC basique OK, RolesGuard à venir)

### Invitation-Only ✅
- [x] 🔴 `/api/auth/register` désactivé
- [x] 🔴 Seuls admins peuvent créer users via `/api/admin/users`
- [x] 🔴 Documentation du workflow création compte

**Status**: ✅ Complet

---

## 2️⃣ Multi-Tenant Isolation

### Account Separation 🔴
- [ ] 🔴 **CRITIQUE**: Vérifier que TOUTES les requêtes filtrent par `accountId`
- [ ] 🔴 Tester qu'un user de Account A ne peut pas voir les données de Account B
- [ ] 🔴 Vérifier isolation dans:
  - [ ] Leads (CRM)
  - [ ] Feedbacks
  - [ ] Conversations/Messages (Inbox)
  - [ ] Alerts
  - [ ] Contacts

**Actions requises**:
```bash
# Test manuel avec 2 comptes différents
# 1. Se connecter avec valentinmilliand.nexxa
# 2. Lister leads → doit voir 5 leads Nexxa
# 3. Se connecter avec nexxa.demo
# 4. Lister leads → doit voir 8 leads Demo
# 5. Vérifier qu'il n'y a pas de cross-contamination
```

**Status**: ⚠️ À TESTER

### Database Constraints ✅
- [x] 🔴 Foreign keys `accountId` sur tous les models métier
- [x] 🔴 Indexes sur `accountId` pour performance
- [x] 🔴 Unique constraint `[accountId, username]` sur UserAccount

**Status**: ✅ Complet

---

## 3️⃣ Seeds & Demo Data

### Seed Scripts ✅
- [x] 🔴 `prisma/seed-accounts.ts` crée 4 comptes avec bcrypt
- [x] 🔴 `prisma/seed-demo-data.ts` injecte données de test
- [x] 🔴 Données visibles pour `valentinmilliand.nexxa` et `nexxa.demo`
- [x] 🟡 Script de nettoyage (`prisma/delete-users.ts` temporaire)

**Status**: ✅ Complet

### Demo Data Coverage ✅
- [x] 🟡 13 Leads (5 Nexxa + 8 Demo)
- [x] 🟡 8 Feedbacks (3 Nexxa + 5 Demo)
- [x] 🟡 15 Conversations + ~90 Messages
- [x] 🟡 5 Alerts (2 Nexxa + 3 Demo)

**Status**: ✅ Complet

---

## 4️⃣ Logs & Monitoring

### Logging 🟡
- [ ] 🟡 Winston logging configuré (`src/common/logger/winston.config.ts`)
- [ ] 🟡 Logs structurés en JSON (production)
- [ ] 🟡 Log level configurable via `LOG_LEVEL` env var
- [ ] 🟢 Request ID tracking (à implémenter)

**Actions requises**:
```bash
# Vérifier que les logs Winston sont actifs
npm run start:prod
# Check que les logs sont en JSON
```

**Status**: ⚠️ Configuré mais à tester en prod

### Audit Logging 🟡
- [x] 🟡 Model `AuditLog` existe (Prisma schema)
- [ ] 🟡 Login success/failure loggé
- [ ] 🟢 User CRUD operations loggées
- [ ] 🟢 Admin actions loggées

**Status**: ⚠️ Schema OK, implémentation partielle

### Monitoring & Alerting 🔴
- [ ] 🔴 **MANQUANT**: Sentry/DataDog/LogRocket non configuré
- [ ] 🔴 **MANQUANT**: Uptime monitoring (Render health checks uniquement)
- [ ] 🟡 Health endpoint `/health` disponible

**Actions requises**:
```bash
# Option 1: Sentry
SENTRY_DSN=xxx npm install @sentry/node

# Option 2: Render health checks
# Configure health check URL: https://skybot-inbox.onrender.com/health
```

**Status**: 🔴 BLOQUANT - Configurer monitoring

---

## 5️⃣ Webhooks Framework

### Meta Webhooks 🟡
- [x] 🟡 Endpoint `/api/webhooks/meta` existe
- [ ] 🟡 Signature verification configurée
- [ ] 🟡 Message ingestion testée

**Status**: ⚠️ Code présent, à tester avec Meta App

### Generic Webhooks 🟢
- [ ] 🟢 Shopify webhooks (si nécessaire)
- [ ] 🟢 Email ingestion webhooks
- [ ] 🟢 WebChat widget webhooks

**Status**: ⚠️ Pas prioritaire pour MVP

---

## 6️⃣ Permissions UI

### Admin vs User Views 🔴
- [ ] 🔴 **CRITIQUE**: Vérifier que USER ne voit pas les pages admin
- [ ] 🔴 Admin panel `/settings` accessible uniquement aux ADMIN
- [ ] 🟡 Boutons "Create User" cachés pour USER role

**Actions requises**:
```bash
# Test avec 2 roles
# 1. Login valentinmilliand.nexxa (ADMIN) → accès /settings ✓
# 2. Login goodlife.nexxaagents (USER) → accès /settings ✗ (redirect ou 403)
```

**Status**: 🔴 BLOQUANT - À implémenter

### Frontend Guards 🔴
- [ ] 🔴 Middleware redirige users non-admin vers /inbox si accès /settings/admin
- [ ] 🟡 UI conditionnelle basée sur `user.role`

**Status**: 🔴 BLOQUANT - À implémenter

---

## 7️⃣ Config Client

### clients_config.json 🟡
- [x] 🟡 Schema défini (`ClientConfig` Prisma model)
- [ ] 🟡 Données complètes pour tous les clients
- [ ] 🟡 Routing rules configurées

**Status**: ⚠️ À compléter

---

## 8️⃣ Security

### Environment Variables ✅
- [x] 🔴 `JWT_SECRET` configuré (min 32 chars)
- [x] 🔴 `JWT_REFRESH_SECRET` configuré
- [x] 🔴 `DATABASE_URL` sécurisé
- [x] 🟡 `GOOGLE_CLIENT_ID/SECRET` optionnels
- [ ] 🟡 `SENTRY_DSN` à configurer

**Status**: ✅ Secrets OK, monitoring à ajouter

### Rate Limiting ✅
- [x] 🔴 Throttler configuré (120 req/min)
- [x] 🔴 @SkipThrottle() sur `/health`

**Status**: ✅ Complet

### CORS ✅
- [x] 🔴 CORS configuré dans `main.ts`
- [x] 🔴 Origines autorisées définies

**Status**: ✅ Complet

### Security Headers 🟡
- [x] 🟡 Helmet.js configuré (dans plan DevOps)
- [ ] 🟡 CSP headers à vérifier

**Status**: ⚠️ Configuré mais à tester

### SQL Injection Protection ✅
- [x] 🔴 Prisma ORM utilisé (parameterized queries)
- [x] 🔴 Pas de raw SQL sans validation

**Status**: ✅ Complet

---

## 9️⃣ Deployment

### Render Configuration ✅
- [x] 🔴 Backend déployé automatiquement (push to main)
- [x] 🔴 Frontend déployé automatiquement
- [x] 🔴 Environment variables configurées
- [x] 🟡 Build commands correctes

**Status**: ✅ Complet

### Rollback Procedure 🟡
- [ ] 🟡 **DOCUMENTATION MANQUANTE**: Procédure de rollback

**Actions requises**:
```markdown
# Rollback Procedure
1. Aller sur Render Dashboard
2. Sélectionner le service (backend ou frontend)
3. Onglet "Deploys" → choisir deploy précédent
4. Click "Redeploy"
5. Vérifier health check après 2min
```

**Status**: ⚠️ Documenter

### Database Backups 🔴
- [ ] 🔴 **CRITIQUE**: Backups automatiques de la DB
- [ ] 🔴 Tester la restauration d'un backup

**Actions requises**:
```bash
# Option 1: Render Postgres automated backups
# Activer dans Render Dashboard → PostgreSQL → Backups

# Option 2: Script manuel
./scripts/backup-database.sh
```

**Status**: 🔴 BLOQUANT - Configurer backups

---

## 🔟 Smoke Tests

### Manual Testing Checklist 🔴
- [ ] 🔴 **Login**: Se connecter avec `valentinmilliand.nexxa`
- [ ] 🔴 **Inbox Load**: Charger /inbox et voir 5 conversations
- [ ] 🔴 **Create Lead**: Créer un lead dans CRM
- [ ] 🔴 **Create Alert**: Créer une alerte
- [ ] 🔴 **Multi-tenant**: Se connecter avec `nexxa.demo` et vérifier données isolées
- [ ] 🔴 **Auth Lock**: Accéder /inbox sans token → redirect /login
- [ ] 🔴 **Admin Panel**: Créer un user via `/api/admin/users`
- [ ] 🟡 **Refresh Token**: Attendre 15min et vérifier refresh automatique

**Status**: 🔴 BLOQUANT - Tous les tests à exécuter

### Automated Tests 🟢
- [ ] 🟢 Unit tests (>60% coverage)
- [ ] 🟢 E2E tests pour auth flow
- [ ] 🟢 Integration tests pour admin endpoints

**Status**: ⚠️ Pas prioritaire pour MVP

---

## 📊 Summary Status

| Catégorie | Status | P0 Bloquants | P1 Importants | P2 Nice-to-have |
|-----------|--------|--------------|---------------|-----------------|
| Auth & RBAC | ✅ 90% | 0 | 0 | 0 |
| Multi-Tenant | ⚠️ 50% | **2** | 0 | 0 |
| Seeds & Demo | ✅ 100% | 0 | 0 | 0 |
| Logs & Monitoring | ⚠️ 40% | **1** | 3 | 1 |
| Webhooks | ⚠️ 30% | 0 | 2 | 3 |
| Permissions UI | 🔴 0% | **2** | 1 | 0 |
| Config Client | ⚠️ 60% | 0 | 2 | 0 |
| Security | ✅ 85% | 0 | 2 | 0 |
| Deployment | ⚠️ 70% | **1** | 1 | 0 |
| Smoke Tests | 🔴 0% | **8** | 1 | 3 |

**Total P0 Bloquants**: **14**
**Total P1 Importants**: **11**
**Total P2 Nice-to-have**: **7**

---

## 🚨 Actions Prioritaires (Avant Integration Client)

### P0 - BLOQUANTS (Must Fix)
1. ✅ **Multi-tenant isolation testing** - Vérifier séparation données entre accounts
2. ✅ **Permissions UI** - Implémenter guards admin vs user
3. ✅ **Monitoring setup** - Configurer Sentry ou alternative
4. ✅ **Database backups** - Activer backups automatiques
5. ✅ **Smoke tests** - Exécuter tous les tests manuels

### P1 - IMPORTANTS (Should Fix)
1. Winston logging en production
2. Audit logging complet
3. Rollback procedure documentation
4. Webhooks Meta testing
5. Config client completion

### P2 - NICE TO HAVE (Can Wait)
1. Automated tests
2. Request ID tracking
3. Advanced security headers

---

## ✅ Critères de Validation Finale

**L'application est prête pour production si**:
- [ ] Tous les P0 sont résolus
- [ ] 80%+ des P1 sont résolus
- [ ] Smoke tests passent à 100%
- [ ] 1 client pilote teste pendant 1 semaine sans incidents

**Validé par**: _________________
**Date**: _________________

---

**Notes**:
- Ce document doit être mis à jour après chaque déploiement
- Chaque nouveau client doit passer par cette checklist
- Les items P0 sont NON NÉGOCIABLES
