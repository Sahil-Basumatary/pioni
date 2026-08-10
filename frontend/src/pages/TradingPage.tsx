import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  symbolSelected,
} from "../features/instrument/instrumentSlice";
import {
  DESK_SYMBOL_PARAM,
  resolveDeskSymbol,
} from "../features/markets/marketLinks";
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
  type MenuItem,
} from "../features/trading/ContentWindow";
import AlertsPanel from "../features/trading/AlertsPanel";
import { useAlertCreate } from "../features/trading/AlertCreateContext";
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
import { useLanguage } from "../features/auth/LanguageProvider";
import type { MessageKey } from "../features/i18n/translate";
import type { TradingVenue } from "../features/trading/tradingVenue";
import type { Kline } from "../types/market";

type PaneId = "ticket" | "book" | "chart" | "bottom";

const TICKET_TABS: ContentTab[] = [
  { id: "orderform", labelKey: "tradePaneOrderForm" },
  { id: "alerts", labelKey: "tradePaneAlerts" },
];

const BOOK_TABS: ContentTab[] = [
  { id: "orderbook", labelKey: "tradePaneOrderBook" },
  { id: "markettrades", labelKey: "tradePaneMarketTrades" },
];

const CHART_TABS: ContentTab[] = [
  { id: "marketchart", labelKey: "tradePaneMarketChart" },
];

const BOTTOM_TABS: ContentTab[] = [
  { id: "balances", labelKey: "tradePaneBalances" },
  { id: "positions", labelKey: "tradePanePositions" },
  { id: "orders", labelKey: "tradePaneOrders", closable: true },
  { id: "closed", labelKey: "tradePaneClosedOrders" },
  { id: "history", labelKey: "tradePaneTrades" },
];

const TICKET_ADD: MenuItem[] = [
  { id: "depth", labelKey: "tradePaneDepthChart" },
  { id: "trades", labelKey: "tradePaneTrades", soon: false },
];
const BOOK_OVERFLOW: MenuItem[] = [
  { id: "depth", labelKey: "tradePaneDepthChart" },
  { id: "trades", labelKey: "tradePaneTrades", soon: false },
];
const CHART_OVERFLOW: MenuItem[] = [
  { id: "depth", labelKey: "tradePaneDepthChart" },
];
const BOTTOM_OVERFLOW: MenuItem[] = [
  { id: "fills", labelKey: "tradePaneFills" },
];
const BOTTOM_ADD: MenuItem[] = [
  { id: "balances", labelKey: "tradePaneBalances", soon: false },
  { id: "positions", labelKey: "tradePanePositions", soon: false },
];

const MOBILE_TABS: MobileTradeTab[] = [
  { id: "orders", labelKey: "tradePaneOrders" },
  { id: "marketchart", labelKey: "tradePaneMarketChart" },
  { id: "orderform", labelKey: "tradePaneOrderForm" },
  { id: "positions", labelKey: "tradePanePositions" },
  { id: "marketsummary", labelKey: "tradePaneMarketSummary" },
  { id: "balances", labelKey: "tradePaneBalances" },
  { id: "depth", labelKey: "tradePaneDepthChart" },
  { id: "favorites", labelKey: "favorites" },
  { id: "markettrades", labelKey: "tradePaneMarketTrades" },
  { id: "orderbook", labelKey: "tradePaneOrderBook" },
  { id: "simpleorderform", labelKey: "tradePaneSimpleOrderForm" },
  { id: "portfolio", labelKey: "tradePanePortfolio" },
  { id: "closed", labelKey: "tradePaneClosedOrders" },
  { id: "history", labelKey: "tradePaneTrades" },
  { id: "alerts", labelKey: "tradePaneAlerts" },
  { id: "oneclick", labelKey: "tradePaneOneClick" },
  { id: "aggressor", labelKey: "tradePaneAggressorRatio" },
  { id: "tradecount", labelKey: "tradePaneTradeCount" },
  { id: "volatility", labelKey: "tradePaneVolatility" },
  { id: "volume", labelKey: "tradePaneVolume" },
  { id: "bookanalytics", labelKey: "tradePaneBookAnalytics" },
  { id: "futurebasis", labelKey: "tradePaneFutureBasis" },
  { id: "fundingrate", labelKey: "tradePaneFundingRate" },
  { id: "openinterest", labelKey: "tradePaneOpenInterest" },
  { id: "liqvolume", labelKey: "tradePaneLiqVolume" },
  { id: "spread", labelKey: "tradePaneSpread" },
  { id: "longshort", labelKey: "tradePaneLongShort" },
  { id: "technical", labelKey: "tradePaneTechnical" },
  { id: "activity", labelKey: "tradePaneActivity" },
  { id: "fundingtx", labelKey: "tradePaneFundingTx" },
  { id: "explore", labelKey: "tradePaneExplore" },
  { id: "news", labelKey: "tradePaneNews" },
  { id: "bots", labelKey: "tradePaneBots" },
];

export default function TradingPage({
  venue = "spot",
}: {
  venue?: TradingVenue;
}) {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const symbol = useAppSelector(selectSymbol);
  const interval = useAppSelector(selectInterval);
  const status = useAppSelector(selectMarketStatus);
  const { isSignedIn } = useAuth();
  const compact = useCompactShell();
  const { openCreateAlert } = useAlertCreate();
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

  useEffect(() => {
    const requested = resolveDeskSymbol(searchParams.get(DESK_SYMBOL_PARAM));
    if (!requested) return;
    dispatch(symbolSelected(requested));
    /* Consumed, so drop it: leaving it behind would make a later pair switch
       inside the desk snap back on refresh. */
    const next = new URLSearchParams(searchParams);
    next.delete(DESK_SYMBOL_PARAM);
    setSearchParams(next, { replace: true });
  }, [dispatch, searchParams, setSearchParams]);

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
        const labelKey =
          id === "balances" ? "tradePaneBalances" : "tradePanePositions";
        setBottomTabs((tabs) => [...tabs, { id, labelKey }]);
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
            title={t(
              MOBILE_TABS.find((tab) => tab.id === mobileTab)?.labelKey ??
                "tradePaneMarketChart",
            )}
            description={t("tradeWidgetSoonBlurb")}
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
          onCreateAlert={() => {
            setMobileTab("alerts");
            openCreateAlert(symbol);
          }}
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
            openCreateAlert(symbol);
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
              label={t("tradePaneOrderForm")}
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
                  title={t(labelKeyForStub(stubTitle.ticket))}
                  description={t("tradeWidgetSoonBlurb")}
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
            label={t("tradeResizeOrderTicket")}
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
                    label={t("tradePaneOrderBook")}
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
                        title={t(labelKeyForStub(stubTitle.book))}
                        description={t("tradeWidgetSoonBlurb")}
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
                  label={t("tradeResizeOrderBook")}
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
                    label={t("tradePaneMarketChart")}
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
                        title={t(labelKeyForStub(stubTitle.chart))}
                        description={t("tradeWidgetSoonBlurb")}
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
              label={t("tradeResizeBottomPanel")}
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
                label={t("tradePaneTradingActivity")}
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
                    title={t(labelKeyForStub(stubTitle.bottom))}
                    description={t("tradeWidgetSoonBlurb")}
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

function labelKeyForStub(id: string): MessageKey {
  const map: Record<string, MessageKey> = {
    depth: "tradePaneDepthChart",
    trades: "tradePaneTrades",
    fills: "tradePaneFills",
    balances: "tradePaneBalances",
    positions: "tradePanePositions",
  };
  return map[id] ?? "tradePaneMarketChart";
}
