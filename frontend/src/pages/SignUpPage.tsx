import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import AuthLayout, {
  AuthLanguageChip,
  AuthSignInChip,
} from "../features/auth/AuthLayout";
import SignUpForm from "../features/auth/SignUpForm";
import { SIGN_IN_PATH } from "../features/auth/authRoutes";

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return <div className="min-h-dvh bg-[#F6F5F9]" aria-label="Loading" />;
  }
  if (isSignedIn) {
    return <Navigate to="/home" replace />;
  }
  return (
    <AuthLayout
      showLegalFooter
      headerAction={
        <>
          <AuthLanguageChip />
          <AuthSignInChip to={SIGN_IN_PATH} />
        </>
      }
    >
      <SignUpForm />
    </AuthLayout>
  );
}
