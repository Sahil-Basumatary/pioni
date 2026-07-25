import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export default function SsoCallbackPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F6F5F9]">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
