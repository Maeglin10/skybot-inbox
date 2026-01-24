-- Rollback migration: Keep legacy theme values for backward compatibility
-- This migration ensures all theme values exist without breaking production

-- Restore Theme_old to Theme if the rename happened
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Theme_old') THEN
    -- If Theme_old exists, it means the failed migration partially executed
    -- Drop the new Theme type if it exists
    DROP TYPE IF EXISTS "Theme" CASCADE;
    -- Rename Theme_old back to Theme
    ALTER TYPE "Theme_old" RENAME TO "Theme";
  END IF;
END
$$;

-- Add missing theme values if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LIGHT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Theme')) THEN
    ALTER TYPE "Theme" ADD VALUE 'LIGHT';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DARK' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Theme')) THEN
    ALTER TYPE "Theme" ADD VALUE 'DARK';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SYSTEM' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Theme')) THEN
    ALTER TYPE "Theme" ADD VALUE 'SYSTEM';
  END IF;
END
$$;

-- Migrate any remaining DARK/LIGHT/SYSTEM values to new themes (idempotent)
UPDATE "UserPreference" SET theme = 'DEFAULT' WHERE theme IN ('LIGHT', 'SYSTEM');
UPDATE "UserPreference" SET theme = 'DRACULA' WHERE theme = 'DARK';
