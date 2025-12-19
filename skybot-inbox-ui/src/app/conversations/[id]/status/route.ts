import { NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const res = await fetch(`${BASE}/conversations/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KEY,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const txt = await res.text();
  return new NextResponse(txt, { status: res.status });
}