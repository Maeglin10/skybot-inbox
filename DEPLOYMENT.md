# 🚀 Déploiement SkyBot - Serveur Nexxa Centralisé

## Architecture

```
Serveur Nexxa VPS
├── api.nexxa.com:443      → SkyBot Inbox (NestJS) + Traefik SSL
├── n8n.nexxa.com:443      → n8n Self-hosted + Traefik SSL
├── postgres:5432          → PostgreSQL (interne Docker)
└── traefik.nexxa.com:443  → Dashboard Traefik
```

## Pré-requis sur le serveur Nexxa

### 1. Installer Docker & Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configurer les DNS (chez ton provider DNS)

Ajouter ces enregistrements A pointant vers l'IP de ton serveur Nexxa:

```
A    api.nexxa.com      → IP_SERVEUR_NEXXA
A    n8n.nexxa.com      → IP_SERVEUR_NEXXA
A    traefik.nexxa.com  → IP_SERVEUR_NEXXA
```

### 3. Ouvrir les ports sur le firewall

```bash
sudo ufw allow 80/tcp    # HTTP (redirige vers HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

## Déploiement

### 1. Cloner le repo sur le serveur

```bash
ssh user@nexxa-server
cd /opt
sudo mkdir skybot && sudo chown $USER:$USER skybot
git clone https://github.com/votre-org/skybot-inbox.git skybot
cd skybot
```

### 2. Configurer les variables d'environnement

```bash
cp .env.production .env
nano .env  # Éditer avec tes valeurs réelles
```

**Variables importantes à changer:**
- `POSTGRES_PASSWORD` (générer avec: `openssl rand -hex 32`)
- `N8N_ENCRYPTION_KEY` (générer avec: `openssl rand -hex 32`)
- `LETSENCRYPT_EMAIL` (ton email pour les certificats SSL)

### 3. Déployer

```bash
./deploy.sh production
```

Cela va:
1. Build les images Docker
2. Démarrer PostgreSQL, SkyBot API, n8n, Traefik
3. Générer les certificats SSL Let's Encrypt automatiquement
4. Exécuter les migrations Prisma

### 4. Vérifier que tout fonctionne

```bash
# Vérifier les containers
docker-compose ps

# Vérifier les logs
docker-compose logs -f skybot-inbox-api
docker-compose logs -f n8n

# Tester l'API
curl https://api.nexxa.com/health

# Accéder à n8n
# Ouvrir https://n8n.nexxa.com dans un navigateur
```

## Migration depuis Render/n8n Cloud

### 1. Exporter les workflows n8n Cloud

1. Connecte-toi à `vmilliand.app.n8n.cloud`
2. Exporte tous les workflows (Settings → Workflows → Export)
3. Télécharge le fichier JSON

### 2. Importer dans n8n Self-hosted

1. Accède à `https://n8n.nexxa.com`
2. Crée un compte admin
3. Importe les workflows (Settings → Workflows → Import)
4. Reconnecte les credentials (Airtable, OpenAI, etc.)

### 3. Mettre à jour les URLs webhook

Remplace toutes les occurrences de:
- `vmilliand.app.n8n.cloud` → `n8n.nexxa.com`

Dans:
- WhatsApp webhook config (Meta Business Manager)
- Airtable automations (si applicable)
- skybot-inbox `.env` (déjà fait dans `.env.production`)

### 4. Arrêter Render

Une fois que tout fonctionne sur Nexxa:
1. Va sur Render Dashboard
2. Suspend/Delete le service skybot-inbox
3. Économie: ~$7-25/mois 💰

## Maintenance

### Logs

```bash
# Tous les logs
docker-compose logs -f

# Logs spécifiques
docker-compose logs -f skybot-inbox-api
docker-compose logs -f n8n
docker-compose logs -f postgres
```

### Redémarrer un service

```bash
docker-compose restart skybot-inbox-api
docker-compose restart n8n
```

### Backup base de données

```bash
# Backup manuel
docker-compose exec postgres pg_dump -U skybot skybot_inbox > backup_$(date +%Y%m%d).sql

# Backup automatique (cron)
0 2 * * * cd /opt/skybot && docker-compose exec -T postgres pg_dump -U skybot skybot_inbox | gzip > /opt/backups/skybot_$(date +\%Y\%m\%d).sql.gz
```

### Mettre à jour

```bash
cd /opt/skybot
git pull
./deploy.sh production
```

## Monitoring

### Prometheus + Grafana (optionnel)

Ajouter à `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

## Coûts estimés

### Avant (Render + n8n Cloud):
- Render: $7-25/mois
- n8n Cloud: $20-50/mois
- **Total: $27-75/mois**

### Après (Serveur Nexxa):
- Serveur VPS déjà existant: $0 (déjà payé)
- **Total: $0/mois** ✅

## Troubleshooting

### SSL ne fonctionne pas

```bash
# Vérifier les logs Traefik
docker-compose logs traefik

# Vérifier que les ports sont ouverts
sudo netstat -tulpn | grep :443
```

### n8n ne démarre pas

```bash
# Vérifier la DB
docker-compose logs postgres

# Réinitialiser n8n
docker-compose down
docker volume rm skybot_n8n_data
docker-compose up -d
```

### API ne répond pas

```bash
# Vérifier les logs
docker-compose logs skybot-inbox-api

# Vérifier les migrations
docker-compose exec skybot-inbox-api npx prisma migrate status
```

## Support

Pour toute question:
- Docs n8n: https://docs.n8n.io/hosting/installation/docker/
- Docs Traefik: https://doc.traefik.io/traefik/
