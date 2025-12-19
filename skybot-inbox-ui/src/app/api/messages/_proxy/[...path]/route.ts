import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;
const API_KEY = process.env.API_KEY!;

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${API_BASE}/${params.path.join('/')}${req.nextUrl.search}`;
  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const body = await req.text();
  const url = `${API_BASE}/${params.path.join('/')}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  const body = await req.text();
  const url = `${API_BASE}/${params.path.join('/')}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}