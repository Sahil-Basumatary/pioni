import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import AuthLayout, {
  AuthLanguageChip,
  AuthSupportChip,
} from "../features/auth/AuthLayout";
import ForgotPasswordForm from "../features/auth/ForgotPasswordForm";
import { SIGN_IN_PATH } from "../features/auth/authRoutes";

export default function ForgotPasswordPage() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return <div className="min-h-dvh bg-[#F6F5F9]" aria-label="Loading" />;
  }
  if (isSignedIn) {
    return <Navigate to="/home" replace />;
  }
  return (
    <AuthLayout
      backAboveCard={{ to: SIGN_IN_PATH }}
      showLegalFooter
      headerAction={
        <>
          <AuthLanguageChip />
          <AuthSupportChip />
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
