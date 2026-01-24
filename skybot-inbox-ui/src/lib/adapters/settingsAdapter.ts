// Settings and User Preferences Adapter

export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type Language = 'EN' | 'FR' | 'ES';
export type AccountRole = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface UserPreferences {
  id: string;
  userId: string;
  theme: Theme;
  language: Language;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AccountRole;
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Get clientKey from localStorage
const getClientKey = () => {
  return typeof window !== 'undefined'
    ? localStorage.getItem('clientKey') || 'demo-client'
    : 'demo-client';
};

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    'x-client-key': getClientKey(),
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `/api/proxy${normalized}`;

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  return res.json();
}

// ============ User Preferences ============

export async function fetchUserPreferences(userId: string): Promise<UserPreferences> {
  return apiFetch(`/user-preferences/${userId}`);
}

export async function updateUserPreferences(
  userId: string,
  data: Partial<Pick<UserPreferences, 'theme' | 'language' | 'timezone' | 'dateFormat' | 'timeFormat'>>
): Promise<UserPreferences> {
  return apiFetch(`/user-preferences/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function resetUserPreferences(userId: string): Promise<UserPreferences> {
  return apiFetch(`/user-preferences/${userId}/reset`, {
    method: 'POST',
  });
}

// ============ User Profile / Account ============

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  return apiFetch(`/accounts/${userId}`);
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserProfile, 'name' | 'email' | 'phone' | 'avatarUrl'>>
): Promise<UserProfile> {
  return apiFetch(`/accounts/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  userId: string,
  data: ChangePasswordRequest
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/accounts/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Accounts List (Admin only) ============

export async function fetchAccounts(filters?: {
  role?: AccountRole;
  status?: AccountStatus;
}): Promise<{ items: UserProfile[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.status) params.append('status', filters.status);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/accounts${query}`);
}

export async function createAccount(data: {
  name: string;
  email: string;
  phone?: string;
  role: AccountRole;
  status?: AccountStatus;
}): Promise<UserProfile> {
  return apiFetch('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(userId: string): Promise<{ success: boolean }> {
  return apiFetch(`/accounts/${userId}`, {
    method: 'DELETE',
  });
}

export async function suspendAccount(userId: string): Promise<UserProfile> {
  return apiFetch(`/accounts/${userId}/suspend`, {
    method: 'POST',
  });
}

export async function activateAccount(userId: string): Promise<UserProfile> {
  return apiFetch(`/accounts/${userId}/activate`, {
    method: 'POST',
  });
}

export async function promoteToAdmin(userId: string): Promise<UserProfile> {
  return apiFetch(`/accounts/${userId}/promote`, {
    method: 'POST',
  });
}

export async function demoteToUser(userId: string): Promise<UserProfile> {
  return apiFetch(`/accounts/${userId}/demote`, {
    method: 'POST',
  });
}
