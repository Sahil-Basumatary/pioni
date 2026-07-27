import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeftSmallIcon,
  SupportIcon,
} from "../../components/shell/shellIcons";
import { LEGAL } from "../../pages/legal/legalConfig";
import AuthLanguageMenu from "./AuthLanguageMenu";
import { useLanguage } from "./LanguageProvider";

export default function AuthLayout({
  children,
  headerAction,
  backTo,
  backAboveCard,
  showLegalFooter = false,
}: {
  children: ReactNode;
  headerAction?: ReactNode;
  backTo?: { to: string; label?: string };
  backAboveCard?: { to: string; label?: string };
  showLegalFooter?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-dvh flex-col bg-[#F6F5F9] text-[#101114]">
      <header className="flex h-12 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/trading" className="flex items-center">
            <img src="/logo.svg" alt="Pioni" className="h-7" />
          </Link>
          {backTo && !backAboveCard ? (
            <Link
              to={backTo.to}
              className="text-sm font-medium text-[#686B82] hover:text-[#101114]"
            >
              {backTo.label ?? t("back")}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">{headerAction ?? null}</div>
      </header>
      <div
        className={`flex flex-1 flex-col items-center px-4 pb-4 ${
          backAboveCard ? "pt-1.5" : "pt-8"
        }`}
      >
        <div className="w-full max-w-[498px]">
          {backAboveCard ? (
            <Link
              to={backAboveCard.to}
              className="mb-2 inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[#484B5E] hover:bg-[rgba(104,107,130,0.08)] hover:text-[#101114]"
            >
              <ChevronLeftSmallIcon className="size-4 shrink-0" />
              {backAboveCard.label ?? t("back")}
            </Link>
          ) : null}
          {children}
        </div>
      </div>
      {showLegalFooter ? (
        <footer className="flex shrink-0 items-center justify-center gap-4 pb-4 text-sm text-[#686B82]">
          <Link to="/privacy" className="hover:text-[#101114]">
            {t("privacyNotice")}
          </Link>
          <Link to="/terms" className="hover:text-[#101114]">
            {t("termsOfService")}
          </Link>
        </footer>
      ) : null}
    </div>
  );
}

export function AuthHeaderButton({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex h-8 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-2 text-xs font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)]"
    >
      {children}
    </Link>
  );
}

export function AuthLanguageChip() {
  return <AuthLanguageMenu />;
}

export function AuthSupportChip() {
  const { t } = useLanguage();
  return (
    <a
      href={`mailto:${LEGAL.contactEmail}?subject=Pioni%20support`}
      className="inline-flex h-8 items-center gap-1 rounded-lg bg-[rgba(104,107,130,0.08)] px-2 text-xs font-medium text-[#101114] hover:bg-[rgba(104,107,130,0.12)]"
    >
      <SupportIcon className="size-4 shrink-0" />
      {t("contactSupport")}
    </a>
  );
}

export function AuthCreateAccountChip({ to }: { to: string }) {
  const { t } = useLanguage();
  return <AuthHeaderButton to={to}>{t("createAccount")}</AuthHeaderButton>;
}

export function AuthSignInChip({ to }: { to: string }) {
  const { t } = useLanguage();
  return <AuthHeaderButton to={to}>{t("signInLink")}</AuthHeaderButton>;
}
