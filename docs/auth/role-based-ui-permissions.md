# Role-Based UI Permissions

## Vue d'ensemble

L'application utilise un système de permissions basé sur les rôles (RBAC) pour contrôler l'accès aux fonctionnalités UI.

## Rôles Disponibles

- **ADMIN**: Accès complet (gestion users, tous les modules)
- **USER**: Accès limité (utilisation des modules uniquement)

## Implémentation

### 1. Hook useUser

Le hook `useUser` récupère les informations de l'utilisateur connecté:

```typescript
import { useUser } from '@/hooks/useUser';

function MyComponent() {
  const { user, loading, isAdmin, isUser } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user) return null; // Will redirect to login

  return (
    <div>
      <p>Hello {user.username}!</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### 2. RoleGuard Component

Le composant `RoleGuard` protège les sections nécessitant un rôle spécifique:

```typescript
import { RoleGuard } from '@/components/RoleGuard';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>

      {/* Section visible par tous */}
      <ProfileSettings />

      {/* Section réservée aux ADMIN */}
      <RoleGuard
        requiredRole="ADMIN"
        redirectTo="/inbox"
        fallback={<div>Admin access required</div>}
      >
        <UserManagement />
      </RoleGuard>
    </div>
  );
}
```

### 3. Conditional Rendering

Pour cacher simplement du contenu sans redirection:

```typescript
import { useUser } from '@/hooks/useUser';

function Sidebar() {
  const { isAdmin } = useUser();

  return (
    <nav>
      <Link href="/inbox">Inbox</Link>
      <Link href="/crm">CRM</Link>

      {isAdmin && (
        <>
          <Link href="/settings/users">Manage Users</Link>
          <Link href="/settings/billing">Billing</Link>
        </>
      )}
    </nav>
  );
}
```

## Exemples d'Usage

### Settings Layout (Admin Only)

```typescript
// src/app/[locale]/(app)/settings/users/page.tsx
'use client';

import { RoleGuard } from '@/components/RoleGuard';
import { UserManagement } from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <RoleGuard requiredRole="ADMIN" redirectTo="/inbox">
      <UserManagement />
    </RoleGuard>
  );
}
```

### Conditional Button

```typescript
// components/inbox/InboxHeader.tsx
import { useUser } from '@/hooks/useUser';

function InboxHeader() {
  const { isAdmin } = useUser();

  return (
    <header>
      <h1>Inbox</h1>
      {isAdmin && (
        <button>Create Inbox</button>
      )}
    </header>
  );
}
```

### Mixed Permissions

```typescript
function CRMPage() {
  const { user } = useUser();

  return (
    <div>
      {/* Tous les users peuvent voir */}
      <LeadsList accountId={user?.accountId} />

      {/* Seuls les ADMIN peuvent créer */}
      <RoleGuard requiredRole="ADMIN" fallback={null}>
        <CreateLeadButton />
      </RoleGuard>

      {/* Seuls les ADMIN peuvent supprimer */}
      <RoleGuard requiredRole="ADMIN" fallback={null}>
        <DeleteLeadButton />
      </RoleGuard>
    </div>
  );
}
```

## Routes Protégées

### Par Middleware (Token Check)

Le middleware vérifie la présence du token pour toutes les routes protégées:

- `/inbox` - Tous les utilisateurs authentifiés
- `/alerts` - Tous les utilisateurs authentifiés
- `/analytics` - Tous les utilisateurs authentifiés
- `/calendar` - Tous les utilisateurs authentifiés
- `/crm` - Tous les utilisateurs authentifiés
- `/settings` - Tous les utilisateurs authentifiés

### Par RoleGuard (Role Check)

Les sous-routes nécessitant ADMIN doivent être protégées par RoleGuard:

- `/settings/users` - ADMIN only
- `/settings/billing` - ADMIN only
- `/settings/integrations` - ADMIN only (optionnel)

## Testing

### Test avec ADMIN

```bash
# 1. Login en tant qu'ADMIN
curl -X POST http://localhost:3000/api/proxy/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"valentinmilliand.nexxa","password":"4gs75062a6rOnOKy3j09ireEPWAB5Td"}'

# 2. Accéder /settings/users → doit fonctionner ✅
```

### Test avec USER

```bash
# 1. Login en tant que USER
curl -X POST http://localhost:3000/api/proxy/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"goodlife.nexxaagents","password":"4qFEZPjc8f"}'

# 2. Accéder /settings/users → redirect vers /inbox ✅
# 3. Voir les boutons admin → cachés ✅
```

## Checklist d'implémentation

- [x] Hook useUser créé
- [x] Composant RoleGuard créé
- [ ] Protéger /settings/users avec RoleGuard
- [ ] Protéger /settings/billing avec RoleGuard
- [ ] Cacher boutons "Create User" pour USER
- [ ] Cacher boutons "Delete" pour USER
- [ ] Tester avec les 2 rôles

## Sécurité

**Important**: La protection UI n'est PAS suffisante pour la sécurité!

- ✅ Backend vérifie TOUJOURS les permissions (JwtAuthGuard + RolesGuard)
- ✅ UI permissions ne font que cacher/montrer le contenu
- ✅ Un user malveillant peut contourner l'UI, mais le backend bloquera

**Double protection**:
1. **Frontend**: RoleGuard cache les boutons/routes admin
2. **Backend**: RolesGuard bloque les API calls non-autorisées

Exemple:
```typescript
// Frontend: Cache le bouton
{isAdmin && <DeleteUserButton userId={id} />}

// Backend: Bloque l'API
@Delete('users/:id')
@Roles(UserRole.ADMIN)  // 🔒 Protection backend
async deleteUser(@Param('id') id: string) {
  // ...
}
```

## Notes

- Le middleware ne vérifie que la présence du token (pas le rôle)
- Le rôle est vérifié côté client (useUser) et côté serveur (RolesGuard)
- Les tokens JWT contiennent le rôle dans le payload
- Le refresh automatique maintient la session active
