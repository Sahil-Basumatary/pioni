import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import CandlestickChart, {
  type CandlestickChartHandle,
  type Interval,
} from "../components/trading/CandlestickChart";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  intervalChanged,
  selectInterval,
  selectSymbol,
} from "../features/instrument/instrumentSlice";
import { selectMarketStatus } from "../features/market/marketSlice";
import {
  STATUS_BAR_SYMBOLS,
  useMarketSocket,
} from "../features/market/MarketSocketProvider";
import OrderTicket from "../features/orders/OrderTicket";
import PairHeader from "../features/trading/PairHeader";
import OrderBookPanel from "../features/trading/OrderBookPanel";
import TradingBottomPanel, {
  ResetAccountChip,
  type BottomTab,
} from "../features/trading/TradingBottomPanel";
import ContentWindow, {
  type ContentTab,
} from "../features/trading/ContentWindow";
import ComingSoonBody from "../features/trading/ComingSoonBody";
import ResizeHandle from "../features/trading/ResizeHandle";
import { useTradingLayout } from "../features/trading/useTradingLayout";
import type { Kline } from "../types/market";

type PaneId = "ticket" | "book" | "chart" | "bottom";

const TICKET_TABS: ContentTab[] = [
  { id: "orderform", label: "Order form" },
  { id: "alerts", label: "Alerts" },
];

const BOOK_TABS: ContentTab[] = [{ id: "orderbook", label: "Order book" }];

const CHART_TABS: ContentTab[] = [{ id: "marketchart", label: "Market chart" }];

const BOTTOM_TABS: ContentTab[] = [
  { id: "balances", label: "Balances" },
  { id: "positions", label: "Positions" },
  { id: "orders", label: "Orders", closable: true },
  { id: "closed", label: "Closed orders" },
  { id: "history", label: "Trade history" },
];

const TICKET_ADD = [
  { id: "depth", label: "Depth chart" },
  { id: "trades", label: "Trades" },
];
const BOOK_OVERFLOW = [
  { id: "depth", label: "Depth chart" },
  { id: "trades", label: "Trades" },
];
const CHART_OVERFLOW = [{ id: "depth", label: "Depth chart" }];
const BOTTOM_OVERFLOW = [{ id: "fills", label: "Fills" }];
const BOTTOM_ADD = [
  { id: "balances", label: "Balances" },
  { id: "positions", label: "Positions" },
];

export default function TradingPage() {
  const dispatch = useAppDispatch();
  const symbol = useAppSelector(selectSymbol);
  const interval = useAppSelector(selectInterval);
  const status = useAppSelector(selectMarketStatus);
  const { isSignedIn } = useAuth();
  const { subscribe, unsubscribe, registerKlineHandler } = useMarketSocket();
  const chartRef = useRef<CandlestickChartHandle>(null);
  const prevSymbolRef = useRef<string | null>(null);
  const {
    sizes,
    dragging,
    beginResize,
    reset,
  } = useTradingLayout();
  const [maximized, setMaximized] = useState<PaneId | null>(null);
  const [ticketTab, setTicketTab] = useState("orderform");
  const [bookTab, setBookTab] = useState("orderbook");
  const [chartTab, setChartTab] = useState("marketchart");
  const [bottomTab, setBottomTab] = useState<BottomTab>("orders");
  const [bottomTabs, setBottomTabs] = useState(BOTTOM_TABS);
  const [stubTitle, setStubTitle] = useState<Record<PaneId, string | null>>({
    ticket: null,
    book: null,
    chart: null,
    bottom: null,
  });

  const handleKline = useCallback(
    (kline: Kline, klineInterval: string) => {
      if (klineInterval !== interval) return;
      chartRef.current?.updateKline(kline);
    },
    [interval],
  );

  useEffect(() => {
    return registerKlineHandler(handleKline);
  }, [registerKlineHandler, handleKline]);

  const handleIntervalChange = useCallback(
    (next: Interval) => dispatch(intervalChanged(next)),
    [dispatch],
  );

  useEffect(() => {
    if (status !== "connected") return;
    const prev = prevSymbolRef.current;
    const keep = new Set<string>(STATUS_BAR_SYMBOLS);
    if (prev && prev !== symbol && !keep.has(prev)) {
      unsubscribe([prev]);
    }
    subscribe([symbol]);
    prevSymbolRef.current = symbol;
  }, [symbol, status, subscribe, unsubscribe]);

  function toggleMaximize(pane: PaneId) {
    setMaximized((current) => (current === pane ? null : pane));
  }

  function showStub(pane: PaneId, title: string) {
    setStubTitle((prev) => ({ ...prev, [pane]: title }));
  }

  function clearStub(pane: PaneId) {
    setStubTitle((prev) => ({ ...prev, [pane]: null }));
  }

  function onBottomTabClose(id: string) {
    if (bottomTabs.length <= 1) return;
    const next = bottomTabs.filter((t) => t.id !== id);
    setBottomTabs(next);
    if (bottomTab === id) {
      setBottomTab((next[0]?.id as BottomTab) ?? "orders");
    }
  }

  const show = (pane: PaneId) => maximized == null || maximized === pane;
  const paneClass = (pane: PaneId, base: string) =>
    maximized === pane ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : base;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {maximized == null && (
        <PairHeader
          symbol={symbol}
          onCreateAlert={() => {
            setMaximized(null);
            setTicketTab("alerts");
            setStubTitle((s) => ({ ...s, ticket: null }));
          }}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {show("ticket") && (
          <div
            className={paneClass(
              "ticket",
              "min-h-[320px] w-full shrink-0 overflow-hidden max-md:!w-full md:min-h-0",
            )}
            style={maximized === "ticket" ? undefined : { width: sizes.ticketWidth }}
          >
            <ContentWindow
              label="Order form"
              tabs={TICKET_TABS}
              activeTabId={ticketTab}
              onTabChange={(id) => {
                clearStub("ticket");
                setTicketTab(id);
              }}
              addItems={TICKET_ADD}
              onMenuSelect={(id) => showStub("ticket", id)}
              maximized={maximized === "ticket"}
              onMaximizeToggle={() => toggleMaximize("ticket")}
            >
              {stubTitle.ticket ? (
                <ComingSoonBody
                  title={labelForStub(stubTitle.ticket)}
                  description="This widget will unlock in a later milestone."
                />
              ) : ticketTab === "alerts" ? (
                <ComingSoonBody
                  title="Alerts"
                  description="Price and order alerts will live here — paper-only."
                />
              ) : (
                <OrderTicket />
              )}
            </ContentWindow>
          </div>
        )}
        {maximized == null && (
          <ResizeHandle
            orientation="vertical"
            label="Resize order ticket"
            active={dragging === "ticketWidth"}
            onPointerDown={(e) => beginResize("ticketWidth", "horizontal", e, 1)}
            onDoubleClick={reset}
          />
        )}
        <div
          className={
            maximized != null && maximized !== "ticket"
              ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              : maximized === "ticket"
                ? "hidden"
                : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          }
        >
          {(show("book") || show("chart")) && (
            <div
              className={
                maximized === "bottom"
                  ? "hidden"
                  : "flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
              }
            >
              {show("book") && (
                <div
                  className={paneClass(
                    "book",
                    "min-h-[280px] w-full shrink-0 overflow-hidden max-md:!w-full md:min-h-0",
                  )}
                  style={maximized === "book" ? undefined : { width: sizes.bookWidth }}
                >
                  <ContentWindow
                    label="Order book"
                    tabs={BOOK_TABS}
                    activeTabId={bookTab}
                    onTabChange={(id) => {
                      clearStub("book");
                      setBookTab(id);
                    }}
                    overflowItems={BOOK_OVERFLOW}
                    addItems={TICKET_ADD}
                    onMenuSelect={(id) => showStub("book", id)}
                    maximized={maximized === "book"}
                    onMaximizeToggle={() => toggleMaximize("book")}
                  >
                    {stubTitle.book ? (
                      <ComingSoonBody
                        title={labelForStub(stubTitle.book)}
                        description="This widget will unlock in a later milestone."
                      />
                    ) : (
                      <OrderBookPanel symbol={symbol} />
                    )}
                  </ContentWindow>
                </div>
              )}
              {maximized == null && (
                <ResizeHandle
                  orientation="vertical"
                  label="Resize order book"
                  active={dragging === "bookWidth"}
                  onPointerDown={(e) => beginResize("bookWidth", "horizontal", e, 1)}
                  onDoubleClick={reset}
                />
              )}
              {show("chart") && (
                <div
                  className={paneClass(
                    "chart",
                    "flex min-h-[280px] min-w-0 flex-1 flex-col overflow-hidden md:min-h-0",
                  )}
                >
                  <ContentWindow
                    label="Market chart"
                    tabs={CHART_TABS}
                    activeTabId={chartTab}
                    onTabChange={(id) => {
                      clearStub("chart");
                      setChartTab(id);
                    }}
                    overflowItems={CHART_OVERFLOW}
                    addItems={TICKET_ADD}
                    onMenuSelect={(id) => showStub("chart", id)}
                    maximized={maximized === "chart"}
                    onMaximizeToggle={() => toggleMaximize("chart")}
                  >
                    {stubTitle.chart ? (
                      <ComingSoonBody
                        title={labelForStub(stubTitle.chart)}
                        description="This widget will unlock in a later milestone."
                      />
                    ) : (
                      <div className="flex h-full min-h-0 flex-col p-2">
                        <CandlestickChart
                          ref={chartRef}
                          symbol={symbol}
                          interval={interval}
                          onIntervalChange={handleIntervalChange}
                        />
                      </div>
                    )}
                  </ContentWindow>
                </div>
              )}
            </div>
          )}
          {maximized == null && show("bottom") && (
            <ResizeHandle
              orientation="horizontal"
              label="Resize bottom panel"
              active={dragging === "bottomHeight"}
              onPointerDown={(e) => beginResize("bottomHeight", "vertical", e, -1)}
              onDoubleClick={reset}
            />
          )}
          {show("bottom") && (
            <div
              className={paneClass(
                "bottom",
                "h-[180px] shrink-0 overflow-hidden max-md:!h-[180px] md:h-auto",
              )}
              style={maximized === "bottom" ? undefined : { height: sizes.bottomHeight }}
            >
              <ContentWindow
                label="Trading activity"
                tabs={bottomTabs}
                activeTabId={bottomTab}
                onTabChange={(id) => {
                  clearStub("bottom");
                  setBottomTab(id as BottomTab);
                }}
                onTabClose={onBottomTabClose}
                overflowItems={BOTTOM_OVERFLOW}
                addItems={BOTTOM_ADD}
                onMenuSelect={(id) => showStub("bottom", id)}
                headerEnd={isSignedIn ? <ResetAccountChip /> : undefined}
                maximized={maximized === "bottom"}
                onMaximizeToggle={() => toggleMaximize("bottom")}
              >
                {stubTitle.bottom ? (
                  <ComingSoonBody
                    title={labelForStub(stubTitle.bottom)}
                    description="This widget will unlock in a later milestone."
                  />
                ) : (
                  <TradingBottomPanel symbol={symbol} tab={bottomTab} />
                )}
              </ContentWindow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function labelForStub(id: string): string {
  const map: Record<string, string> = {
    depth: "Depth chart",
    trades: "Trades",
    fills: "Fills",
    balances: "Balances",
    positions: "Positions",
  };
  return map[id] ?? id;
}
