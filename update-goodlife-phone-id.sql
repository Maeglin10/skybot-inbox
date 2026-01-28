-- ============================================
-- Mise à jour du Phone Number ID pour GoodLife
-- ============================================

-- 1. Trouver l'ID du compte GoodLife
SELECT id, name FROM "Account" WHERE name ILIKE '%goodlife%';

-- 2. Afficher les ExternalAccounts existants pour GoodLife
SELECT
  ea.id,
  ea."accountId",
  ea.channel,
  ea."externalId",
  ea."clientKey",
  ea.name,
  ea."isActive"
FROM "ExternalAccount" ea
JOIN "Account" a ON ea."accountId" = a.id
WHERE a.name ILIKE '%goodlife%';

-- 3. Mettre à jour le externalId avec le nouveau Phone Number ID
UPDATE "ExternalAccount"
SET "externalId" = '966520989876579',
    "updatedAt" = NOW()
WHERE channel = 'WHATSAPP'
  AND "accountId" = (SELECT id FROM "Account" WHERE name ILIKE '%goodlife%' LIMIT 1);

-- 4. Vérifier la mise à jour
SELECT
  ea.id,
  ea."accountId",
  ea.channel,
  ea."externalId",
  ea."clientKey",
  ea.name,
  ea."isActive",
  ea."updatedAt"
FROM "ExternalAccount" ea
JOIN "Account" a ON ea."accountId" = a.id
WHERE a.name ILIKE '%goodlife%';
