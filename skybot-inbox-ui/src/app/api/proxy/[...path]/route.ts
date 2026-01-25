export const dynamic = "force-dynamic"; // Ensure proxy is not cached

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

  // Forward x-client-key header for multi-tenant support
  const clientKey = req.headers.get("x-client-key");
  if (clientKey) headers["x-client-key"] = clientKey;

  const init: RequestInit = { method: req.method, headers, cache: "no-store" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(url, init);
    
    // Pass-through even if error, let client handle it
    const bodyBuffer = await upstream.arrayBuffer(); 
    
    // Copy headers from upstream response to pass back to client
    const responseHeaders = new Headers();
    if (upstream.headers.has("content-type")) {
      responseHeaders.set("content-type", upstream.headers.get("content-type")!);
    }
    // We can forward other headers if needed, but usually content-type is sufficient

    return new NextResponse(bodyBuffer, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
     console.error("Proxy error:", error);
     return new NextResponse(JSON.stringify({ error: "Upstream unavailable" }), {
       status: 502,
       headers: { "content-type": "application/json" }
     });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;