# Fix: Corporate Contacts Missing in Alerts

## Problem
Les 16 contacts corporatifs existent dans la base de données, mais ne s'affichent pas dans le filtre "Corporativo" des Alerts.

## Root Cause
L'API `/alerts?type=CORPORATE` requiert une `API_KEY` via le header `x-api-key`, mais le frontend déployé sur Render n'a pas cette variable d'environnement configurée.

## Verification
```bash
# Les contacts existent (✅ 16 contacts corporatifs)
npx ts-node scripts/check-corporate-contacts.ts

# L'API échoue sans API_KEY
curl -H "x-client-key: goodlife" \
     "https://skybot-inbox.onrender.com/api/alerts?type=CORPORATE&status=OPEN"
# Returns: {"code":"UNAUTHORIZED","error":"API key required"}
```

## Solution 1: Configurer API_KEY sur Render (Quick Fix)

1. Aller sur [Render Dashboard](https://dashboard.render.com)
2. Sélectionner le service `skybot-inbox-ui`
3. Aller dans **Environment**
4. Ajouter la variable:
   ```
   API_KEY=2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=
   ```
5. Redéployer le service

## Solution 2: Utiliser l'endpoint JWT (Better)

Modifier le frontend pour utiliser `/alerts/corporate` au lieu de `/alerts?type=CORPORATE`.

### Fichier: `skybot-inbox-ui/src/lib/adapters/alertsAdapter.ts`

```typescript
export async function fetchAlerts(
  status?: AlertStatus | 'ALL',
  type?: AlertType | 'ALL'
): Promise<ListResponse<AlertItem>> {
  // Use dedicated corporate endpoint for JWT auth
  if (type === 'CORPORATE') {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/alerts/corporate${query}`);
  }

  // Standard alerts endpoint
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (type && type !== 'ALL') params.append('type', type);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/alerts${query}`);
}
```

Cette solution utilise l'endpoint `/alerts/corporate` qui s'authentifie avec le JWT token de session (via cookies) au lieu de l'API key.

## Test After Fix

```bash
# Test avec JWT (après login)
# L'utilisateur doit être connecté pour que le cookie accessToken soit présent

# Test avec API_KEY
curl -H "x-api-key: 2pip80z60biKC082zOew2EvW8v0PkbH+eE0vOgpUESg=" \
     -H "x-client-key: goodlife" \
     "https://skybot-inbox.onrender.com/api/alerts?type=CORPORATE&status=OPEN"
```

## Recommendation
**Utiliser Solution 2** car elle est plus sécurisée (JWT avec session) et ne nécessite pas de partager l'API_KEY dans le frontend.
