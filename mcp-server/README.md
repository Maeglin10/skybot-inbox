# SkyBot Inbox MCP Server

Serveur MCP (Model Context Protocol) pour monitorer SkyBot Inbox en temps réel.

## Outils disponibles

### 1. `get_conversations`
Récupère les conversations d'un compte avec détails contact et dernier message.

**Paramètres:**
- `accountId` (optionnel) - ID du compte (défaut: GoodLife)
- `limit` (optionnel) - Nombre max de conversations (défaut: 20)
- `status` (optionnel) - Filtrer par status: OPEN, CLOSED, PENDING

### 2. `get_corporate_contacts`
Récupère tous les contacts corporate d'un compte.

**Paramètres:**
- `accountId` (optionnel) - ID du compte (défaut: GoodLife)

### 3. `get_conversation_messages`
Récupère tous les messages d'une conversation spécifique.

**Paramètres:**
- `conversationId` (requis) - ID de la conversation
- `limit` (optionnel) - Nombre max de messages (défaut: 50)

### 4. `get_inboxes`
Récupère toutes les inboxes d'un compte avec status de connexion.

**Paramètres:**
- `accountId` (optionnel) - ID du compte (défaut: GoodLife)

### 5. `get_account_stats`
Récupère les statistiques complètes d'un compte.

**Paramètres:**
- `accountId` (optionnel) - ID du compte (défaut: GoodLife)

### 6. `search_contacts`
Recherche des contacts par nom ou numéro de téléphone.

**Paramètres:**
- `accountId` (optionnel) - ID du compte (défaut: GoodLife)
- `query` (requis) - Terme de recherche

### 7. `check_webhook_health`
Vérifie la configuration webhook et l'activité récente des messages.

**Paramètres:**
- `accountId` (optionnel) - ID du compte (défaut: GoodLife)

## Installation

### 1. Build le serveur

```bash
cd mcp-server
npm run build
```

### 2. Ajoute à ta config Claude Code

Édite `~/.claude/config.json`:

```json
{
  "mcpServers": {
    "skybot-inbox": {
      "command": "node",
      "args": ["/Users/milliandvalentin/skybot-inbox/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@host:5432/skybot_inbox"
      }
    }
  }
}
```

### 3. Redémarre Claude Code

Le serveur MCP sera chargé automatiquement et les outils seront disponibles.

## Utilisation

Une fois installé, je pourrai utiliser les outils directement:

```
Claude: Montre-moi les conversations récentes
→ Utilise get_conversations()

Claude: Combien de contacts corporate on a?
→ Utilise get_corporate_contacts()

Claude: Est-ce que les webhooks fonctionnent?
→ Utilise check_webhook_health()
```

## Bénéfices

✅ **Monitoring temps réel** - Voir ce qui se passe maintenant sur la plateforme
✅ **Debugging rapide** - Diagnostiquer les problèmes instantanément
✅ **Pas de scripts temporaires** - Tout est standardisé
✅ **Auto-surveillance** - Vérifier que tout fonctionne après chaque déploiement
✅ **Tests E2E automatiques** - Valider le flow complet WhatsApp → N8N → Inbox

## Développement

Pour tester en mode dev:

```bash
npm run dev
```

Pour compiler:

```bash
npm run build
```
