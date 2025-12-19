'use client';

export default function StatusButtons({ id }: { id: string }) {
  async function setStatus(status: 'OPEN' | 'PENDING' | 'CLOSED') {
    await fetch(`/api/conversations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      <button className="rounded border px-2 py-1" onClick={() => setStatus('OPEN')}>OPEN</button>
      <button className="rounded border px-2 py-1" onClick={() => setStatus('PENDING')}>PENDING</button>
      <button className="rounded border px-2 py-1" onClick={() => setStatus('CLOSED')}>CLOSED</button>
    </div>
  );
}