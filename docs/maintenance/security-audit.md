# SECURITY AUDIT REPORT
**Date**: 2026-01-15
**Repos Audited**: skybot-inbox, SkyBot (n8n workflows)

---

## A) SECURITY FINDINGS REPORT

### ✅ CONFIRMED: NO CRITICAL SECRETS LEAKED

Both repositories have **NO hardcoded secrets** in tracked files. The `.env` files are properly gitignored.

---

### FINDINGS BY CATEGORY

#### 1. SECRETS & CREDENTIALS

| Severity | File | Issue | Status |
|----------|------|-------|--------|
| ✅ OK | `.env` | Not tracked in git | SAFE |
| ✅ OK | `.env.example` | Contains placeholders only | SAFE |
| ⚠️ LOW | `prisma/seed.ts:60,65` | Demo phone `573001112233` | Fake data - OK |
| ⚠️ LOW | `scripts/sign-whatsapp.ts:17` | Demo phone `573001112233` | Fake data - OK |

#### 2. INTERNAL ENDPOINTS / HOSTNAMES

| Severity | File | Line | Issue | Fix Required |
|----------|------|------|-------|--------------|
| 🟡 MEDIUM | `SkyBot/N8N-IMPORT-GUIDE.md` | 675 | Hardcoded n8n URL: `vmilliand.app.n8n.cloud` | YES - Replace with placeholder |
| 🟡 MEDIUM | `SkyBot/n8n-import-all-agents.json` | 81 | Hardcoded n8n URL | YES - Replace with placeholder |
| 🟡 MEDIUM | `SkyBot/test-agents.sh` | 5 | Default n8n URL | YES - Replace with placeholder |

#### 3. PII / TEST DATA

| Severity | File | Issue | Status |
|----------|------|-------|--------|
| ✅ OK | `test-agents.sh` | Fake phones `+34612345678` | Clearly fake - OK |
| ✅ OK | `N8N-IMPORT-GUIDE.md` | Fake phones in examples | Clearly fake - OK |
| ✅ OK | `prisma/seed.ts` | Demo data with fake phone | Dev seed - OK |

#### 4. CI/CD

| Status | Finding |
|--------|---------|
| ✅ OK | No `.github/workflows` in project root |
| ✅ OK | No secrets in build scripts |

#### 5. LOGGING

| Status | Finding |
|--------|---------|
| ✅ OK | No `console.log` with secrets/keys/tokens |
| ✅ OK | Logger calls don't expose sensitive data |

---

## B) REPO HARDENING PATCH SET

### PATCH 1: SkyBot/N8N-IMPORT-GUIDE.md (Remove hardcoded URL)

**Before (line 675):**
```bash
curl -X POST https://vmilliand.app.n8n.cloud/webhook/whatsapp-master-webhook \
```

**After:**
```bash
curl -X POST https://YOUR_N8N_INSTANCE.app.n8n.cloud/webhook/whatsapp-master-webhook \
```

**Before (line 677):**
```bash
  -H "x-master-secret: TON_SECRET_ICI" \
```

**After:**
```bash
  -H "x-master-secret: YOUR_SECRET_HERE" \
```

---

### PATCH 2: SkyBot/n8n-import-all-agents.json (Remove hardcoded URL)

**Before (line 81):**
```json
"N8N_WEBHOOK_URL": "https://vmilliand.app.n8n.cloud/webhook",
```

**After:**
```json
"N8N_WEBHOOK_URL": "https://YOUR_N8N_INSTANCE.app.n8n.cloud/webhook",
```

---

### PATCH 3: SkyBot/test-agents.sh (Remove default URL)

**Before (line 5):**
```bash
N8N_URL="${1:-https://vmilliand.app.n8n.cloud/webhook}"
```

**After:**
```bash
N8N_URL="${1:-https://YOUR_N8N_INSTANCE.app.n8n.cloud/webhook}"
```

---

### PATCH 4: skybot-inbox/.gitignore (Add safety entries)

**Add these lines:**
```gitignore
# Security: Never commit these
*.pem
*.key
*.p12
credentials.json
service-account*.json
.env.production
.env.staging

# Logs that might contain sensitive data
logs/
*.log
```

---

### PATCH 5: SkyBot/.gitignore (Add safety entries)

**Add these lines:**
```gitignore
# Security
*.pem
*.key
credentials.json
.env.production

# Exports that might contain credentials
exports/*.json
SkyBot_Final_Export.zip
```

---

### PATCH 6: Create SkyBot/.env.example

```bash
# === N8N / GATEWAY ===
PORT=3000
NODE_ENV=development

# === WHATSAPP (Meta Cloud API) ===
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_ACCESS_TOKEN=your_permanent_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_verify_token

# === ROUTER ===
ROUTER_URL=https://your-n8n-instance.app.n8n.cloud/webhook/master-router

# === OPTIONAL: Render ===
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=srv-xxx
```

---

## C) PUBLIC-REPO SAFETY CHECKLIST

### ✅ IMMEDIATE ACTIONS (Before Sharing)

1. **[ ] Apply Patches 1-3**: Remove hardcoded `vmilliand.app.n8n.cloud` URLs
   ```bash
   # In SkyBot repo
   sed -i '' 's/vmilliand.app.n8n.cloud/YOUR_N8N_INSTANCE.app.n8n.cloud/g' N8N-IMPORT-GUIDE.md
   sed -i '' 's/vmilliand.app.n8n.cloud/YOUR_N8N_INSTANCE.app.n8n.cloud/g' n8n-import-all-agents.json
   sed -i '' 's/vmilliand.app.n8n.cloud/YOUR_N8N_INSTANCE.app.n8n.cloud/g' test-agents.sh
   ```

2. **[ ] Commit the patches**:
   ```bash
   git add -A && git commit -m "security: remove hardcoded n8n URLs"
   git push origin main
   ```

3. **[ ] Verify no secrets remain**:
   ```bash
   # Run in each repo
   git log -p --all -S "vmilliand" | head -50
   git log -p --all -S "sk-" | head -50
   git log -p --all -S "api_key=" | head -50
   ```

### 🔐 SECRETS TO ROTATE (If Exposed)

| Secret | Where to Rotate | Priority |
|--------|-----------------|----------|
| N8N_MASTER_ROUTER_SECRET | Render env + n8n Header Auth credential | HIGH if URL was shared |
| WHATSAPP_APP_SECRET | Meta Developer Console | HIGH if compromised |
| WHATSAPP_ACCESS_TOKEN | Meta Developer Console | HIGH if compromised |
| API_KEY (skybot-inbox) | Render env | MEDIUM |
| Airtable PAT | Airtable account settings | MEDIUM if n8n shared |

### 🛡️ GITHUB SETTINGS (Even for Public Repo)

1. **Settings → Branches → Branch protection rules**:
   - Require pull request reviews before merging
   - Require status checks to pass

2. **Settings → Secrets and variables → Actions**:
   - Never store secrets here unless using GitHub Actions

3. **Settings → Code security → Secret scanning**:
   - Enable "Secret scanning" alerts

---

## D) ESTIMATE.md (For External Developer)

```markdown
# SkyBot Estimation Package

## Project Overview

SkyBot is a WhatsApp automation platform with two main components:

1. **skybot-inbox** (NestJS Backend)
   - WhatsApp webhook ingestion
   - Multi-tenant client configuration
   - Conversation routing to n8n agents
   - Message persistence (PostgreSQL + Prisma)

2. **SkyBot** (n8n Workflows)
   - Master Router: classifies incoming messages
   - Agent workflows: CRM, Setter, Closer, Orders, Booking, AfterSale, Info
   - Airtable integration for data persistence
   - OpenAI integration for NLP

## Architecture Flow

```
WhatsApp Cloud API
       ↓
   Meta Webhook
       ↓
┌──────────────────┐
│  skybot-inbox    │  (NestJS on Render)
│  /webhooks/wa    │
└────────┬─────────┘
         ↓
   Signature validation
   Contact/Conv upsert
   Message persistence
         ↓
┌──────────────────┐
│  n8n Cloud       │  (Master Router)
│  /webhook/master │
└────────┬─────────┘
         ↓
   GPT Classifier
   Route to Agent
         ↓
┌──────────────────┐
│  Agent Workflow  │  (CRM, Setter, etc.)
│  OpenAI + Airtable│
└────────┬─────────┘
         ↓
   replyText response
         ↓
   skybot-inbox saves OUT message
   (WhatsApp send handled separately)
```

## Key Files to Review

### skybot-inbox
| File | Purpose |
|------|---------|
| `src/agents/agents.service.ts` | Triggers n8n Master Router |
| `src/webhooks/webhooks.service.ts` | WhatsApp webhook handler |
| `src/clients/clients.service.ts` | Multi-tenant resolution |
| `prisma/schema.prisma` | Database schema |

### SkyBot (n8n)
| File | Purpose |
|------|---------|
| `agents/core/master-router.json` | Main routing workflow |
| `agents/sales/setter.json` | Lead qualification |
| `agents/service/crm.json` | CRM operations |
| `N8N-IMPORT-GUIDE.md` | Agent configuration docs |

## Known Issues / TODOs

1. **Master Router GPT Classifier**: Currently uses OpenAI Assistant API - may need migration to Chat Completions for cost optimization
2. **Airtable rate limits**: No retry logic implemented yet
3. **WhatsApp send**: Not yet integrated (currently manual or via n8n)
4. **UI (skybot-inbox-ui)**: Next.js frontend - incomplete, needs conversation list + thread view

## What NOT to Estimate

- n8n Cloud subscription/hosting
- Meta Business verification
- Airtable schema design (already done)
- OpenAI Assistant configuration (already done)

## Estimation Scope

Please estimate:
1. Remaining backend work (webhook error handling, retry logic)
2. UI completion (inbox view, conversation threading)
3. WhatsApp send integration
4. Testing + deployment pipeline

## Contact

For questions during estimation, contact: [REDACTED]
```

---

## SUMMARY

| Check | Status |
|-------|--------|
| Secrets in tracked files | ✅ NONE |
| .env tracked in git | ✅ NO (gitignored) |
| Hardcoded URLs | ⚠️ 3 files need patching |
| PII in code | ✅ Only fake test data |
| CI/CD secrets | ✅ No workflows exist |
| Logging secrets | ✅ Clean |

### VERDICT: SAFE TO SHARE AFTER 3 PATCHES

The repositories are **safe to remain public** after applying the 3 URL patches. No actual secrets are committed. The hardcoded `vmilliand.app.n8n.cloud` URL is a disclosure of your n8n instance but contains no credentials - still recommended to replace for privacy.

**Minimum actions before sharing:**
1. Apply patches 1-3 (replace hardcoded URLs)
2. Commit and push
3. Share with external developer
