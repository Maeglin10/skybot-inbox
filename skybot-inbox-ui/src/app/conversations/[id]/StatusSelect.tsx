'use client';

import { apiGetClient as apiGet, apiPostClient as apiPost } from '@/lib/api.client';

export default function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: 'OPEN' | 'PENDING' | 'CLOSED' | string;
}) {
  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    await apiFetch(`/conversations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: e.target.value }),
    });
    location.reload();
  }

  return (
    <select
      defaultValue={status}
      onChange={change}
      className="text-xs border rounded px-2 py-1"
    >
      <option value="OPEN">OPEN</option>
      <option value="PENDING">PENDING</option>
      <option value="CLOSED">CLOSED</option>
    </select>
  );
}
