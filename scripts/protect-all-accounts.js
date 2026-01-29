#!/usr/bin/env node
require('dotenv/config');
const { Pool } = require('pg');

async function protectAllAccounts() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🛡️  [PROTECT] Installing database protections...');

    // Set environment variable for trigger
    const env = process.env.NODE_ENV || 'development';
    await pool.query(`SET app.environment = '${env}'`);

    // SQL inline pour éviter les problèmes de chemin
    const sql = `
-- PROTECTION 1: Empêcher la suppression de TOUS les comptes en production
CREATE OR REPLACE FUNCTION prevent_account_deletion_in_production()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'INTERDIT: La suppression de comptes est désactivée en production. Utilisez le statut INACTIVE à la place.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_all_accounts ON "Account";

CREATE TRIGGER protect_all_accounts
BEFORE DELETE ON "Account"
FOR EACH ROW
EXECUTE FUNCTION prevent_account_deletion_in_production();

-- PROTECTION 2: GoodLife Account ne peut JAMAIS être supprimé
CREATE OR REPLACE FUNCTION prevent_goodlife_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name ILIKE '%goodlife%' THEN
    RAISE EXCEPTION 'INTERDIT: Le compte GoodLife ne peut jamais être supprimé!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_goodlife_account ON "Account";

CREATE TRIGGER protect_goodlife_account
BEFORE DELETE ON "Account"
FOR EACH ROW
EXECUTE FUNCTION prevent_goodlife_deletion();

-- PROTECTION 3: Empêcher la suppression des UserAccount en production
CREATE OR REPLACE FUNCTION prevent_user_deletion_in_production()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'INTERDIT: La suppression d''utilisateurs est désactivée en production. Utilisez le statut INACTIVE à la place.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_all_users ON "UserAccount";

CREATE TRIGGER protect_all_users
BEFORE DELETE ON "UserAccount"
FOR EACH ROW
EXECUTE FUNCTION prevent_user_deletion_in_production();

-- PROTECTION 4: GoodLife UserAccount ne peut JAMAIS être supprimé
CREATE OR REPLACE FUNCTION prevent_goodlife_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username = 'goodlife.nexxaagents' OR OLD.email ILIKE '%goodlife%' THEN
    RAISE EXCEPTION 'INTERDIT: L''utilisateur GoodLife ne peut jamais être supprimé!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_goodlife_user ON "UserAccount";

CREATE TRIGGER protect_goodlife_user
BEFORE DELETE ON "UserAccount"
FOR EACH ROW
EXECUTE FUNCTION prevent_goodlife_user_deletion();

-- PROTECTION 5: Empêcher TRUNCATE en production
CREATE OR REPLACE FUNCTION prevent_truncate_in_production()
RETURNS event_trigger AS $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'INTERDIT: TRUNCATE est désactivé en production!';
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS prevent_truncate_trigger;

CREATE EVENT TRIGGER prevent_truncate_trigger
ON ddl_command_start
WHEN TAG IN ('TRUNCATE')
EXECUTE FUNCTION prevent_truncate_in_production();
`;

    await pool.query(sql);

    console.log('✅ [PROTECT] Protection installed successfully!');
    console.log('   ✅ Account: Protected from deletion in production');
    console.log('   ✅ UserAccount: Protected from deletion in production');
    console.log('   ✅ GoodLife Account: NEVER deletable (even in dev)');
    console.log('   ✅ GoodLife User: NEVER deletable (even in dev)');
    console.log('   ✅ TRUNCATE: Blocked in production');
    console.log('');
    console.log('💡 Use status INACTIVE instead of DELETE');

    await pool.end();
  } catch (error) {
    console.error('❌ [PROTECT] Error:', error);
    await pool.end();
    throw error;
  }
}

protectAllAccounts().catch((error) => {
  console.error('❌ [PROTECT] Fatal error:', error);
  process.exit(1);
});
