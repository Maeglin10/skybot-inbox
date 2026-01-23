import { mockDelay, type MockListResponse } from '../api.mock';

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

const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alt-01',
    type: 'PAYMENT',
    title: 'Payment Failed',
    subtitle: 'Subscription renewal failed for basic plan',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    amount: 29.99,
    currency: 'USD',
    customerName: 'Alice Johnson',
    channel: 'WHATSAPP',
    conversationId: 'conv-123'
  },
  {
    id: 'alt-02',
    type: 'HANDOFF',
    title: 'AI Handoff Requested',
    subtitle: 'Customer asked to speak to a human agent',
    status: 'OPEN',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    customerName: 'Bob Smith',
    channel: 'EMAIL',
    conversationId: 'conv-456'
  },
  {
    id: 'alt-03',
    type: 'PAYMENT',
    title: 'Invoice Overdue',
    subtitle: 'Invoice #9921 is 3 days overdue',
    status: 'PENDING',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    amount: 150.00,
    currency: 'EUR',
    customerName: 'Carol White',
    channel: 'WHATSAPP',
    conversationId: 'conv-789'
  },
  {
    id: 'alt-04',
    type: 'HANDOFF',
    title: 'Complex Query',
    subtitle: 'AI confidence low on technical question',
    status: 'OPEN',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    customerName: 'David Lee',
    channel: 'INSTAGRAM',
    conversationId: 'conv-101'
  },
  {
    id: 'alt-05',
    type: 'PAYMENT',
    title: 'Payment Refunded',
    subtitle: 'User requested refund for duplicate charge',
    status: 'RESOLVED',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    amount: 29.99,
    currency: 'USD',
    customerName: 'Eve Black',
    channel: 'EMAIL',
     conversationId: 'conv-102'
  }
];

export async function fetchAlerts(
  status?: AlertStatus | 'ALL',
  type?: AlertType | 'ALL'
): Promise<MockListResponse<AlertItem>> {
  await mockDelay(400);
  
  let items = [...MOCK_ALERTS];

  if (status && status !== 'ALL') {
    // For "PENDING" tab (Payment) vs "HANDOFF" tab (AI) simulation in logic:
    // This function takes generic status, but UI might filter by Type primarily.
    // We'll stick to simple filtering here.
    if (status === 'OPEN') {
        items = items.filter(i => i.status === 'OPEN' || i.status === 'PENDING');
    } else {
        items = items.filter(i => i.status === status);
    }
  }

  if (type && type !== 'ALL') {
    items = items.filter(i => i.type === type);
  }

  return { items, total: items.length };
}

export async function fetchAlert(id: string): Promise<AlertItem | null> {
  await mockDelay(200);
  return MOCK_ALERTS.find(a => a.id === id) || null;
}

export async function resolveAlert(id: string): Promise<boolean> {
  await mockDelay(600);
  const idx = MOCK_ALERTS.findIndex(a => a.id === id);
  if (idx > -1) {
    MOCK_ALERTS[idx].status = 'RESOLVED';
    return true;
  }
  return false;
}

export async function assignAlert(id: string, userId: string): Promise<boolean> {
  await mockDelay(400);
  const idx = MOCK_ALERTS.findIndex(a => a.id === id);
  if (idx > -1) {
    MOCK_ALERTS[idx].assignee = userId;
    return true;
  }
  return false;
}
