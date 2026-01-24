# 🚨 URGENT FIX - Résoudre la Migration Failed sur Render

## Problème
La migration `20260124063500_remove_legacy_themes` a échoué et bloque tous les déploiements.

## Solution Immédiate (5 minutes)

### Étape 1 : Ouvrir le Shell Render
1. Va sur https://dashboard.render.com
2. Sélectionne ton service **skybot-inbox**
3. Clique sur l'onglet **Shell** (en haut)
4. Attends que le shell s'ouvre

### Étape 2 : Exécuter ces commandes dans le Shell

Copie-colle ces commandes une par une :

```bash
# 1. Marquer la migration failed comme rolled back
npx prisma migrate resolve --rolled-back 20260124063500_remove_legacy_themes

# 2. Vérifier le statut
npx prisma migrate status

# 3. Déployer les migrations restantes
npx prisma migrate deploy

# 4. Vérifier que tout est OK
npx prisma migrate status
```

### Étape 3 : Changer la Start Command (IMPORTANT)

1. Va dans **Settings** de ton service
2. Trouve **Start Command**
3. Change de :
   ```
   npx prisma migrate deploy && npm run db:seed && node dist/src/main
   ```

   À :
   ```
   bash start.sh
   ```
4. Clique sur **Save Changes**

### Étape 4 : Redéployer

Trigger un nouveau déploiement (Manual Deploy ou push un commit).

## Pourquoi ça arrive ?

La migration `20260124063500` essayait de recréer l'enum PostgreSQL, ce qui est une opération risquée. Elle a partiellement échoué, laissant la base dans un état inconsistant.

## Notre Fix

Le script `start.sh` résout automatiquement ce problème à chaque démarrage :
1. Marque la migration failed comme rolled back
2. Deploy les nouvelles migrations (dont `20260124064000_rollback_theme_cleanup`)
3. Seed la DB
4. Démarre l'app

## Si tu veux éviter le Shell

Alternative rapide : supprime manuellement la migration de la table `_prisma_migrations` :

```sql
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260124063500_remove_legacy_themes';
```

Puis redéploie.
