# SkyBot Inbox

**Enterprise-Grade Multi-Tenant WhatsApp Inbox with AI-Powered Automation**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![N8N](https://img.shields.io/badge/N8N-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io/)

---

## 🌟 Overview

SkyBot Inbox is a production-ready, enterprise-grade multi-tenant platform for managing WhatsApp Business conversations with AI-powered automation. Built with NestJS, PostgreSQL, and N8N, it provides a complete solution for customer communication, CRM, analytics, and intelligent workflow automation.

### Key Features

- **📱 Multi-Channel Support**: WhatsApp, Instagram, Facebook Messenger, Email, Web Chat
- **🤖 AI-Powered Automation**: 50+ pre-built N8N workflow templates for sales, support, and intelligence
- **👥 Multi-Tenancy**: Complete isolation between accounts with role-based access control
- **📊 Real-Time Analytics**: Track conversations, leads, feedback, and agent performance
- **🔐 Enterprise Security**: JWT authentication, API key management, HMAC webhook validation
- **🚀 Production-Ready**: Deployed on Render.com with automatic migrations and database protection
- **📈 Competitive Analysis**: Built-in SEO and competitor analysis module
- **💳 Billing Integration**: Stripe billing with SSO portal access
- **🌍 Internationalization**: Support for multiple languages (EN, ES, FR)

---

## 📋 Quick Start

```bash
# Clone repository
git clone https://github.com/Maeglin10/skybot-inbox.git
cd skybot-inbox

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run start:dev
```

Access the application at http://localhost:3001

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10.x (TypeScript 5.3)
- **Database**: PostgreSQL 15+ with Prisma 7.x
- **Authentication**: JWT + bcrypt
- **Real-time**: WebSockets (Socket.io)
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

## 📚 Documentation

Complete documentation available in `/docs`:

- **[N8N Integration Guide](docs/n8n-testing/N8N-INTEGRATION-GUIDE.md)** - Complete N8N setup and testing
- **[Test Results](docs/n8n-testing/TEST-RESULTS.md)** - Automated test status and coverage
- **[API Reference](docs/api/)** - Complete API documentation
- **[Architecture](docs/architecture/)** - System architecture and design
- **[Deployment](docs/deployment/)** - Deployment guides for various platforms
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions

---

## 🚀 Features

### Core Modules (37 total)

#### Communication
- **Conversations**: Multi-channel conversation management
- **Messages**: Send/receive messages across channels
- **Channels**: WhatsApp, Instagram, Facebook, Email, Web
- **Contacts**: Contact management with corporate flag support

#### CRM & Analytics
- **CRM**: Lead management, feedback collection, temperature scoring
- **Analytics**: Real-time KPIs, charts, breakdowns
- **Alerts**: Transaction, conversation, system, and corporate alerts

#### Automation
- **Agents**: Deploy, activate, and manage N8N workflows
- **Templates**: 50+ pre-built agent templates
- **Stories**: Schedule and publish WhatsApp Stories

#### Business Intelligence
- **Competitive Analysis**: SEO analysis, competitor discovery, AI recommendations
- **Integrations**: Shopify, Airtable, custom integrations

#### Administration
- **Multi-Tenancy**: Complete account isolation
- **RBAC**: Role-based access control (ADMIN, USER, AGENT_USER)
- **Billing**: Stripe integration with SSO portal

---

## 🔧 Environment Variables

Required variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Authentication
JWT_SECRET="min-32-character-secret"
JWT_REFRESH_SECRET="min-32-character-secret"

# WhatsApp
WHATSAPP_ACCESS_TOKEN="your-token"
WHATSAPP_APP_SECRET="your-secret"

# N8N
N8N_MASTER_ROUTER_URL="https://your-n8n.com/webhook"
N8N_MASTER_ROUTER_SECRET="shared-secret"

# SkyBot API
SKYBOT_API_URL="http://localhost:8080"
SKYBOT_API_KEY="your-api-key"
```

See `.env.example` for complete list.

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📦 Deployment

### Render.com (Recommended)

1. Fork repository
2. Create Render Web Service
3. Set environment variables
4. Deploy

See [docs/deployment/RENDER.md](docs/deployment/RENDER.md) for detailed instructions.

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL
psql $DATABASE_URL
```

**Authentication Fails**
```bash
# Check JWT secrets are set
echo $JWT_SECRET
```

**WhatsApp Webhook Not Working**
```bash
# Verify webhook signature
npm run test:whatsapp-signature
```

See [docs/troubleshooting/](docs/troubleshooting/) for complete guide.

---

## 📄 License

Proprietary and confidential. All rights reserved.

© 2026 SkyBot Inbox

---

## 📞 Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/Maeglin10/skybot-inbox/issues)

**Made with ❤️ by the SkyBot team**
