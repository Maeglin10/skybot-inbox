import { NextResponse } from "next/server";

function mustEnv(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const API_BASE = mustEnv("API_BASE", process.env.API_BASE);
const API_KEY = process.env.API_KEY;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.text();

  const upstream = await fetch(`${API_BASE}/conversations/${id}/status`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}