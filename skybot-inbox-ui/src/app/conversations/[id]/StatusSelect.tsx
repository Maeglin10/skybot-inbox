'use client';

import { useState } from 'react';
import { apiPatchClient } from '@/lib/api.client';

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onChange(next: string) {
    setValue(next);
    setLoading(true);
    try {
      await apiPatchClient(`/conversations/${id}/status`, { status: next });
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={value}
      disabled={loading}
      onChange={(e) => void onChange(e.target.value)}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="OPEN">OPEN</option>
      <option value="PENDING">PENDING</option>
      <option value="CLOSED">CLOSED</option>
    </select>
  );
}