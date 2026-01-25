# Airtable MCP Server

Serveur MCP (Model Context Protocol) pour intégrer Airtable avec Claude Code.

## 🎯 Fonctionnalités

Ce serveur expose 6 outils MCP pour interagir avec Airtable:

1. **airtable_list_tables** - Liste toutes les tables de la base avec leurs champs
2. **airtable_list_records** - Liste les records d'une table
3. **airtable_get_record** - Récupère un record spécifique par ID
4. **airtable_create_record** - Crée un nouveau record
5. **airtable_update_record** - Met à jour un record existant
6. **airtable_delete_record** - Supprime un record

## 📦 Installation

Les dépendances ont déjà été installées:

```bash
cd mcp-server-airtable
npm install  # ✅ Déjà fait
npm run build  # ✅ Déjà fait
```

## ⚙️ Configuration

Le serveur a été automatiquement configuré dans Claude Code (`~/.claude/config.json`):

```json
{
  "mcpServers": {
    "airtable": {
      "command": "node",
      "args": [
        "/Users/milliandvalentin/skybot-inbox/mcp-server-airtable/dist/index.js"
      ],
      "env": {
        "AIRTABLE_API_KEY": "patyBuSMpO0pcbzZE...",
        "AIRTABLE_BASE_ID": "***REMOVED***"
      }
    }
  }
}
```

## 🚀 Activation

**IMPORTANT**: Pour activer le serveur MCP, tu dois **redémarrer Claude Code** :

1. Ferme complètement Claude Code
2. Rouvre-le dans ton projet

Après le redémarrage, Claude aura accès aux 6 nouveaux outils Airtable.

## 🧪 Test Manuel

Pour tester le serveur manuellement:

```bash
cd /Users/milliandvalentin/skybot-inbox/mcp-server-airtable
AIRTABLE_API_KEY=patyBuSMpO0pcbzZE.7395342e931f188301876ba320c6f9d54205accc0fadfc07cf61a433e0e21e08 \
AIRTABLE_BASE_ID=***REMOVED*** \
node dist/index.js
```

## 📋 Outils Disponibles

### 1. airtable_list_tables
Liste toutes les tables et leurs champs.

**Paramètres**: Aucun

**Exemple de résultat**:
```json
{
  "tables": [
    {
      "id": "tblCAI5p5tr4m46q7",
      "name": "leads",
      "fields": [
        {"id": "fld...", "name": "lead_id", "type": "formula"},
        {"id": "fld...", "name": "name", "type": "singleLineText"},
        ...
      ]
    }
  ]
}
```

### 2. airtable_list_records
Liste les records d'une table.

**Paramètres**:
- `table` (string, requis): Nom de la table
- `maxRecords` (number, optionnel): Nombre max de records (défaut: 100)
- `filterByFormula` (string, optionnel): Formule Airtable pour filtrer
- `view` (string, optionnel): Nom de la vue à utiliser

**Exemple**:
```json
{
  "table": "leads",
  "maxRecords": 10,
  "filterByFormula": "{status} = 'New'"
}
```

### 3. airtable_get_record
Récupère un record spécifique.

**Paramètres**:
- `table` (string, requis): Nom de la table
- `recordId` (string, requis): ID du record

### 4. airtable_create_record
Crée un nouveau record.

**Paramètres**:
- `table` (string, requis): Nom de la table
- `fields` (object, requis): Champs du nouveau record

**Exemple**:
```json
{
  "table": "leads",
  "fields": {
    "name": "Test Lead",
    "email": "test@example.com",
    "status": "New"
  }
}
```

### 5. airtable_update_record
Met à jour un record existant.

**Paramètres**:
- `table` (string, requis): Nom de la table
- `recordId` (string, requis): ID du record
- `fields` (object, requis): Champs à mettre à jour

### 6. airtable_delete_record
Supprime un record.

**Paramètres**:
- `table` (string, requis): Nom de la table
- `recordId` (string, requis): ID du record

## 🔍 Utilisation avec Claude

Après le redémarrage de Claude Code, tu pourras faire des requêtes comme:

```
"Montre-moi tous les leads dans Airtable"
"Crée un nouveau lead avec le nom 'John Doe' et l'email 'john@example.com'"
"Liste toutes les tables disponibles dans ma base Airtable"
"Combien de records y a-t-il dans la table 'orders'?"
```

## 🛠️ Développement

Pour modifier le serveur:

1. Éditer `src/index.ts`
2. Rebuild: `npm run build`
3. Redémarrer Claude Code

## 📝 Notes

- Le serveur utilise le SDK MCP officiel (@modelcontextprotocol/sdk)
- Communication via stdio (standard input/output)
- Tous les appels Airtable passent par le package npm `airtable`
- Les credentials sont dans les variables d'environnement

## ✅ Status

- ✅ Serveur créé
- ✅ Dependencies installées
- ✅ Compilé avec succès
- ✅ Configuré dans Claude Code
- ⏳ En attente de redémarrage Claude Code
