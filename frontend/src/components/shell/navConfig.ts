export type NavLinkItem = {
  kind: "link";
  id: string;
  label: string;
  to: string;
};

export type NavGroupChild = {
  id: string;
  label: string;
  to: string;
  badge?: string;
};

export type NavGroupItem = {
  kind: "group";
  id: string;
  label: string;
  children: NavGroupChild[];
};

export type NavItem = NavLinkItem | NavGroupItem;

export const PRODUCT_NAV: NavItem[] = [
  { kind: "link", id: "home", label: "Home", to: "/home" },
  {
    kind: "group",
    id: "trade",
    label: "Trade",
    children: [
      { id: "spot", label: "Spot", to: "/trading" },
      { id: "margin", label: "Margin", to: "/trade/margin", badge: "10x" },
      { id: "futures", label: "Futures", to: "/trade/futures" },
      { id: "prop", label: "Prop", to: "/trade/prop" },
    ],
  },
  { kind: "link", id: "markets", label: "Markets", to: "/markets" },
  { kind: "link", id: "yield", label: "Yield", to: "/yield" },
  { kind: "link", id: "earn", label: "Earn", to: "/earn" },
  { kind: "link", id: "sentiment", label: "Sentiment", to: "/sentiment" },
];

export function isPathActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function groupContainsPath(item: NavGroupItem, pathname: string): boolean {
  return item.children.some((child) => isPathActive(pathname, child.to));
}
