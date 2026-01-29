-- Mark GoodLife as production account (isDemo = false)
-- This ensures it will never be deleted by seed or any cleanup scripts

UPDATE "Account"
SET "isDemo" = false
WHERE name ILIKE '%goodlife%';
