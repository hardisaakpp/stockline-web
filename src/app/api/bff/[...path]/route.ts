import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { readTokens } from "@/features/auth/server";

/**
 * Backend-for-frontend passthrough for browser code (TanStack Query, EventSource).
 *
 * The browser never sees an API token: this handler attaches the access token from the HttpOnly
 * cookie. The proxy has already renewed it if it was close to expiry. Authorization is the API's
 * job; this layer only forwards.
 */
const SAFE_METHODS = new Set(["GET", "HEAD"]);
const REQUEST_HEADERS = ["accept", "content-type", "if-none-match", "last-event-id"];
const RESPONSE_HEADERS = ["content-type", "content-disposition", "cache-control", "etag"];

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function pick(source: Headers, names: string[], target = new Headers()): Headers {
  for (const name of names) {
    const value = source.get(name);
    if (value) target.set(name, value);
  }
  return target;
}

function responseHeadersFor(upstream: Response): Headers {
  const headers = pick(upstream.headers, RESPONSE_HEADERS);
  // Streaming (SSE) responses must not be buffered or transformed by intermediaries.
  if (headers.get("content-type")?.startsWith("text/event-stream")) {
    headers.set("cache-control", "no-cache, no-transform");
    headers.set("x-accel-buffering", "no");
  }
  return headers;
}

function problem(title: string, status: number) {
  return Response.json({ title }, { status });
}

async function forward(request: NextRequest, { params }: RouteContext<"/api/bff/[...path]">) {
  const hasBody = !SAFE_METHODS.has(request.method);
  if (hasBody && !isSameOrigin(request)) return problem("Cross-origin request rejected.", 403);

  const { accessToken } = await readTokens();
  if (!accessToken) return problem("Not signed in.", 401);

  const { path } = await params;
  const target = `${env.apiUrl}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = pick(
    request.headers,
    REQUEST_HEADERS,
    new Headers({ authorization: `Bearer ${accessToken}` }),
  );

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Node's fetch requires `duplex` to stream an incoming request body; it is not in lib.dom's RequestInit.
      ...(hasBody ? { duplex: "half" } : {}),
      signal: request.signal,
      cache: "no-store",
    } as RequestInit);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeadersFor(upstream),
    });
  } catch {
    return problem("The service is unreachable. Try again in a moment.", 503);
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
