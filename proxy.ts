import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

// Renamed from middleware.ts per Next.js 16 (middleware.js is deprecated in
// favor of proxy.js — see node_modules/next/dist/docs/.../proxy.md).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/articles/:path*",
    "/settings/:path*",
    "/import/:path*",
    "/api/customers/:path*",
    "/api/articles/:path*",
    "/api/orders/:path*",
    "/api/templates/:path*",
    "/api/users/:path*",
    "/api/filialen/:path*",
    "/api/import/:path*",
  ],
};
