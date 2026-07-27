import { NavLink } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { visibleProductNav } from "./navConfig";
import TradeMenu from "./TradeMenu";

export default function ProductNav() {
  const { isSignedIn } = useAuth();
  const items = visibleProductNav(Boolean(isSignedIn));

  return (
    <nav
      aria-label="Products"
      className="border-b border-[var(--card-border)] bg-[var(--card-bg)]"
    >
      <div className="mx-auto flex max-w-[1750px] items-center gap-1 overflow-x-auto px-2 py-1.5">
        {items.map((item) =>
          item.kind === "group" ? (
            <TradeMenu key={item.id} item={item} />
          ) : (
            <NavLink
              key={item.id}
              to={item.to}
              data-tour={item.id === "sentiment" ? "sentiment-nav" : undefined}
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
