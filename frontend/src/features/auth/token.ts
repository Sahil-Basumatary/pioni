export type AuthTokenGetter = () => Promise<string | null>;

let tokenGetter: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  tokenGetter = getter;
}

// Bridges Clerk's React-only session token into the RTK Query layer, which is created outside
// the component tree. A failed lookup resolves to null so requests degrade to anonymous rather
// than throwing inside prepareHeaders.
export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
