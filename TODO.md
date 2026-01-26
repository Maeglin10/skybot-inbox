# TODO - SkyBot Inbox V1

> Basé sur l'analyse V1_READINESS_ANALYSIS.md
> Dernière mise à jour: 26 janvier 2026

---

## 🔴 BLOCKERS (P0) - Obligatoire pour V1

### 1. Admin Endpoints
- [ ] `POST /api/admin/users` - Créer des utilisateurs
- [ ] `GET /api/admin/users` - Lister les utilisateurs
- [ ] `PUT /api/admin/users/:id` - Modifier un utilisateur
- [ ] `DELETE /api/admin/users/:id` - Supprimer un utilisateur (avec protections)
- [ ] Ajouter `@Roles(UserRole.ADMIN)` decorator
- [ ] Ajouter RolesGuard pour RBAC
- [ ] Ajouter audit logging pour toutes les actions admin
- [ ] Écrire tests E2E pour les endpoints admin

**Fichiers à créer/modifier:**
```
src/admin/admin.module.ts
src/admin/admin.controller.ts
src/admin/admin.service.ts
src/admin/dto/*.ts
src/auth/guards/roles.guard.ts
src/auth/decorators/roles.decorator.ts
```

**Estimation:** 2-3 jours

---

### 2. Frontend Pages Incomplètes
- [ ] `/es/inbox` - Vue principale inbox (liste de conversations)
- [ ] `/es/inbox/[id]` - Vue détail conversation (thread de messages)
- [ ] `/es/alerts` - Dashboard alertes
- [ ] `/es/analytics` - Dashboard analytics
- [ ] `/es/calendar` - Vue calendrier
- [ ] `/es/crm` - Contacts CRM
- [ ] Ajouter checkbox "Remember Me" sur login

**Priorité d'implémentation:**
1. **Inbox** (P0 - Feature principale)
2. **Inbox Detail** (P0 - Vue conversation)
3. **Alerts** (P1)
4. **CRM** (P1)
5. **Analytics** (P2)
6. **Calendar** (P2)

**Estimation:** 3-5 jours

---

### 3. Error Tracking/Monitoring
- [ ] Installer Sentry (`@sentry/nestjs`, `@sentry/nextjs`)
- [ ] Configurer Sentry sur le backend NestJS
- [ ] Configurer Sentry sur le frontend Next.js
- [ ] Créer `/api/health/liveness` - Check simple uptime
- [ ] Créer `/api/health/readiness` - Check DB + services externes
- [ ] Configurer shipping des logs vers service externe (LogDNA, Datadog, ou CloudWatch)
- [ ] Ajouter monitoring uptime externe (UptimeRobot, Pingdom)

**Estimation:** 1 jour

---

## 🟡 HIGH PRIORITY (P1) - Requis pour V1

### 4. Test Coverage
**Cible:** >70% backend, >50% frontend

- [ ] Tests unitaires AuthService
- [ ] Tests unitaires AdminService
- [ ] Tests unitaires ConversationService
- [ ] Tests Guards et decorators
- [ ] Tests d'intégration API endpoints
- [ ] Tests transactions database
- [ ] Tests scénarios multi-tenant
- [ ] Tests composants frontend (React Testing Library)
- [ ] Tests E2E (Playwright ou Cypress)
- [ ] GitHub Actions CI avec tests sur PR
- [ ] Setup/teardown base de test
- [ ] Mock APIs externes (Airtable)

**Estimation:** 3-4 jours

---

### 5. Security Hardening
- [ ] Ajouter protection CSRF (`csurf`)
- [ ] Ajouter `class-sanitizer` aux DTOs
- [ ] Sanitizer HTML dans les inputs utilisateur
- [ ] Valider tous les file uploads
- [ ] Vérifier absence de raw SQL queries
- [ ] Ajouter tests injection SQL
- [ ] Ajouter CSP (Content Security Policy)
- [ ] Ajouter HSTS (HTTP Strict Transport Security)
- [ ] Implémenter audit logging dans tous les endpoints
- [ ] Logger les tentatives de login échouées
- [ ] Logger les activités suspectes
- [ ] Ajouter vérification signature des requêtes
- [ ] Implémenter versioning API
- [ ] Ajouter headers de dépréciation

**Estimation:** 2 jours

---

### 6. Performance Optimization
- [ ] Ajouter indexes sur les champs fréquemment requêtés
- [ ] Optimiser queries N+1 avec Prisma includes
- [ ] Ajouter database connection pooling
- [ ] Considérer read replicas
- [ ] Ajouter Redis pour sessions
- [ ] Implémenter caching données fréquentes
- [ ] Stratégie d'invalidation cache
- [ ] Optimisation images
- [ ] Lazy loading composants lourds
- [ ] Service worker pour offline
- [ ] Code splitting avec dynamic imports
- [ ] Pagination pour tous les endpoints liste
- [ ] Field selection (style GraphQL)
- [ ] Compression réponses (gzip/brotli)
- [ ] Headers ETag pour caching

**Estimation:** 2-3 jours

---

### 7. DevOps Pipeline
- [ ] Activer tests dans workflow CI
- [ ] Ajouter workflow CD pour branche main
- [ ] Déploiement auto backend vers Render
- [ ] Déploiement auto frontend vers Render
- [ ] Smoke tests après déploiement
- [ ] Créer environnement staging
- [ ] Implémenter blue-green deployment
- [ ] Health check avant switch traffic
- [ ] Rollback automatique sur échec
- [ ] Automatiser migrations sur déploiement
- [ ] Procédure rollback migrations
- [ ] Tester migrations en staging d'abord

**Estimation:** 2 jours

---

### 8. User Onboarding & Documentation
- [ ] Guide utilisateur / Getting started
- [ ] Centre d'aide
- [ ] FAQ
- [ ] Ajouter librairie tooltips (Tippy.js, Radix Tooltip)
- [ ] Ajouter boutons d'aide contextuelle
- [ ] Flow d'onboarding nouveaux utilisateurs
- [ ] Générer docs OpenAPI/Swagger
- [ ] Exemples requêtes/réponses API
- [ ] Documenter endpoints webhook
- [ ] Guide admin
- [ ] Procédures troubleshooting

**Estimation:** 2 jours

---

### 9. Email Notifications
- [ ] Intégrer service email (SendGrid, Mailgun, ou AWS SES)
- [ ] Templates email (HTML + text)
- [ ] Queue email (Bull + Redis)
- [ ] Email de bienvenue
- [ ] Email reset mot de passe
- [ ] Email magic link
- [ ] Notifications importantes
- [ ] Digest hebdomadaire (optionnel)

**Estimation:** 2 jours

---

### 10. Data Backup & Recovery
- [ ] Automatiser backups quotidiens (cron job)
- [ ] Stocker backups dans S3
- [ ] Rétention backups 30 jours
- [ ] Tester backups hebdomadairement
- [ ] Documenter procédure de restore
- [ ] Tester recovery en staging
- [ ] Point-in-time recovery
- [ ] Activer backups auto Render PostgreSQL
- [ ] Configurer période de rétention Render
- [ ] Tester restore depuis backup Render

**Estimation:** 1 jour

---

### 11. API Rate Limiting & Quotas
- [ ] Rate limiting par utilisateur (`@Throttle`)
- [ ] Login: 5 tentatives / 15 min
- [ ] API endpoints: 100 req/min
- [ ] File uploads: 10/heure
- [ ] Tracker usage API par compte
- [ ] Dashboard usage
- [ ] Warnings à 80% quota
- [ ] Limites basées sur le plan

**Estimation:** 1 jour

---

## 🟢 MEDIUM PRIORITY (P2) - Nice to Have

### 12. WebSocket Real-Time Updates
- [ ] Implémenter connexions WebSocket
- [ ] Remplacer polling par WS

**Estimation:** 3 jours

---

### 13. Multi-Language Support
- [ ] Ajouter English
- [ ] Ajouter French
- [ ] Ajouter Portuguese

**Estimation:** 2 jours

---

### 14. Advanced Search & Filters
- [ ] Full-text search
- [ ] Filtres avancés
- [ ] Tri

**Estimation:** 2-3 jours

---

### 15. File Upload & Attachments
- [ ] Endpoint upload fichiers
- [ ] Storage (S3, Cloudinary)
- [ ] Scan antivirus
- [ ] Limites taille
- [ ] Validation type

**Estimation:** 2-3 jours

---

### 16. Mobile Responsiveness
- [ ] Layouts optimisés mobile

**Estimation:** 2-3 jours

---

### 17. Keyboard Shortcuts
- [ ] `Ctrl+K` - Command palette
- [ ] `G` puis `I` - Go to inbox
- [ ] `G` puis `S` - Go to settings
- [ ] `?` - Show shortcuts

**Estimation:** 1 jour

---

### 18. Dark/Light Theme Persistence
- [ ] Charger thème depuis cookie avant render

**Estimation:** 0.5 jour

---

### 19. Password Strength Requirements
- [ ] Majuscule + minuscule
- [ ] Chiffres
- [ ] Caractères spéciaux
- [ ] Pas de mots de passe communs

**Estimation:** 0.5 jour

---

### 20. Two-Factor Authentication (2FA)
- [ ] TOTP (Google Authenticator)
- [ ] SMS (Twilio)
- [ ] Codes par email

**Estimation:** 2 jours

---

### 21. Account Deletion & GDPR Compliance
- [ ] Self-service suppression compte
- [ ] Export données personnelles
- [ ] Droit à l'oubli
- [ ] Privacy policy
- [ ] Cookie consent

**Estimation:** 2 jours

---

### 22. Analytics & Metrics Dashboard
- [ ] Utilisateurs actifs
- [ ] Temps de réponse
- [ ] Taux d'erreur
- [ ] Usage features
- [ ] Rétention utilisateurs

**Estimation:** 3 jours

---

### 23. Webhook System
- [ ] Event: Nouveau message reçu
- [ ] Event: Statut conversation changé
- [ ] Event: Utilisateur créé/modifié

**Estimation:** 2 jours

---

## 📈 UX/UI Improvements

### Loading States (P1)
- [ ] Skeleton loaders conversation list
- [ ] Skeleton loaders message threads
- [ ] Skeleton loaders user profiles
- [ ] Skeleton loaders settings

### Empty States (P1)
- [ ] Empty state: Pas de conversations
- [ ] Empty state: Pas d'alertes
- [ ] Empty state: Pas de contacts
- [ ] Empty state: Recherche sans résultats

### Error States (P1)
- [ ] Message erreur réseau
- [ ] Message erreur serveur
- [ ] Message erreur validation
- [ ] Message permission denied

### Micro-interactions (P2)
- [ ] Effets hover boutons
- [ ] Transitions de pages
- [ ] Toast notifications
- [ ] Loading spinners

### Accessibility (P1)
- [ ] ARIA labels
- [ ] Navigation clavier
- [ ] Support screen reader
- [ ] Indicateurs focus

---

## 📊 Timeline Estimée

| Phase | Durée | Focus |
|-------|-------|-------|
| **Phase 1: Fixes Critiques** | 1 semaine | Admin endpoints, Inbox UI, Monitoring |
| **Phase 2: Security & Tests** | 1 semaine | Hardening, Test coverage, CI/CD |
| **Phase 3: Performance & UX** | 1 semaine | Optimization, Documentation, Polish |
| **Phase 4: Launch Prep** | 3 jours | Tests finaux, Déploiement, Launch |

**Total:** ~3.5 semaines jusqu'à V1 production-ready

---

## ✅ Checklist V1 Launch

### Must Have (Blockers) 🔴
- [ ] Admin user management endpoints
- [ ] Complete inbox UI (list + detail)
- [ ] Error tracking (Sentry)
- [ ] Monitoring & logging
- [ ] Automated backups

### Should Have (High Priority) 🟡
- [ ] Test coverage >70% backend
- [ ] Security audit & hardening
- [ ] Performance optimization
- [ ] CI/CD pipeline
- [ ] User documentation
- [ ] Email notifications
- [ ] Rate limiting per user

### Nice to Have (Medium Priority) 🟢
- [ ] WebSocket real-time updates
- [ ] Multi-language support
- [ ] Advanced search
- [ ] File uploads
- [ ] Mobile responsive
- [ ] Keyboard shortcuts
- [ ] 2FA authentication
