import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/problem";
import { env } from "@/lib/env";
import { refreshSessionOnce } from "./refresh";
import { ACCESS_COOKIE, REFRESH_COOKIE, sessionCookies } from "./session-cookies";

const PUBLIC_PATHS = new Set(["/login"]);
const HOME = "/dashboard";

export type Step = "continue" | "sign-in" | "go-home" | "renew";

/**
 * What to do with a request given only which cookies it carries.
 * `renew` means the access token is gone but a refresh token is present.
 */
export function decideStep(input: {
  isPublic: boolean;
  hasRefresh: boolean;
  hasAccess: boolean;
}): Step {
  if (!input.hasRefresh) return input.isPublic ? "continue" : "sign-in";
  if (input.hasAccess) return input.isPublic ? "go-home" : "continue";
  return "renew";
}

function isApiRequest(pathname: string) {
  return pathname.startsWith("/api/");
}

function signInResponse(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  let response: NextResponse;
  if (isApiRequest(pathname)) {
    response = NextResponse.json({ title: "Not signed in." }, { status: 401 });
  } else {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(url);
  }
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

async function renew(request: NextRequest, refreshToken: string, isPublic: boolean) {
  let session;
  try {
    session = await refreshSessionOnce(refreshToken);
  } catch (error) {
    // The API is down: keep the session and let the page report it instead of signing the user out.
    if (error instanceof ApiError) return NextResponse.next();
    throw error;
  }
  if (!session) return isPublic ? NextResponse.next() : signInResponse(request);

  const cookies = sessionCookies(session, env.secureCookies);
  for (const { name, value } of cookies) request.cookies.set(name, value);

  const response = isPublic
    ? NextResponse.redirect(new URL(HOME, request.url))
    : NextResponse.next({ request });
  for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
  return response;
}

/**
 * Optimistic auth gate and the one place a session is renewed.
 *
 * Server Components cannot set cookies, so an expired access token is replaced here, before the
 * page renders: the new cookies go to the browser on the response and to the rest of this request
 * through the forwarded `cookie` header. Real authorization still happens in the data access layer
 * and in the API; this only avoids rendering pages for visitors who are clearly signed out.
 */
export async function authProxy(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.has(request.nextUrl.pathname);
  const step = decideStep({
    isPublic,
    hasRefresh: Boolean(refreshToken),
    hasAccess: request.cookies.has(ACCESS_COOKIE),
  });

  switch (step) {
    case "continue":
      return NextResponse.next();
    case "go-home":
      return NextResponse.redirect(new URL(HOME, request.url));
    case "sign-in":
      return signInResponse(request);
    case "renew":
      return renew(request, refreshToken!, isPublic);
  }
}
