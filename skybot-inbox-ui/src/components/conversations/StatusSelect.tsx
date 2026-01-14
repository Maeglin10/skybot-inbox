'use client';

import { useState } from 'react';
import { apiPatchClient } from '@/lib/api.client';

type Status = 'OPEN' | 'PENDING' | 'CLOSED';

export default function StatusSelect(props: {
  id: string;
  status: Status;
  onOptimisticChange?: (s: Status) => void;
}) {
  const [value, setValue] = useState<Status>(props.status);
  const [loading, setLoading] = useState(false);

  async function onChange(next: Status) {
    const prev = value;
    setValue(next);
    props.onOptimisticChange?.(next);
    setLoading(true);

    try {
      await apiPatchClient(`/conversations/${props.id}/status`, {
        status: next,
      });
    } catch {
      setValue(prev);
      props.onOptimisticChange?.(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="text-sm flex items-center gap-2">
      <span className="text-gray-500">Status</span>
      <select
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-60"
        value={value}
        disabled={loading}
        onChange={(e) => onChange(e.target.value as Status)}
      >
        <option value="OPEN">OPEN</option>
        <option value="PENDING">PENDING</option>
        <option value="CLOSED">CLOSED</option>
      </select>
    </label>
  );
}
