import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3001';
const API_KEY = process.env.API_KEY ?? '';

async function forward(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstreamUrl = `${API_URL}/${path.join('/')}`;

  const headers = new Headers(req.headers);
  headers.set('x-api-key', API_KEY);
  headers.delete('host');

  const res = await fetch(upstreamUrl, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
    cache: 'no-store',
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
