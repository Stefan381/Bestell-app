import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";

/**
 * Defense-in-depth check for Route Handlers: proxy.ts already blocks
 * unauthenticated requests to staff routes, but Next.js recommends every
 * Server Function/Route Handler verify auth independently rather than
 * relying on Proxy alone (a matcher change could silently drop coverage).
 *
 * Usage: `const auth = await requireStaffSession(); if (!auth.session) return auth.response;`
 */
export async function requireStaffSession(): Promise<
  { session: SessionPayload; response: null } | { session: null; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }),
    };
  }
  return { session, response: null };
}
