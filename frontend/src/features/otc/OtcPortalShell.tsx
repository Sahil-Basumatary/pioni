import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export default function OtcPortalShell({
  children,
}: {
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const rfqActive =
    pathname === "/otc/portal" || pathname === "/otc/quote";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-2 pb-16 pt-1 text-[var(--text-primary)]">
      <div className="relative grid w-fit grid-flow-col gap-x-1" role="tablist" aria-label="OTC Portal">
        <NavLink
          to="/otc/dashboard"
          role="tab"
          className={({ isActive }) =>
            `box-border flex items-center whitespace-nowrap rounded-xl px-2 py-1.5 text-sm font-medium ${
              isActive
                ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/otc/portal"
          role="tab"
          aria-selected={rfqActive}
          className={() =>
            `box-border flex items-center whitespace-nowrap rounded-xl px-2 py-1.5 text-sm font-medium ${
              rfqActive
                ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`
          }
        >
          RFQ
        </NavLink>
      </div>
      {children}
    </div>
  );
}
