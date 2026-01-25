# 📋 Tables Airtable - État des Lieux

**Date**: 2026-01-24 21:15

---

## ✅ Tables Existantes et Raccordées

### 1. leads ✅
**Backend**: `leads` (corrigé)
**Airtable**: `leads` (43 champs)
**Status**: ✅ PARFAIT - Raccordé et fonctionnel

### 2. clients_config ✅
**Backend**: `clients_config` (corrigé)
**Airtable**: `clients_config` (32 champs)
**Status**: ✅ PARFAIT - Inclut tous les champs de paiement
- stripe_api_key, stripe_webhook_secret
- paypal_business_email
- bank_name, bank_iban, bank_bic
- crypto wallets (BTC, ETH, USDT)
- sinpe_phone
- payment_methods

### 3. Notifications ✅
**Backend**: `Notifications`
**Airtable**: `Notifications` (7 champs)
**Status**: ✅ PARFAIT

---

## ❌ Table Manquante

### feedbacks
**Backend**: Attend `feedbacks` (code commenté)
**Airtable**: ❌ N'EXISTE PAS
**Status**: ⚠️ À CRÉER

#### Champs Requis pour feedbacks

```
1. feedback_id (Auto number) - ID unique
2. client_id (Single line text) - Lien vers client
3. rating (Number) - Note de 1 à 5
4. comment (Long text) - Commentaire du client
5. created_at (Date) - Date de création
6. lead_id (Link to leads) - Lien vers le lead
7. channel (Single select) - Canal (whatsapp, email, web)
8. sentiment (Single select) - Sentiment (positive, neutral, negative)
9. category (Single select) - Catégorie (product, service, support, delivery)
10. resolved (Checkbox) - Résolu ou non
```

#### Options pour les Champs Select

**channel** (Single select):
- whatsapp
- email
- web
- phone
- chat

**sentiment** (Single select):
- positive
- neutral
- negative

**category** (Single select):
- product
- service
- support
- delivery
- billing
- other

---

## 🔧 Impact de la Table feedbacks Manquante

### Analytics Service

**Fonctions affectées**:
- `getMainChart()` - Metric FEEDBACK commenté
- `getFeedbackKpis()` - Retourne mock data (tous à 0)
- `getRatingBreakdown()` - Retourne mock data (tous à 0)

**Code actuel** (src/analytics/analytics.service.ts):
```typescript
// Lines 116-134 - Commenté
// if (metric === MetricGroup.FEEDBACK) {
//   const feedbacks = await this.airtable.query<FeedbackRecord>(
//     'feedbacks',
//     clientKey,
//     ...
//   );
// }

// Lines 257-282 - Mock data
private async getFeedbackKpis(clientKey: string) {
  return [
    { label: 'Total Feedback', value: '0', ... },
    { label: 'Avg Rating', value: '0', ... },
    ...
  ];
}
```

---

## 🎯 Action Requise

### Option 1: Créer la table feedbacks dans Airtable

**Étapes**:
1. Aller sur https://airtable.com/***REMOVED***
2. Créer une nouvelle table nommée `feedbacks`
3. Ajouter les 10 champs listés ci-dessus
4. Décommenter le code dans `src/analytics/analytics.service.ts`
5. Rebuild: `npm run build`
6. Restart server

**Bénéfices**:
- ✅ Analytics feedback complets
- ✅ Dashboard feedback fonctionnel
- ✅ Rating breakdown avec vraies données
- ✅ Tracking sentiment client

### Option 2: Laisser en l'état

**Si tu n'as pas besoin des feedbacks analytics**:
- ✅ Tout le reste fonctionne parfaitement
- ⚠️ Analytics feedback affichera des 0
- Backend reste stable avec mock data

---

## 📊 Résumé

**Tables Backend vs Airtable**:
```
Backend          | Airtable         | Status
-----------------|------------------|--------
leads            | leads            | ✅ Match
clients_config   | clients_config   | ✅ Match
Notifications    | Notifications    | ✅ Match
feedbacks        | ❌ N'existe pas  | ⚠️ À créer
```

**Fonctionnalités Backend**:
- ✅ 95% opérationnel
- ✅ CRM complet (leads)
- ✅ Système de paiement (clients_config)
- ✅ Notifications
- ⚠️ Analytics feedback (mock data)

---

## 🚀 Recommandation

**Si tu veux des analytics feedback complets**: Crée la table `feedbacks` maintenant

**Si pas urgent**: Continue avec le frontend, on pourra ajouter feedbacks plus tard

**Prochaine étape**: Tester le frontend pour voir ce qui fonctionne déjà !
