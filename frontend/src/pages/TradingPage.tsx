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
import MarketTradesPanel from "../features/trading/MarketTradesPanel";
import TradingBottomPanel, {
  ResetAccountChip,
  type BottomTab,
} from "../features/trading/TradingBottomPanel";
import ContentWindow, {
  type ContentTab,
} from "../features/trading/ContentWindow";
import AlertsPanel from "../features/trading/AlertsPanel";
import ComingSoonBody from "../features/trading/ComingSoonBody";
import DepthChartPanel from "../features/trading/DepthChartPanel";
import ResizeHandle from "../features/trading/ResizeHandle";
import { useTradingLayout } from "../features/trading/useTradingLayout";
import {
  MobilePanelShell,
  MobileTradeTabs,
  type MobileTradeTab,
} from "../features/trading/MobileTradeTabs";
import { useCompactShell } from "../hooks/useCompactShell";
import type { TradingVenue } from "../features/trading/tradingVenue";
import type { Kline } from "../types/market";

type PaneId = "ticket" | "book" | "chart" | "bottom";

const TICKET_TABS: ContentTab[] = [
  { id: "orderform", label: "Order form" },
  { id: "alerts", label: "Alerts" },
];

const BOOK_TABS: ContentTab[] = [
  { id: "orderbook", label: "Order book" },
  { id: "markettrades", label: "Market trades" },
];

const CHART_TABS: ContentTab[] = [{ id: "marketchart", label: "Market chart" }];

const BOTTOM_TABS: ContentTab[] = [
  { id: "balances", label: "Balances" },
  { id: "positions", label: "Positions" },
  { id: "orders", label: "Orders", closable: true },
  { id: "closed", label: "Closed orders" },
  { id: "history", label: "Trades" },
];

const TICKET_ADD = [
  { id: "depth", label: "Depth chart" },
  { id: "trades", label: "Trades", soon: false },
];
const BOOK_OVERFLOW = [
  { id: "depth", label: "Depth chart" },
  { id: "trades", label: "Trades", soon: false },
];
const CHART_OVERFLOW = [{ id: "depth", label: "Depth chart" }];
const BOTTOM_OVERFLOW = [{ id: "fills", label: "Fills" }];
const BOTTOM_ADD = [
  { id: "balances", label: "Balances", soon: false },
  { id: "positions", label: "Positions", soon: false },
];

const MOBILE_TABS: MobileTradeTab[] = [
  { id: "orders", label: "Orders" },
  { id: "marketchart", label: "Market chart" },
  { id: "orderform", label: "Order form" },
  { id: "positions", label: "Positions" },
  { id: "marketsummary", label: "Market summary" },
  { id: "balances", label: "Balances" },
  { id: "depth", label: "Depth chart" },
  { id: "favorites", label: "Favorites" },
  { id: "markettrades", label: "Market trades" },
  { id: "orderbook", label: "Order book" },
  { id: "simpleorderform", label: "Simple order form" },
  { id: "portfolio", label: "Portfolio" },
  { id: "closed", label: "Closed orders" },
  { id: "history", label: "Trades" },
  { id: "alerts", label: "Alerts" },
  { id: "oneclick", label: "1-Click trading" },
  { id: "aggressor", label: "Aggressor ratio" },
  { id: "tradecount", label: "Trade count" },
  { id: "volatility", label: "Volatility" },
  { id: "volume", label: "Volume" },
  { id: "bookanalytics", label: "Order book analytics" },
  { id: "futurebasis", label: "Future basis" },
  { id: "fundingrate", label: "Funding rate" },
  { id: "openinterest", label: "Open interest" },
  { id: "liqvolume", label: "Liquidation volume" },
  { id: "spread", label: "Spread" },
  { id: "longshort", label: "Long short ratio" },
  { id: "technical", label: "Technical analysis" },
  { id: "activity", label: "Activity" },
  { id: "fundingtx", label: "Funding transactions" },
  { id: "explore", label: "Explore" },
  { id: "news", label: "News" },
  { id: "bots", label: "Bots" },
];

export default function TradingPage({
  venue = "spot",
}: {
  venue?: TradingVenue;
}) {
  const dispatch = useAppDispatch();
  const symbol = useAppSelector(selectSymbol);
  const interval = useAppSelector(selectInterval);
  const status = useAppSelector(selectMarketStatus);
  const { isSignedIn } = useAuth();
  const compact = useCompactShell();
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
  const [mobileTab, setMobileTab] = useState("marketchart");
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

  function onBookMenuSelect(id: string) {
    if (id === "trades") {
      clearStub("book");
      setBookTab("markettrades");
      return;
    }
    if (id === "orderbook") {
      clearStub("book");
      setBookTab("orderbook");
      return;
    }
    showStub("book", id);
  }

  function onTicketMenuSelect(id: string) {
    if (id === "trades") {
      clearStub("ticket");
      // Surface market trades in the book pane — matches Pro widget picker.
      setBookTab("markettrades");
      return;
    }
    showStub("ticket", id);
  }

  function onBottomMenuSelect(id: string) {
    if (id === "balances" || id === "positions") {
      clearStub("bottom");
      setBottomTab(id);
      if (!bottomTabs.some((tab) => tab.id === id)) {
        const label = id === "balances" ? "Balances" : "Positions";
        setBottomTabs((tabs) => [...tabs, { id, label }]);
      }
      return;
    }
    showStub("bottom", id);
  }

  function onBottomTabClose(id: string) {
    if (bottomTabs.length <= 1) return;
    const next = bottomTabs.filter((t) => t.id !== id);
    setBottomTabs(next);
    if (bottomTab === id) {
      setBottomTab((next[0]?.id as BottomTab) ?? "orders");
    }
  }

  function renderMobilePanel() {
    switch (mobileTab) {
      case "marketchart":
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <CandlestickChart
              ref={chartRef}
              symbol={symbol}
              interval={interval}
              onIntervalChange={handleIntervalChange}
            />
          </div>
        );
      case "orderform":
      case "simpleorderform":
        return <OrderTicket venue={venue} />;
      case "orderbook":
        return <OrderBookPanel symbol={symbol} />;
      case "markettrades":
        return <MarketTradesPanel symbol={symbol} />;
      case "orders":
      case "positions":
      case "balances":
      case "closed":
      case "history":
        return (
          <div className="flex h-full min-h-0 flex-col">
            {isSignedIn && (
              <div className="flex justify-end border-b border-[var(--card-border)] px-2 py-1">
                <ResetAccountChip />
              </div>
            )}
            <TradingBottomPanel
              symbol={symbol}
              tab={mobileTab as BottomTab}
            />
          </div>
        );
      case "alerts":
        return <AlertsPanel />;
      case "depth":
        return <DepthChartPanel symbol={symbol} />;
      default:
        return (
          <ComingSoonBody
            title={MOBILE_TABS.find((t) => t.id === mobileTab)?.label ?? mobileTab}
            description="This widget will unlock in a later milestone."
          />
        );
    }
  }

  if (compact) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <PairHeader
          symbol={symbol}
          venue={venue}
          compact
          onCreateAlert={() => setMobileTab("alerts")}
        />
        <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
          <MobileTradeTabs
            tabs={MOBILE_TABS}
            activeId={mobileTab}
            onChange={setMobileTab}
          />
          <MobilePanelShell>{renderMobilePanel()}</MobilePanelShell>
        </div>
      </div>
    );
  }

  const show = (pane: PaneId) => maximized == null || maximized === pane;
  const paneClass = (pane: PaneId, base: string) =>
    maximized === pane ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : base;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      {maximized == null && (
        <PairHeader
          symbol={symbol}
          venue={venue}
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
              onMenuSelect={onTicketMenuSelect}
              maximized={maximized === "ticket"}
              onMaximizeToggle={() => toggleMaximize("ticket")}
            >
              {stubTitle.ticket === "depth" ? (
                <DepthChartPanel symbol={symbol} />
              ) : stubTitle.ticket ? (
                <ComingSoonBody
                  title={labelForStub(stubTitle.ticket)}
                  description="This widget will unlock in a later milestone."
                />
              ) : ticketTab === "alerts" ? (
                <AlertsPanel />
              ) : (
                <OrderTicket venue={venue} />
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
                  : "flex min-h-[200px] flex-1 flex-col overflow-hidden md:flex-row"
              }
            >
              {show("book") && (
                <div
                  data-tour-slot="chart-card"
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
                    onMenuSelect={onBookMenuSelect}
                    maximized={maximized === "book"}
                    onMaximizeToggle={() => toggleMaximize("book")}
                  >
                    {stubTitle.book === "depth" ? (
                      <DepthChartPanel symbol={symbol} />
                    ) : stubTitle.book ? (
                      <ComingSoonBody
                        title={labelForStub(stubTitle.book)}
                        description="This widget will unlock in a later milestone."
                      />
                    ) : bookTab === "markettrades" ? (
                      <MarketTradesPanel symbol={symbol} />
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
                    "flex min-h-[220px] min-w-0 flex-1 flex-col overflow-hidden md:min-h-0",
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
                    {stubTitle.chart === "depth" ? (
                      <DepthChartPanel symbol={symbol} />
                    ) : stubTitle.chart ? (
                      <ComingSoonBody
                        title={labelForStub(stubTitle.chart)}
                        description="This widget will unlock in a later milestone."
                      />
                    ) : (
                      <div className="flex h-full min-h-0 flex-1 flex-col">
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
                onMenuSelect={onBottomMenuSelect}
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
