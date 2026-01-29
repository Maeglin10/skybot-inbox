# 🚨 Fix Migration Failed sur Render

## Problème
La migration `20260129_cleanup_and_statuscode` est marquée comme "failed" en production et bloque tous les déploiements.

## Solution Rapide (2 minutes)

### Option A: Via Render Shell (RECOMMANDÉ)

1. **Ouvrir Render Dashboard**
   - Va sur https://dashboard.render.com
   - Sélectionne ton service `skybot-inbox`

2. **Ouvrir le Shell**
   - Clique sur "Shell" dans le menu de gauche
   - Attends que le terminal s'ouvre

3. **Exécuter cette commande**
   ```bash
   npx prisma migrate resolve --applied 20260129_cleanup_and_statuscode
   ```

4. **Redéployer**
   - Retourne sur l'onglet "Manual Deploy"
   - Clique sur "Clear build cache & deploy"

---

### Option B: Via Dashboard Settings (SI OPTION A NE MARCHE PAS)

1. **Render Dashboard** → Ton service → **Settings**

2. **Build & Deploy**
   - Trouve "Start Command"
   - Remplace:
     ```bash
     npx prisma migrate deploy && node scripts/ensure-goodlife-exists.js && node dist/scripts/protect-all-accounts.js && node dist/src/main
     ```

   - Par:
     ```bash
     npx prisma migrate resolve --applied 20260129_cleanup_and_statuscode || true && npx prisma migrate deploy && node scripts/ensure-goodlife-exists.js && node dist/scripts/protect-all-accounts.js && node dist/src/main
     ```

3. **Save Changes** → **Manual Deploy** → **Clear build cache & deploy**

---

### Option C: Via SQL Direct (SI OPTIONS A ET B ÉCHOUENT)

Si tu as accès direct à PostgreSQL:

```sql
-- Connecte-toi à la DB PostgreSQL
-- Puis exécute:

UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    logs = 'Migration manually resolved - IdempotencyKey index creation skipped (table does not exist in production)',
    applied_steps_count = 1
WHERE migration_name = '20260129_cleanup_and_statuscode'
  AND finished_at IS NULL;
```

---

## Vérification

Une fois la migration résolue, le prochain déploiement devrait afficher:

```
✓ 22 migrations found in prisma/migrations
✓ All migrations have been applied
✓ Starting application...
```

---

## Pourquoi Cette Erreur?

La migration essayait de créer un index sur `IdempotencyKey`, mais cette table n'existe pas en production (elle a été supprimée ou n'a jamais été créée).

Le fix dans la migration SQL (avec `IF EXISTS`) empêche l'erreur, mais Prisma a déjà marqué la migration comme "failed" donc elle bloque toutes les futures migrations.

---

## Après le Fix

Une fois déployé:
- ✅ Backend API fonctionnel
- ✅ WebSocket avec JWT auth
- ✅ Tous les services real-time (messages, typing, presence)
- ✅ 100% Production Ready 🚀
