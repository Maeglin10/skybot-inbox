-- PROTECTION: Empêcher la suppression de TOUS les comptes en production
-- Ce trigger bloque toute tentative de suppression de compte en environnement de production

CREATE OR REPLACE FUNCTION prevent_account_deletion_in_production()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloquer la suppression seulement en production
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'INTERDIT: La suppression de comptes est désactivée en production. Utilisez le statut INACTIVE à la place.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS protect_all_accounts ON "Account";

-- Créer le trigger
CREATE TRIGGER protect_all_accounts
BEFORE DELETE ON "Account"
FOR EACH ROW
EXECUTE FUNCTION prevent_account_deletion_in_production();

-- Protection spécifique GoodLife (même en dev, ne jamais supprimer GoodLife)
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
