# 🔍 Airtable Connection Status
**Date**: 2026-01-24 20:30
**API Key**: patyBuSMpO0pcbzZE.73...
**Base ID**: ***REMOVED***

---

## ✅ Tables Accessibles (2/4)

### 1. ✅ Leads
- **Status**: Accessible
- **Records**: 3
- **Fields**:
  - `lead_id` (Text)
  - `custom_lead_code` (Text)
- **Sample Data**:
  ```json
  {
    "lead_id": "-5jo",
    "custom_lead_code": "-5jo"
  }
  ```

**⚠️ Issue**: Cette table semble très basique. Le backend s'attend à plus de champs pour le CRM (name, company, email, phone, status, temperature, channel, etc.)

---

### 2. ✅ Notifications
- **Status**: Accessible
- **Records**: 3
- **Fields**:
  - `message` (Long Text)
  - `type` (Single Select)
  - `priority` (Single Select)
  - `leadName` (Text)
  - `timestamp` (Date)
- **Sample Data**:
  ```json
  {
    "message": "🟡 TICKET ESCALADO...",
    "type": "ticket_escalation",
    "priority": "high",
    "leadName": "Carlos Test",
    "timestamp": "2026-01-18"
  }
  ```

**✅ Perfect**: Cette table semble bien structurée et correspond aux attentes du backend.

---

## ❌ Tables Non Accessibles (2/4)

### 3. ❌ Feedbacks
- **Status**: Not authorized
- **Error**: "You are not authorized to perform this operation"

**Cause**: La clé API Personal Access Token (PAT) n'a pas les permissions pour accéder à cette table.

**Solution**:
1. Aller sur [Airtable Tokens](https://airtable.com/create/tokens)
2. Éditer le token `patyBuSMpO0pcbzZE`
3. Vérifier que la base `***REMOVED***` est sélectionnée
4. Ajouter les permissions pour la table `Feedbacks`:
   - ✅ Read records
   - ✅ Create records
   - ✅ Update records
   - ✅ Delete records (optionnel)
5. Sauvegarder les changements

---

### 4. ❌ client_config
- **Status**: Not authorized (probablement table n'existe pas)
- **Error**: "You are not authorized to perform this operation"

**Cause**: La table `client_config` n'existe probablement pas dans Airtable.

**Solution**: Créer la table `client_config` avec les champs suivants:

#### Champs Requis pour client_config

| Field Name | Type | Description |
|------------|------|-------------|
| `client_key` | Single line text | Unique identifier (ex: "nexxa") |
| `account_id` | Single line text | Lien vers Account ID |
| `stripe_api_key` | Single line text | Stripe API key (secret) |
| `stripe_webhook_secret` | Single line text | Stripe webhook secret |
| `paypal_business_email` | Email | PayPal business email |
| `bank_iban` | Single line text | Bank IBAN |
| `bank_bic` | Single line text | Bank BIC/SWIFT |
| `bank_name` | Single line text | Bank name |
| `crypto_btc_wallet` | Single line text | Bitcoin wallet address |
| `crypto_eth_wallet` | Single line text | Ethereum wallet address |
| `crypto_usdt_wallet` | Single line text | USDT wallet address |
| `sinpe_phone` | Phone | SINPE Móvil phone number |
| `payment_methods` | Multiple select | Enabled payment methods |

**Payment Methods Options**:
- `stripe` - Stripe (cards)
- `paypal` - PayPal
- `bank_transfer` - Bank Transfer
- `crypto_btc` - Bitcoin
- `crypto_eth` - Ethereum
- `crypto_usdt` - USDT (Tether)
- `sinpe` - SINPE Móvil (Costa Rica)

#### Exemple de Record
```json
{
  "client_key": "nexxa",
  "account_id": "nexxa-main-account",
  "stripe_api_key": "sk_live_xxx",
  "paypal_business_email": "payments@nexxa.global",
  "bank_name": "Banco Nacional de Costa Rica",
  "bank_iban": "CR12345678901234567890",
  "sinpe_phone": "+50671996544",
  "payment_methods": ["stripe", "paypal", "sinpe"]
}
```

---

## 🔧 Impact sur le Backend

### Analytics Service
**Status**: ⚠️ Partiellement fonctionnel

Le service Analytics (src/analytics/analytics.service.ts) fait des requêtes sur:
- ✅ `Leads` - OK mais avec moins de champs que prévu
- ❌ `Feedbacks` - Bloqué, les analytics ne fonctionneront pas complètement

**Code affecté**:
```typescript
// src/analytics/analytics.service.ts:117
const feedbacks = await this.airtable.query<FeedbackRecord>(
  'Feedbacks',
  clientKey,
  undefined,
  { maxRecords: 1000, pageSize: 100 },
); // ❌ Va échouer avec "Not authorized"
```

### CRM Service
**Status**: ⚠️ Partiellement fonctionnel

Le service CRM (src/crm/crm.service.ts) devrait aussi accéder à `Leads` et `Feedbacks`.

---

## 📋 Actions Requises

### Priorité P0 (Blocker)
1. **Ajouter permissions Feedbacks à la clé API** → Sans ça, les analytics et CRM ne fonctionnent pas
   - Aller sur https://airtable.com/create/tokens
   - Éditer le token existant
   - Ajouter permissions pour table Feedbacks

### Priorité P1 (Important)
2. **Créer la table client_config** → Nécessaire pour le système de paiement (Orders agent)
   - Créer manuellement dans Airtable
   - Ou demander à quelqu'un qui a accès

3. **Enrichir la table Leads** → Actuellement très limitée
   - Ajouter les champs: name, company, email, phone, status, temperature, channel, assignedTo, tags, notes, createdAt, updatedAt

### Priorité P2 (Nice to have)
4. **Vérifier la structure de Feedbacks** → S'assurer qu'elle a les bons champs
   - Une fois les permissions ajoutées, vérifier avec `scripts/test-airtable-detailed.ts`

---

## ✅ Test Command

Pour vérifier que tout fonctionne après les changements:
```bash
npx tsx scripts/test-airtable-detailed.ts
```

Résultat attendu:
```
✨ 4/4 tables accessible
```

---

## 🔗 Liens Utiles

- [Airtable Tokens Management](https://airtable.com/create/tokens)
- [Airtable Base](https://airtable.com/***REMOVED***)
- Script de test: `scripts/test-airtable-detailed.ts`
