-- Step 2: Migrate existing data from legacy themes to new themes
-- (Already done manually via psql, but keeping here for production deployment)
UPDATE "UserPreference" SET theme = 'DEFAULT' WHERE theme IN ('LIGHT', 'SYSTEM');
UPDATE "UserPreference" SET theme = 'DRACULA' WHERE theme = 'DARK';

-- Step 3: Change default value before removing old enum values
ALTER TABLE "UserPreference" ALTER COLUMN "theme" SET DEFAULT 'DEFAULT';

-- Step 4: Remove legacy enum values
-- Note: PostgreSQL doesn't support ALTER TYPE DROP VALUE, so we need to recreate the enum
ALTER TYPE "Theme" RENAME TO "Theme_old";

CREATE TYPE "Theme" AS ENUM ('DEFAULT', 'NORD', 'GOLD', 'NATURE', 'NETFLIX', 'LARACON', 'DRACULA');

ALTER TABLE "UserPreference" ALTER COLUMN "theme" TYPE "Theme" USING theme::text::"Theme";

DROP TYPE "Theme_old";
