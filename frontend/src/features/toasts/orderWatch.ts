const OPEN = new Set([
  "OPEN",
  "PENDING",
  "PARTIALLY_FILLED",
  "NEW",
  "ACCEPTED",
]);

const watch = new Map<string, string>();

export function watchOpenOrder(orderId: string, status: string): void {
  const s = status.toUpperCase();
  if (OPEN.has(s)) watch.set(orderId, s);
  else watch.delete(orderId);
}

export function unwatchOrder(orderId: string): void {
  watch.delete(orderId);
}

export function watchedOrderIds(): string[] {
  return [...watch.keys()];
}

export function watchedStatus(orderId: string): string | undefined {
  return watch.get(orderId);
}

export function setWatchedStatus(orderId: string, status: string): void {
  const s = status.toUpperCase();
  if (OPEN.has(s)) watch.set(orderId, s);
  else watch.delete(orderId);
}
