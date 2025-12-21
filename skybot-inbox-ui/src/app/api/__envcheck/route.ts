import { NextResponse } from 'next/server';

export async function GET() {
  const v = process.env.API_KEY || '';
  return NextResponse.json({
    has: !!v,
    len: v.length,
    preview: v.slice(0, 4) + '…',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || null,
  });
}
