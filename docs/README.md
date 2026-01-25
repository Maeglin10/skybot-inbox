# 📚 SkyBot Inbox - Documentation

Documentation complète du projet SkyBot Inbox, organisée par thématiques.

---

## 🚀 Deployment

Tout ce qui concerne le déploiement sur Render, Vercel et la configuration des environnements.

- [Deploy Checklist](deployment/deploy-checklist.md) - Checklist complète pour déploiement production
- [Deploy Frontend Guide](deployment/deploy-frontend-guide.md) - Guide pas-à-pas déploiement frontend
- [Deploy Frontend (Render/Vercel)](deployment/deploy-frontend-render-vercel.md) - Options Render vs Vercel
- [Deployment Overview](deployment/deployment-overview.md) - Vue d'ensemble du déploiement
- [Render Environment Variables](deployment/render-env-vars.md) - Variables d'environnement Render
- [Start Frontend Locally](deployment/start-frontend-local.md) - Démarrer le frontend en local

---

## 💻 Development

Résumés d'implémentation, récaps de sessions, et estimations.

- [48h Implementation Summary](development/48h-implementation-summary.md) - Résumé travail 48h
- [Session Recap](development/session-recap.md) - Récap dernière session
- [Conversation Summary](development/conversation-summary.md) - Résumé conversations
- [Estimate](development/estimate.md) - Estimations projet

---

## 🔐 Auth

Configuration de l'authentification, SSO, OAuth.

- [Auth Setup](auth/auth-setup.md) - Configuration authentification
- [SSO Testing](auth/sso-testing.md) - Tests SSO et OAuth

---

## 🔌 Integrations

Intégrations avec services externes (Airtable, MCP, APIs).

### Airtable
- [Airtable Fix Complete](integrations/airtable/airtable-fix-complete.md) - Fix Airtable complété
- [Airtable Status](integrations/airtable/airtable-status.md) - Status intégration Airtable
- [MCP Airtable Setup](integrations/airtable/mcp-airtable-setup.md) - Configuration MCP Airtable

---

## 🔧 Maintenance

Fixes, migrations, audits de sécurité.

### Fixes
- [P0 Fixes Success](maintenance/fixes/p0-fixes-success.md) - Fixes priorité 0 complétés
- [Urgent Fix](maintenance/fixes/urgent-fix.md) - Fixes urgents
- [Fix Migration](maintenance/fixes/fix-migration.md) - Fixes migration DB

### Audits
- [Audit Completion](maintenance/audit-completion.md) - Audit complété
- [Security Audit](maintenance/security-audit.md) - Audit de sécurité

---

## ⚡ Optimization

Optimisations de performance.

- [Performance Optimizations](optimization/performance-optimizations.md) - Optimisations performance

---

## 🧪 Testing

Rapports de tests et méthodologies.

- [Test Report](testing/test-report.md) - Rapport de tests

---

## 📖 Guides

Guides d'utilisation et prompts.

- [Antigravity Prompts](guides/antigravity-prompts.md) - Prompts pour Antigravity

---

## 📊 Status

Status actuel du projet.

- [Current Status](status/current-status.md) - État actuel du projet et déploiements

---

## 📁 Structure du Projet

```
docs/
├── README.md (ce fichier)
├── deployment/         # Déploiement et configuration
├── development/        # Développement et implémentations
├── auth/              # Authentification et SSO
├── integrations/      # Intégrations externes
│   └── airtable/
├── maintenance/       # Maintenance et fixes
│   └── fixes/
├── optimization/      # Performance
├── testing/          # Tests
├── guides/           # Guides utilisateur
└── status/           # Status projet
```

---

## 🔗 Autres READMEs

- [README Principal](../README.md) - README du projet
- [Frontend README](../skybot-inbox-ui/README.md) - README frontend Next.js
- [MCP Server README](../mcp-server-airtable/README.md) - README serveur MCP Airtable
