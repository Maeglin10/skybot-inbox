"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "OPEN" | "PENDING" | "CLOSED";

export default function StatusSelect(props: { id: string; status: Status }) {
  const router = useRouter();
  const [value, setValue] = useState<Status>(props.status);
  const [loading, setLoading] = useState(false);

  async function onChange(next: Status) {
    setValue(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${props.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="text-sm flex items-center gap-2">
      <span className="text-gray-500">Status</span>
      <select
        className="border rounded px-2 py-1"
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