import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL || "http://127.0.0.1:3001";
const API_KEY = process.env.API_KEY || "";

async function forward(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;

  const pathname = "/" + (path ?? []).join("/");
  const url = `${API_BASE}${pathname}${req.nextUrl.search}`;

  const headers: Record<string, string> = { "x-api-key": API_KEY };
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  const init: RequestInit = { method: req.method, headers, cache: "no-store" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const upstream = await fetch(url, init);
  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;