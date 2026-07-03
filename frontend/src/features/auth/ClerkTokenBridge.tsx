import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setAuthTokenGetter } from "./token";

export function ClerkTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}
