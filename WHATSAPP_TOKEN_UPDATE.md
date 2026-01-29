# Configuration du Token WhatsApp Permanent

## Token Fourni
```
REDACTED_WHATSAPP_TOKEN
```

## Configuration sur Render

### Étape 1: Accéder au Dashboard Render
1. Aller sur [Render Dashboard](https://dashboard.render.com)
2. Sélectionner le service **skybot-inbox**

### Étape 2: Ajouter la Variable d'Environnement
1. Cliquer sur **Environment** dans le menu de gauche
2. Cliquer sur **Add Environment Variable**
3. Configurer:
   - **Key**: `WHATSAPP_ACCESS_TOKEN`
   - **Value**: `REDACTED_WHATSAPP_TOKEN`
4. Cliquer sur **Save Changes**

### Étape 3: Redéployer le Service
Le service redémarrera automatiquement avec la nouvelle variable.

## Utilisation du Token

Le token est utilisé par le service **Stories** pour publier des stories WhatsApp via l'API Meta Graph.

### Code concerné
- `src/stories/stories.service.ts` - Publication de stories WhatsApp

### Test
Une fois configuré, vous pouvez tester la publication de stories:
```bash
curl -X POST https://skybot-inbox.onrender.com/api/stories \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID",
    "mediaUrl": "https://example.com/image.jpg",
    "mediaType": "image/jpeg",
    "caption": "Test story"
  }'
```

## Sécurité

✅ Le token est configuré comme variable d'environnement (non versionné)
✅ Le token n'est PAS committé dans le repository
✅ Le token est accessible uniquement sur Render

## Documentation Meta

- [WhatsApp Business API - Access Tokens](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#access-tokens)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
