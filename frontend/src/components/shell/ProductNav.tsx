import { NavLink } from "react-router-dom";
import { PRODUCT_NAV } from "./navConfig";
import TradeMenu from "./TradeMenu";

export default function ProductNav() {
  return (
    <nav
      aria-label="Products"
      className="border-b border-[var(--card-border)] bg-[var(--card-bg)]"
    >
      <div className="mx-auto flex max-w-[1750px] items-center gap-1 overflow-x-auto px-2 py-1.5">
        {PRODUCT_NAV.map((item) =>
          item.kind === "group" ? (
            <TradeMenu key={item.id} item={item} />
          ) : (
            <NavLink
              key={item.id}
              to={item.to}
              data-tour={item.id === "sentiment" ? "sentiment-nav" : undefined}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
