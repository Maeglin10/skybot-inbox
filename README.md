# SkyBot - Multi-Tenant AI Agent Platform

## 🎯 Overview

SkyBot is a multi-tenant AI agent platform built on n8n that provides intelligent automation for sales, customer service, and analytics operations via WhatsApp and other channels.

## 🏗️ Architecture

```
┌─────────────────┐
│  Master Router  │ ← Entry point (webhook)
└────────┬────────┘
         │
         ├──→ Orders Agent     (Sales processing)
         ├──→ CRM Agent        (Lead management)
         ├──→ Setter Agent     (Lead qualification)
         ├──→ Closer Agent     (Deal closing)
         ├──→ Analytics Agent  (KPI reports)
         └──→ Error Handler    (Global logging)
```

### Multi-Tenant Isolation
- Every request includes `clientKey` or `client_id`
- Airtable queries filter by client
- Prevents data leakage between tenants

### Authentication
- All webhooks use `x-master-secret` header authentication
- Credentials ID: `YtknbW2TJvEOZvHi` (Master Router Secret)

## 📦 Active Agents

### 1. **Master Router** (`core/master-router.json`)
- **Webhook**: `https://vmilliand.app.n8n.cloud/webhook/router`
- **Purpose**: Routes requests to specialized agents based on intent
- **Auth**: Required

### 2. **Orders Agent** (`sales/orders.json`)
- **Webhook**: `https://vmilliand.app.n8n.cloud/webhook/orders`
- **Purpose**: Processes customer orders, validates product availability, calculates totals
- **DB Tables**: `orders`, `products`, `leads`

### 3. **CRM Agent** (`service/crm.json`)
- **Webhook**: `https://vmilliand.app.n8n.cloud/webhook/crm`
- **Purpose**: Manages lead lifecycle, updates lead categories (hot/warm/cold)
- **DB Tables**: `leads`

### 4. **Setter Agent** (`sales/setter.json`)
- **Purpose**: Lead qualification and initial engagement
- **DB Tables**: `leads`, `conversations`

### 5. **Closer Agent** (`sales/closer.json`)
- **Purpose**: Deal closing and order confirmation
- **DB Tables**: `leads`, `orders`

### 6. **Analytics Agent** (`analytics/analytics.json`)
- **Webhook**: `https://vmilliand.app.n8n.cloud/webhook/analytics`
- **Purpose**: Generates KPI reports (conversion rate, revenue, lead quality)
- **DB Tables**: `AgentLogs`, `leads`, `orders`, `analytics_reports`
- **Features**:
  - Period analysis (today/week/month/custom)
  - Trend comparison with historical data
  - Alert generation for critical metrics
  - OpenAI executive summary

### 7. **Error Handler** (`core/global-error-handler.json`)
- **Webhook**: `https://vmilliand.app.n8n.cloud/webhook/error-handler`
- **Purpose**: Centralized error logging for all agents
- **DB Tables**: `ErrorLogs`

### 8. **Aftersale Agent** (`service/aftersale.json`)
- **Purpose**: Post-purchase customer support and follow-up
- **DB Tables**: `orders`, `leads`

## 🗄️ Airtable Schema

**Base ID**: `***REMOVED***` (Nexxa)

### Core Tables
- **AgentLogs** (`tbl3fFZdOt59T7yjv`) - Agent execution logs
- **leads** (`tblCAI5p5tr4m46q7`) - Lead management
- **orders** (`tblUk2O8GpEPHnpb5`) - Order tracking
- **products** - Product catalog
- **analytics_reports** (`tblrA1AOkOwCS49TU`) - Historical analytics
- **ErrorLogs** - Error tracking
- **Notifications** (`tblKoq9Iru9ohqXjE`) - Alert notifications

### Multi-Tenant Fields
- `clientKey` - Client identifier (AgentLogs)
- `client_id` - Client identifier (leads, orders)
- `related_client_id` - Client identifier (analytics_reports)

## 🚀 Setup

### 1. Import Workflows to n8n
```bash
# Upload all workflows from /agents/active/ to your n8n instance
# Location: /Local Sites/SkyBot/agents/active/
```

### 2. Configure Credentials
Required credentials in n8n:
- **Airtable Personal Access Token** (ID: `IBkgSLty98SNmjm4`)
- **Master Router Secret** (ID: `YtknbW2TJvEOZvHi`) - For webhook auth
- **OpenAI API** - For AI processing
- **WhatsApp API** (ID: `gjWdThhRhUn6GT00`) - For WhatsApp messaging

### 3. Activate Workflows
In n8n UI, activate:
1. Master Router
2. All active agents (Orders, CRM, Analytics, etc.)
3. Error Handler

### 4. Test with Postman
Import the Postman collection:
```
/postman-collection.json
```

Test endpoints:
- Master Router: POST `https://vmilliand.app.n8n.cloud/webhook/router`
- Analytics: POST `https://vmilliand.app.n8n.cloud/webhook/analytics`

## 📊 Analytics Example Request

```bash
curl -X POST "https://vmilliand.app.n8n.cloud/webhook/analytics" \
  -H "Content-Type: application/json" \
  -H "x-master-secret: YOUR_SECRET" \
  -d '{
    "period": "today",
    "requestedBy": "nexxa"
  }'
```

**Response**:
```json
{
  "status": "success",
  "output": {
    "summary": "...",
    "kpis": {
      "messages": 150,
      "leads": 25,
      "conversions": 5
    },
    "trend": "up"
  }
}
```

## 🔧 Development

### File Structure
```
/Local Sites/SkyBot/
├── agents/
│   ├── active/           ← Production agents (8 active)
│   │   ├── sales/
│   │   ├── service/
│   │   ├── analytics/
│   │   └── core/
│   └── templates/        ← Unused templates (for reference)
├── config/
│   └── bot_config.json
└── connectors/
    ├── meta.json
    ├── openai.json
    └── ...
```

### Scripts Archive
Temporary fix scripts (already applied):
```
/skybot-inbox/scripts/archive/
├── fix_analytics_mappings.py
├── fix_analytics_timestamp.py
├── fix_error_handler_auth.py
├── fix_error_handler_env_vars.py
├── fix_crm_upper_formula.py
└── fix_crm_newline_trim.py
```

## 🐛 Troubleshooting

### Common Issues

**1. Webhook 404 Error**
- Ensure workflow is ACTIVE in n8n
- Check webhook path matches URL

**2. Airtable Formula Errors**
- All formulas must start with `=`
- Example: `=AND({field} = 'value', ...)`

**3. Environment Variable Errors**
- n8n Cloud doesn't support `$env` access
- Use hardcoded values or credentials instead

**4. Multi-Tenant Data Leakage**
- Always filter by `clientKey` / `client_id` in Airtable queries
- Verify `filterByFormula` includes client filter

## 📈 Monitoring

### Agent Performance Dashboard
Track via Airtable tables:
- **AgentLogs**: Execution time, success rate per agent
- **analytics_reports**: Historical KPI trends
- **ErrorLogs**: Error frequency by agent

### Key Metrics
- Orders processed per day
- Lead conversion rate
- Average response time
- Error rate by agent

## 🔐 Security

- All webhooks require `x-master-secret` header
- Multi-tenant isolation via client filtering
- No `$env` variable usage (n8n Cloud restriction)
- Credentials stored in n8n encrypted vault

## 📝 Contributing

### Adding a New Agent
1. Create workflow in `/agents/active/[category]/`
2. Add webhook with authentication
3. Include multi-tenant filtering in all Airtable queries
4. Add AgentLogs entry on execution
5. Test with `clientKey` parameter

### Deploying Changes
1. Export workflow from n8n UI
2. Save to `/agents/active/`
3. Test in staging environment
4. Activate in production

## 📞 Support

- **Issues**: Report bugs in the project repository
- **Documentation**: Check `/docs` folder for detailed guides
- **API Reference**: See Postman collection for endpoint specs

## 📄 License

Proprietary - SkyBot Platform

---

**Last Updated**: January 21, 2026
**Version**: 1.0.0
**Active Agents**: 8
**Status**: ✅ Production Ready
