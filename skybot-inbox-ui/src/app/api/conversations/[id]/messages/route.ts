import { NextResponse } from "next/server";

const API_BASE = process.env.API_URL || "http://127.0.0.1:3001";
const API_KEY = process.env.API_KEY || "";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = body?.text;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ conversationId: id, text }),
    cache: "no-store",
  });

  const respText = await upstream.text();
  return new NextResponse(respText, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}