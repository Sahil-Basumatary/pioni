import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import AuthLayout, { AuthHeaderButton } from "../features/auth/AuthLayout";
import SignInForm from "../features/auth/SignInForm";
import { SIGN_UP_PATH } from "../features/auth/authRoutes";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return <div className="min-h-dvh bg-[#F6F5F9]" aria-label="Loading" />;
  }
  if (isSignedIn) {
    return <Navigate to="/home" replace />;
  }
  return (
    <AuthLayout
      headerAction={
        <AuthHeaderButton to={SIGN_UP_PATH}>Create Account</AuthHeaderButton>
      }
    >
      <SignInForm />
    </AuthLayout>
  );
}
