'use client';

import { useState } from 'react';
import { apiFetchClient } from '@/lib/api.client';

export default function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
}) {
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function update(next: typeof value) {
    setValue(next);
    setLoading(true);
    try {
      await apiFetchClient(`/conversations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      disabled={loading}
      onChange={(e) => update(e.target.value as typeof value)}
    >
      <option value="OPEN">OPEN</option>
      <option value="PENDING">PENDING</option>
      <option value="CLOSED">CLOSED</option>
    </select>
  );
}