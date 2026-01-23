export type AlertType = 'PAYMENT' | 'HANDOFF';
export type AlertStatus = 'OPEN' | 'RESOLVED' | 'PENDING';
export type AlertPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  subtitle?: string;
  status: AlertStatus;
  priority: AlertPriority;
  createdAt: string;
  amount?: number;
  currency?: string;
  customerName?: string;
  channel?: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM' | 'OTHER';
  conversationId?: string;
  assignee?: string;
}

type ListResponse<T> = {
  items: T[];
  total: number;
};

// Get clientKey from environment or use a default for development
const getClientKey = () => {
  return typeof window !== 'undefined'
    ? localStorage.getItem('clientKey') || 'demo-client'
    : 'demo-client';
};

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = {
    ...init.headers,
    'x-client-key': getClientKey(),
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

export async function fetchAlerts(
  status?: AlertStatus | 'ALL',
  type?: AlertType | 'ALL'
): Promise<ListResponse<AlertItem>> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (type && type !== 'ALL') params.append('type', type);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/alerts${query}`);
}

export async function fetchAlert(id: string): Promise<AlertItem | null> {
  try {
    return await apiFetch(`/alerts/${id}`);
  } catch (error) {
    console.error('Failed to fetch alert:', error);
    return null;
  }
}

export async function resolveAlert(id: string): Promise<boolean> {
  try {
    await apiFetch(`/alerts/${id}/resolve`, {
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    return false;
  }
}

export async function assignAlert(id: string, userId: string): Promise<boolean> {
  try {
    await apiFetch(`/alerts/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignee: userId }),
    });
    return true;
  } catch (error) {
    console.error('Failed to assign alert:', error);
    return false;
  }
}

export async function createAlert(data: Partial<AlertItem>): Promise<AlertItem> {
  return apiFetch('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAlert(id: string, data: Partial<AlertItem>): Promise<AlertItem> {
  return apiFetch(`/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAlert(id: string): Promise<void> {
  await apiFetch(`/alerts/${id}`, {
    method: 'DELETE',
  });
}
