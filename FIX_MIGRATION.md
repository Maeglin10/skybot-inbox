# Fix Failed Migration on Render

## Problem
The migration `20260124063500_remove_legacy_themes` failed in production because it tried to recreate the Theme enum.

## Solution
We've created a rollback migration that keeps legacy values for backward compatibility.

## Steps to Fix on Render

### Option 1: Via Render Shell (Recommended)

1. Open Render Shell for your service
2. Run these commands:

```bash
# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back 20260124063500_remove_legacy_themes

# Verify migrations status
npx prisma migrate status

# Deploy remaining migrations
npx prisma migrate deploy
```

### Option 2: Update via Environment Variable

Add this to your Render environment variables:
```
PRISMA_MIGRATE_SKIP_GENERATE=true
```

Then redeploy.

### Option 3: Via Script (Automated)

We can add a pre-deploy script to handle this automatically.

## What Changed

1. **Removed problematic migration**: `20260124063500_remove_legacy_themes`
2. **Added rollback migration**: `20260124064000_rollback_theme_cleanup`
3. **Updated schema**: Kept LIGHT, DARK, SYSTEM in enum for backward compatibility
4. **All new code uses**: DEFAULT, NORD, GOLD, NATURE, NETFLIX, LARACON, DRACULA

## Testing

Build passes locally:
```bash
npm run build  # ✅ Success
```

All theme values are now supported:
- New themes: DEFAULT, NORD, GOLD, NATURE, NETFLIX, LARACON, DRACULA
- Legacy themes: LIGHT, DARK, SYSTEM (kept for compatibility)
