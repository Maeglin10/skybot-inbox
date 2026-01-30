# Installation du serveur MCP SkyBot Inbox

## ✅ Serveur MCP compilé et prêt!

Le serveur MCP est maintenant compilé dans `dist/index.js`.

## 📋 Pour l'installer dans ton Claude Code:

### Option 1: Config locale (Mac/Linux)

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

### Option 2: Test rapide

Pour tester le serveur avant de l'installer:

```bash
cd /Users/milliandvalentin/skybot-inbox/mcp-server
DATABASE_URL="postgresql://user:password@host:5432/skybot_inbox" node dist/index.js
```

## 🛠️ Outils disponibles après installation:

1. **get_conversations** - Voir les conversations récentes
2. **get_corporate_contacts** - Liste des 16/17 contacts corporate
3. **get_conversation_messages** - Messages d'une conversation
4. **get_inboxes** - Statut des inboxes WhatsApp
5. **get_account_stats** - Stats complètes du compte
6. **search_contacts** - Rechercher un contact
7. **check_webhook_health** - Vérifier que les webhooks fonctionnent

## 🚀 Utilisation

Une fois installé et redémarré Claude Code, je pourrai:

```
Tu: "Montre-moi les conversations récentes"
Moi: *utilise get_conversations()* → Affiche les 20 dernières conversations

Tu: "Est-ce que les webhooks fonctionnent?"
Moi: *utilise check_webhook_health()* → Vérifie l'activité dernière heure

Tu: "Combien de contacts corporate on a?"
Moi: *utilise get_corporate_contacts()* → Affiche les 16/17 contacts
```

## 💡 Bénéfices

✅ Monitoring temps réel de la prod
✅ Plus besoin de scripts temporaires
✅ Je vois l'activité WhatsApp instantanément
✅ Debugging ultra rapide
✅ Tests automatiques après chaque déploiement

## 🔄 Mise à jour

Si tu modifies le serveur:

```bash
cd mcp-server
npm run build
# Redémarre Claude Code pour charger les changements
```
