import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

function mustEnv(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function jsonResponse(upstream: Response, bodyText: string) {
  return new NextResponse(bodyText, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ??
        "application/json; charset=utf-8",
    },
  });
}

function join(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const base = mustEnv("API_URL", API_URL);
  const key = mustEnv("API_KEY", API_KEY);

  const url = new URL(req.url);
  const qs = url.searchParams.toString();

  const upstreamUrl = join(
    base,
    `/conversations/${id}/messages${qs ? `?${qs}` : ""}`
  );

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    cache: "no-store",
  });

  const txt = await upstream.text();
  return jsonResponse(upstream, txt);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const base = mustEnv("API_URL", API_URL);
  const key = mustEnv("API_KEY", API_KEY);

  const body = await req.json();

  // backend attendu: POST /messages avec conversationId
  const upstream = await fetch(join(base, "/messages"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ conversationId: id, ...body }),
    cache: "no-store",
  });

  const txt = await upstream.text();
  return jsonResponse(upstream, txt);
}