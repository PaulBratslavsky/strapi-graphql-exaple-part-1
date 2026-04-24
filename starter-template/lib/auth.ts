// Auth helpers — STUB.
//
// Part 4 of the tutorial will flesh this file out to read the JWT cookie set
// by the login Server Action, returning it to both `lib/apollo-client.ts`
// (for the Authorization header) and to `components/auth-nav.tsx` (for the
// current-user check).
//
// Until Part 4 ships, `getJwt()` always returns `null`. Any consumer that
// uses it should handle that case gracefully (i.e. "anonymous request").

// Part 4 will replace this with `import { cookies } from "next/headers"`
// and read the httpOnly `strapi_jwt` cookie.

export const JWT_COOKIE_NAME = "strapi_jwt";

export async function getJwt(): Promise<string | null> {
  return null;
}
