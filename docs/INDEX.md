# SkyBot Inbox - Complete Documentation

**Enterprise Multi-Tenant WhatsApp Business Platform**

This comprehensive documentation provides everything senior developers need to understand, deploy, and extend SkyBot Inbox.

---

## 📚 Documentation Structure

### 🎯 [Getting Started](./getting-started/)
- [Quick Start Guide](./getting-started/QUICK_START.md)
- [Installation](./getting-started/INSTALLATION.md)
- [Configuration](./getting-started/CONFIGURATION.md)
- [Environment Variables Reference](./getting-started/ENVIRONMENT_VARIABLES.md)

### 🏗️ [Architecture](./architecture/)
- [System Overview](./architecture/OVERVIEW.md)
- [Technology Stack](./architecture/TECH_STACK.md)
- [Database Schema](./architecture/DATABASE.md)
- [Module Structure](./architecture/MODULES.md)
- [Multi-Tenancy](./architecture/MULTI_TENANCY.md)
- [Security Architecture](./architecture/SECURITY.md)

### 🔌 [Modules Documentation](./modules/)
Core modules reference:
- [Authentication & Authorization](./modules/AUTH.md)
- [Channels (Multi-Channel Framework)](./modules/CHANNELS.md)
- [WhatsApp Integration](./modules/WHATSAPP.md)
- [Conversations & Messages](./modules/CONVERSATIONS.md)
- [CRM & Lead Management](./modules/CRM.md)
- [Analytics](./modules/ANALYTICS.md)
- [Alerts System](./modules/ALERTS.md)
- [N8N Automation](./modules/N8N_INTEGRATION.md)
- [Airtable Integration](./modules/AIRTABLE.md)
- [Billing & Subscriptions](./modules/BILLING.md)
- [All Modules Index](./modules/INDEX.md)

### 📡 [API Reference](./api/)
- [REST API Documentation](./api/REST_API.md)
- [Webhooks](./api/WEBHOOKS.md)
- [Authentication](./api/AUTHENTICATION.md)
- [Error Handling](./api/ERRORS.md)

### 🚀 [Deployment](./deployment/)
- [Deployment Overview](./deployment/OVERVIEW.md)
- [Render.com Deployment](./deployment/RENDER.md)
- [Environment Setup](./deployment/ENVIRONMENT.md)
- [Database Migrations](./deployment/MIGRATIONS.md)
- [Monitoring & Logging](./deployment/MONITORING.md)

### 🔧 [MCP Servers](./mcp-servers/)
- [SkyBot Inbox MCP Server](./mcp-servers/SKYBOT_INBOX_MCP.md)
- [Airtable MCP Server](./mcp-servers/AIRTABLE_MCP.md)

### 🧪 [Development](./development/)
- [Development Setup](./development/SETUP.md)
- [Testing](./development/TESTING.md)
- [Code Style & Conventions](./development/CONVENTIONS.md)
- [Contributing](./development/CONTRIBUTING.md)

### 🛡️ [Security](./security/)
- [Security Best Practices](./security/BEST_PRACTICES.md)
- [Secrets Management](./security/SECRETS.md)
- [Encryption](./security/ENCRYPTION.md)
- [Security Audit Reports](./security/AUDITS.md)

### 🔍 [Troubleshooting](./troubleshooting/)
- [Common Issues](./troubleshooting/COMMON_ISSUES.md)
- [Database Issues](./troubleshooting/DATABASE.md)
- [Webhook Issues](./troubleshooting/WEBHOOKS.md)
- [Deployment Issues](./troubleshooting/DEPLOYMENT.md)

### 📝 [Project Status](./status/)
- [Current Status](./status/CURRENT_STATUS.md)
- [Roadmap](./status/ROADMAP.md)
- [Changelog](./status/CHANGELOG.md)

---

## 🚀 Quick Links

**For New Developers:**
1. Start with [Quick Start Guide](./getting-started/QUICK_START.md)
2. Read [Architecture Overview](./architecture/OVERVIEW.md)
3. Review [Module Structure](./architecture/MODULES.md)
4. Set up [Development Environment](./development/SETUP.md)

**For DevOps:**
1. Review [Deployment Overview](./deployment/OVERVIEW.md)
2. Configure [Environment Variables](./getting-started/ENVIRONMENT_VARIABLES.md)
3. Set up [Monitoring](./deployment/MONITORING.md)

**For API Integration:**
1. Read [REST API Documentation](./api/REST_API.md)
2. Set up [Authentication](./api/AUTHENTICATION.md)
3. Review [Webhooks](./api/WEBHOOKS.md)

---

## 📊 Project Overview

### What is SkyBot Inbox?

SkyBot Inbox is an enterprise-grade, multi-tenant platform for managing WhatsApp Business conversations with AI-powered automation. It provides:

- **Multi-Channel Support**: WhatsApp, Instagram, Facebook Messenger, Email, Web Chat
- **AI Automation**: 50+ pre-built N8N workflow templates
- **Multi-Tenancy**: Complete account isolation with RBAC
- **Real-Time Analytics**: Track conversations, leads, and performance
- **Enterprise Security**: JWT auth, API keys, HMAC webhook validation
- **Production-Ready**: Deployed on Render.com with auto migrations

### Key Statistics

- **37 Modules**: Comprehensive feature set
- **TypeScript**: 100% type-safe codebase
- **NestJS**: Modern, scalable architecture
- **PostgreSQL + Prisma**: Robust data layer
- **WebSocket**: Real-time updates
- **N8N Integration**: Workflow automation

---

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL 15+ with Prisma 6.x
- **Auth**: JWT + bcrypt
- **Real-time**: Socket.io
- **Logging**: Winston
- **Security**: Helmet.js, CORS, Rate Limiting

### Frontend
- **Framework**: Next.js 15.1 with React 19
- **Styling**: TailwindCSS 3.4
- **State**: React Context + Server Components
- **i18n**: next-intl

### Automation
- **Workflow Engine**: N8N
- **AI**: Claude 3.5 Sonnet
- **APIs**: WhatsApp, Meta Graph, Airtable, Stripe

---

## 📞 Support & Contributing

- **Documentation**: This repository
- **Issues**: GitHub Issues
- **Contributing**: See [CONTRIBUTING.md](./development/CONTRIBUTING.md)

---

**Last Updated**: 2026-01-30
**Version**: 1.0.0
**License**: Proprietary

© 2026 SkyBot Inbox - All rights reserved
