# Database Backups Guide

## Vue d'ensemble

Les backups automatiques de la base de données PostgreSQL sont **CRITIQUES** pour la production. Ce guide explique comment configurer et tester les backups sur Render.

---

## Option 1: Render Automated Backups (Recommandé)

### Configuration

1. **Aller sur Render Dashboard**
   - https://dashboard.render.com

2. **Sélectionner votre PostgreSQL service**
   - Nom: `skybot-inbox-db` (ou nom de votre DB)

3. **Activer les backups automatiques**
   - Onglet "Settings" → section "Backups"
   - **Point-in-Time Recovery (PITR)**: Activé
   - **Retention**: 7 jours (gratuit) ou 30 jours (payant)
   - **Backup Schedule**: Quotidien à 2h00 UTC

4. **Vérifier la configuration**
   - Onglet "Backups" → voir la liste des backups
   - Un backup doit apparaître dans les 24h

### Plans Disponibles

| Plan | Backups | Retention | Prix |
|------|---------|-----------|------|
| Free | ❌ Non | - | $0 |
| Starter | ✅ PITR | 7 jours | $7/mois |
| Standard | ✅ PITR | 30 jours | $20/mois |
| Pro | ✅ PITR | 90 jours | $50/mois |

**Recommandation**: Passer au plan **Starter** minimum pour les backups.

### Tester la Restauration

1. **Créer un backup manuel**
   ```bash
   # Via Render Dashboard
   Onglet "Backups" → "Create Backup Now"
   ```

2. **Restaurer depuis un backup**
   ```bash
   # Via Render Dashboard
   Onglet "Backups" → Sélectionner backup → "Restore"
   ```

   **⚠️  WARNING**: La restauration écrase la DB actuelle!

3. **Test sur une nouvelle DB**
   - Créer une nouvelle PostgreSQL instance
   - Restaurer le backup dedans
   - Tester la connexion

---

## Option 2: Script de Backup Manuel

Si vous voulez garder le plan gratuit et faire des backups manuels:

### 1. Créer le Script

Fichier: `scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Créer le dossier backups
mkdir -p $BACKUP_DIR

echo "🔄 Starting database backup..."

# Vérifier que DATABASE_URL existe
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

# Effectuer le backup
pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $BACKUP_FILE"

  # Compresser le backup
  gzip $BACKUP_FILE
  echo "✅ Compressed: ${BACKUP_FILE}.gz"

  # Calculer la taille
  SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
  echo "📊 Size: $SIZE"

  # Nettoyer les backups > 30 jours
  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
  echo "🧹 Cleaned old backups (>30 days)"

else
  echo "❌ Backup failed"
  exit 1
fi

echo "✨ Backup complete!"
```

### 2. Rendre Exécutable

```bash
chmod +x scripts/backup-database.sh
```

### 3. Exécuter Manuellement

```bash
# Depuis le repo root
./scripts/backup-database.sh
```

### 4. Automatiser avec Cron (Serveur Linux)

```bash
# Éditer crontab
crontab -e

# Ajouter ligne pour backup quotidien à 2h00
0 2 * * * cd /path/to/skybot-inbox && ./scripts/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### 5. Upload vers Cloud Storage (Optionnel)

Pour sauvegarder hors du serveur:

**AWS S3**:

```bash
# Install AWS CLI
brew install awscli  # macOS
apt-get install awscli  # Ubuntu

# Configure credentials
aws configure

# Upload backup
aws s3 cp ./backups/backup_${TIMESTAMP}.sql.gz s3://your-bucket/db-backups/
```

**Google Cloud Storage**:

```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Authenticate
gcloud auth login

# Upload backup
gsutil cp ./backups/backup_${TIMESTAMP}.sql.gz gs://your-bucket/db-backups/
```

---

## Option 3: Backup via Render CLI

### 1. Installer Render CLI

```bash
npm install -g @render-oss/cli
```

### 2. Authenticate

```bash
render login
```

### 3. Lister les Services

```bash
render services
```

### 4. Créer un Backup

```bash
render postgres backup create <service-id>
```

### 5. Télécharger un Backup

```bash
render postgres backup download <service-id> <backup-id> -o backup.sql
```

---

## Procédure de Restauration

### Depuis un Backup Local (.sql.gz)

```bash
# 1. Décompresser
gunzip backup_20260125_020000.sql.gz

# 2. Restaurer (⚠️  DANGER: écrase la DB!)
psql $DATABASE_URL < backup_20260125_020000.sql

# 3. Vérifier
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"UserAccount\";"
```

### Depuis Render PITR

1. Render Dashboard → PostgreSQL service
2. Onglet "Backups"
3. Sélectionner le backup désiré
4. Click "Restore" → Confirmer

**⚠️  ATTENTION**:
- Arrêter l'application backend avant restauration
- Informer tous les users
- Tester sur une DB de test d'abord

---

## Testing Checklist

- [ ] Créer un backup manuel
- [ ] Vérifier que le fichier .sql existe
- [ ] Compresser le backup (.gz)
- [ ] Créer une nouvelle DB de test
- [ ] Restaurer le backup dans la DB test
- [ ] Vérifier les données (SELECT COUNT(*) sur chaque table)
- [ ] Se connecter à l'app avec la DB test
- [ ] Tester login et accès aux données

---

## Monitoring des Backups

### Script de Vérification

Fichier: `scripts/verify-backups.sh`

```bash
#!/bin/bash

echo "🔍 Checking recent backups..."

# Vérifier les backups locaux
RECENT_BACKUPS=$(find ./backups -name "backup_*.sql.gz" -mtime -1 | wc -l)

if [ $RECENT_BACKUPS -eq 0 ]; then
  echo "❌ WARNING: No backups in last 24h"
  exit 1
else
  echo "✅ Found $RECENT_BACKUPS recent backup(s)"
fi

# Lister les 5 derniers backups
echo ""
echo "📦 Recent backups:"
ls -lht ./backups/backup_*.sql.gz | head -5
```

### Alert Slack/Email (Optionnel)

Si aucun backup dans les 24h, envoyer une alerte:

```bash
# Dans verify-backups.sh
if [ $RECENT_BACKUPS -eq 0 ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"⚠️  WARNING: No database backup in last 24h!"}'
fi
```

---

## Stratégie 3-2-1

Pour une sécurité maximale, suivre la règle 3-2-1:

- **3 copies** des données:
  1. DB production (Render)
  2. Backup local (serveur)
  3. Backup cloud (S3/GCS)

- **2 types** de stockage:
  - Render PITR (quotidien)
  - Fichiers .sql.gz (hebdomadaire)

- **1 copie** off-site:
  - Cloud storage (S3/GCS)

### Exemple de Planification

```
Daily (2h00):   Render PITR automatique
Weekly (Sun):   Backup manuel + upload S3
Monthly (1st):  Backup complet archivé (90 jours retention)
```

---

## Compliance & Légal

### RGPD

Si vous stockez des données européennes:

- Les backups doivent rester en EU
- Chiffrement au repos requis (Render: ✅ inclus)
- Droit à l'oubli: supprimer user → supprimer backups anciens

### Data Retention Policy

Documenter combien de temps vous gardez les backups:

```
Production backups: 30 jours
Archive backups: 1 an
Deleted user data: 90 jours max
```

---

## Cost Estimation

### Render Plans

- **Free**: $0/mois, ❌ no backups
- **Starter**: $7/mois, ✅ 7 days PITR
- **Standard**: $20/mois, ✅ 30 days PITR

### Cloud Storage

- **AWS S3**: ~$0.023/GB/mois
- **Google Cloud**: ~$0.020/GB/mois

Exemple: 1 GB backup/jour × 30 jours = 30 GB = ~$0.70/mois

**Total pour production**: $7 (Render) + $1 (S3) = **~$8/mois**

---

## Checklist Final

**Avant Production**:
- [ ] Passer au Render Starter plan minimum
- [ ] Activer PITR dans Render Dashboard
- [ ] Tester backup manuel
- [ ] Tester restauration sur DB test
- [ ] Documenter la procédure de restauration
- [ ] Configurer monitoring des backups
- [ ] Définir retention policy

**En Production**:
- [ ] Vérifier backups quotidiens
- [ ] Tester restauration mensuelle
- [ ] Archiver backups importants (releases)
- [ ] Monitorer espace de stockage

---

## Support

**Render Support**:
- Docs: https://render.com/docs/databases
- Support: support@render.com
- Status: https://status.render.com

**Emergency Restore**:
1. Créer ticket support Render (si plan payant)
2. Spécifier backup ID et timestamp
3. Demander restauration urgente

---

**Last Updated**: 2026-01-25
**Next Review**: Mensuel
