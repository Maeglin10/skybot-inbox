import { NextResponse } from "next/server";

const API_BASE = process.env.API_URL || "http://127.0.0.1:3001";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status;

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/conversations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}