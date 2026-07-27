import { baseAsset } from "../../components/shell/activityFormat";
import type { AlertCondition } from "./alertsApi";

export function formatAlertPair(symbol: string): string {
  const base = baseAsset(symbol);
  const quote = /USDC$/i.test(symbol)
    ? "USDC"
    : /USDT$/i.test(symbol)
      ? "USD"
      : /USD$/i.test(symbol)
        ? "USD"
        : "USD";
  return `${base}/${quote}`;
}

export function formatAlertCondition(condition: string): string {
  return condition.toUpperCase() === "BELOW" ? "Falls to" : "Rises to";
}

export function formatAlertPrice(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

export function alertMeetsCondition(
  condition: AlertCondition | string,
  target: string,
  price: number,
): boolean {
  const targetN = Number(target);
  if (!Number.isFinite(targetN) || !Number.isFinite(price)) return false;
  if (condition.toUpperCase() === "BELOW") return price <= targetN;
  return price >= targetN;
}
