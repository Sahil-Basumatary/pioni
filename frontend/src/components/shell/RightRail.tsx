import { useState } from "react";
import { useClerk, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import NotificationsPanel from "./NotificationsPanel";
import {
  BellIcon,
  BookIcon,
  CloseIcon,
  DotsIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  UserIcon,
} from "./krakenIcons";

type RailTab = "notifications" | "favorites" | "apps" | null;

export default function RightRail() {
  const [tab, setTab] = useState<RailTab>(null);
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();

  function toggle(next: RailTab) {
    setTab((current) => (current === next ? null : next));
  }

  return (
    <div className="relative flex h-full shrink-0">
      {tab && (
        <button
          type="button"
          aria-label="Dismiss panel"
          className="rail-icon fixed inset-0 z-[55] bg-black/20"
          onClick={() => setTab(null)}
        />
      )}
      {tab === "notifications" && (
        <div className="fixed inset-y-2 right-11 z-[56] flex w-[min(450px,calc(100vw-3.5rem))] flex-col md:right-12">
          <NotificationsPanel onClose={() => setTab(null)} />
        </div>
      )}
      {tab === "favorites" && (
        <div className="fixed inset-y-2 right-11 z-[56] flex w-[min(360px,calc(100vw-3.5rem))] flex-col md:right-12">
          <SideCard title="Favorites" onClose={() => setTab(null)}>
            <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              Star markets from Trade to pin them here.
            </p>
          </SideCard>
        </div>
      )}
      {tab === "apps" && (
        <div className="fixed bottom-14 right-11 z-[56] w-56 md:right-12">
          <SideCard title="Apps" onClose={() => setTab(null)}>
            <nav className="flex flex-col gap-0.5 p-2">
              <AppLink to="/home" label="Home" onClick={() => setTab(null)} />
              <AppLink to="/trading" label="Trade" onClick={() => setTab(null)} />
              <AppLink to="/markets" label="Markets" onClick={() => setTab(null)} />
              <AppLink to="/yield" label="Yield" onClick={() => setTab(null)} />
              <AppLink to="/convert" label="Convert" onClick={() => setTab(null)} />
            </nav>
          </SideCard>
        </div>
      )}
      <aside
        aria-label="Shortcuts"
        className="relative z-[57] me-2 flex h-full w-8 shrink-0 flex-col items-center gap-2 py-2"
      >
        <RailIconButton
          label="User settings"
          onClick={() => {
            if (isSignedIn) clerk.openUserProfile();
            else clerk.openSignIn();
          }}
        >
          <UserIcon className="h-6 w-6" />
        </RailIconButton>
        <RailIconButton
          label="Show notifications"
          active={tab === "notifications"}
          onClick={() => toggle("notifications")}
        >
          <BellIcon className="h-6 w-6" />
        </RailIconButton>
        <RailIconButton
          label="Show favorites"
          active={tab === "favorites"}
          onClick={() => toggle("favorites")}
        >
          <StarIcon className="h-6 w-6" />
        </RailIconButton>
        <div className="mt-auto flex flex-col items-center gap-2">
          <RailIconButton
            label="Help"
            onClick={() => {
              window.location.href =
                "mailto:sahil@sahilbasumatary.dev?subject=Pioni%20support";
            }}
          >
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </RailIconButton>
          <RailIconButton
            label="Learn center"
            onClick={() => navigate("/terms")}
          >
            <BookIcon className="h-6 w-6" />
          </RailIconButton>
          <RailIconButton
            label="App switcher"
            active={tab === "apps"}
            onClick={() => toggle("apps")}
          >
            <DotsIcon className="h-6 w-6" />
          </RailIconButton>
        </div>
      </aside>
    </div>
  );
}

function RailIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rail-icon flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-black/[0.08] text-[var(--text-primary)]"
          : "bg-transparent text-[var(--text-primary)] hover:bg-black/[0.04]"
      }`}
    >
      {children}
    </button>
  );
}

function SideCard({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0px_4px_40px_rgba(0,0,0,0.12)]">
      <div className="flex h-11 shrink-0 items-center justify-between px-4">
        <span className="text-sm font-medium text-[var(--text-muted)]">{title}</span>
        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={onClose}
          className="rail-icon flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)]"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function AppLink({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-black/[0.04]"
    >
      {label}
    </Link>
  );
}
