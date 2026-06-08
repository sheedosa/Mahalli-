import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that never require a signed-in seller.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/offline"];
// Auth-only routes a signed-in user should be bounced away from.
const AUTH_PATHS = ["/login", "/signup"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Supabase auth callback/confirm endpoints.
  if (pathname.startsWith("/auth")) return true;
  return false;
}

/**
 * Build a Content-Security-Policy. Production uses a per-request nonce with
 * strict-dynamic; development relaxes script rules so HMR/eval works.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const script = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    `script-src ${script}`,
    // next/font and Tailwind inject styles; inline styles are required.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(res: NextResponse, csp: string) {
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
}

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce, isDev);

  // Pass the nonce to the app so Next can attach it to its own scripts.
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);

  // Refresh the Supabase session and learn who the user is.
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Gate protected routes.
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect, csp);
    return redirect;
  }

  // Signed-in users shouldn't sit on the auth screens.
  if (user && AUTH_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect, csp);
    return redirect;
  }

  applySecurityHeaders(response, csp);
  return response;
}

export const config = {
  // Run on everything except static assets, the SW, and image files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|icon.svg|icon-maskable.svg|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|woff2?)$).*)",
  ],
};
