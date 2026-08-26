import { createContext, useContext, type ReactNode } from "react";

const signedOut = {
  isLoaded: true,
  isSignedIn: false,
  userId: null as string | null,
  sessionId: null as string | null,
  user: null,
  session: null,
  getToken: async () => null,
  signOut: async () => undefined,
  openSignIn: () => undefined,
  openSignUp: () => undefined,
};

const AuthContext = createContext(signedOut);

export function ClerkProvider({
  children,
}: {
  children?: ReactNode;
  publishableKey?: string;
  afterSignOutUrl?: string;
  signInUrl?: string;
  signUpUrl?: string;
  appearance?: unknown;
  localization?: unknown;
}) {
  return (
    <AuthContext.Provider value={signedOut}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  return useContext(AuthContext);
}

export function useSession() {
  return useContext(AuthContext);
}

export function useClerk() {
  return useContext(AuthContext);
}

export function useSignIn() {
  return {
    isLoaded: true,
    signIn: undefined,
    setActive: undefined,
  };
}

export function useSignUp() {
  return {
    isLoaded: true,
    signUp: undefined,
    setActive: undefined,
  };
}

export function useReverification<T>(fn: T): T {
  return fn;
}

export function SignedIn({ children: _children }: { children?: ReactNode }) {
  return null;
}

export function SignedOut({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function AuthenticateWithRedirectCallback() {
  return null;
}
