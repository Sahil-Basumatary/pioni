export type AuthTokenGetter = () => Promise<string | null>;

let tokenGetter: AuthTokenGetter | null = null;

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  tokenGetter = getter;
}

// RTK Query is created outside Clerk's component tree, so token lookup is registered at runtime.
export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
