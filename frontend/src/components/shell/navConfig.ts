import type { ShellMessageKey } from "../../features/i18n/shellCatalog";

export type NavLinkItem = {
  kind: "link";
  id: string;
  labelKey: ShellMessageKey;
  to: string;
};

export type NavGroupChild = {
  id: string;
  labelKey: ShellMessageKey;
  to: string;
  badge?: string;
};

export type NavGroupItem = {
  kind: "group";
  id: string;
  labelKey: ShellMessageKey;
  children: NavGroupChild[];
};

export type NavItem = NavLinkItem | NavGroupItem;

export const PRODUCT_NAV: NavItem[] = [
  { kind: "link", id: "home", labelKey: "navHome", to: "/home" },
  {
    kind: "group",
    id: "trade",
    labelKey: "navTrade",
    children: [
      { id: "spot", labelKey: "navSpot", to: "/trading" },
      { id: "margin", labelKey: "navMargin", to: "/trade/margin", badge: "10x" },
      { id: "futures", labelKey: "navFutures", to: "/trade/futures" },
      { id: "prop", labelKey: "navProp", to: "/trade/prop" },
    ],
  },
  { kind: "link", id: "markets", labelKey: "navMarkets", to: "/markets" },
  { kind: "link", id: "analytics", labelKey: "navAnalytics", to: "/analytics" },
  { kind: "link", id: "yield", labelKey: "navYield", to: "/yield" },
  { kind: "link", id: "earn", labelKey: "navEarn", to: "/earn" },
  { kind: "link", id: "history", labelKey: "navHistory", to: "/history" },
  { kind: "link", id: "otc", labelKey: "navOtc", to: "/otc" },
  { kind: "link", id: "sentiment", labelKey: "navSentiment", to: "/sentiment" },
];

export function visibleProductNav(isSignedIn: boolean): NavItem[] {
  if (isSignedIn) return PRODUCT_NAV;
  return PRODUCT_NAV.filter((item) => item.id !== "home");
}

export function isPathActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function groupContainsPath(item: NavGroupItem, pathname: string): boolean {
  return item.children.some((child) => isPathActive(pathname, child.to));
}

export function groupDefaultTo(item: NavGroupItem): string {
  return item.children.find((child) => child.id === "spot")?.to ?? item.children[0]?.to ?? "/";
}
