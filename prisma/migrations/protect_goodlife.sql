-- PROTECTION: Empêcher la suppression de GoodLife Costa Rica
-- Ce trigger bloque toute tentative de suppression du compte GoodLife

CREATE OR REPLACE FUNCTION prevent_goodlife_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name ILIKE '%goodlife%' THEN
    RAISE EXCEPTION 'INTERDIT: Le compte GoodLife ne peut pas être supprimé!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_goodlife_account ON "Account";

CREATE TRIGGER protect_goodlife_account
BEFORE DELETE ON "Account"
FOR EACH ROW
EXECUTE FUNCTION prevent_goodlife_deletion();
