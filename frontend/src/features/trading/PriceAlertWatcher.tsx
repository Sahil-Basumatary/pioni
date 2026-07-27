import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAppDispatch } from "../../app/hooks";
import {
  getLiveTrade,
  subscribeLiveMarket,
} from "../market/liveMarketStore";
import { useMarketSocket } from "../market/MarketSocketProvider";
import { pushToast } from "../toasts/toastSlice";
import { alertMeetsCondition, formatAlertPair, formatAlertPrice } from "./alertFormat";
import {
  useListPriceAlertsQuery,
  useTriggerPriceAlertMutation,
} from "./alertsApi";

export default function PriceAlertWatcher() {
  const { isSignedIn } = useAuth();
  const dispatch = useAppDispatch();
  const { subscribe, unsubscribe } = useMarketSocket();
  const { data: alerts = [] } = useListPriceAlertsQuery(
    { tab: "active" },
    { skip: !isSignedIn, pollingInterval: 30_000 },
  );
  const [triggerAlert] = useTriggerPriceAlertMutation();
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (!isSignedIn || alerts.length === 0) return;
    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    subscribe(symbols);
    return () => unsubscribe(symbols);
  }, [alerts, isSignedIn, subscribe, unsubscribe]);

  useEffect(() => {
    if (!isSignedIn || alerts.length === 0) return;

    const evaluate = () => {
      for (const alert of alerts) {
        if (pending.current.has(alert.id)) continue;
        const trade = getLiveTrade(alert.symbol);
        if (!trade) continue;
        const price = Number(trade.price);
        if (!alertMeetsCondition(alert.condition, alert.target_price, price)) {
          continue;
        }
        pending.current.add(alert.id);
        void triggerAlert({ alertId: alert.id, price: String(price) })
          .unwrap()
          .then((row) => {
            dispatch(
              pushToast({
                title: `${formatAlertPair(row.symbol)} alert triggered`,
                body: `${formatAlertPrice(row.target_price)} · last ${formatAlertPrice(String(price))}`,
                tone: "info",
                dedupeKey: `alert-triggered-${row.id}`,
              }),
            );
          })
          .catch(() => {
            pending.current.delete(alert.id);
          });
      }
    };

    evaluate();
    return subscribeLiveMarket(evaluate);
  }, [alerts, dispatch, isSignedIn, triggerAlert]);

  return null;
}
