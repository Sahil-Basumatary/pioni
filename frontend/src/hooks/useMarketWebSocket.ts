import { useCallback, useEffect, useRef, useState } from "react";
import { markTradeBrowserReceived } from "../features/market/marketLatency";
import type { Kline, Trade, WSCommand, WSMessage } from "../types/market";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

const INITIAL_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;
const DEFAULT_WS_URL = "ws://localhost:8000/ws/market";

interface UseMarketWebSocketOptions {
  onTrade?: (trade: Trade) => void;
  onKline?: (kline: Kline, interval: string) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function useMarketWebSocket(options: UseMarketWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const intentionalCloseRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const updateStatus = useCallback((next: ConnectionStatus) => {
    setStatus(next);
    optionsRef.current.onStatusChange?.(next);
  }, []);

  const sendCommand = useCallback((cmd: WSCommand) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(cmd));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) return;
    const url = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;
    updateStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      updateStatus("connected");
      if (subscribedRef.current.size > 0) {
        sendCommand({
          action: "subscribe",
          symbols: Array.from(subscribedRef.current),
        });
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        switch (msg.type) {
          case "trade":
            optionsRef.current.onTrade?.(markTradeBrowserReceived(msg.data));
            break;
          case "kline":
            optionsRef.current.onKline?.(msg.data, msg.interval);
            break;
          case "error":
            console.warn("[ws] server error:", msg.message);
            break;
        }
      } catch {
        console.warn("[ws] failed to parse message");
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      updateStatus("disconnected");
      if (!intentionalCloseRef.current) {
        const delay = reconnectDelayRef.current;
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, delay);
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [updateStatus, sendCommand]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const subscribe = useCallback(
    (symbols: string[]) => {
      const upper = symbols.map((s) => s.toUpperCase());
      upper.forEach((s) => subscribedRef.current.add(s));
      sendCommand({ action: "subscribe", symbols: upper });
    },
    [sendCommand],
  );

  const unsubscribe = useCallback(
    (symbols: string[]) => {
      const upper = symbols.map((s) => s.toUpperCase());
      upper.forEach((s) => subscribedRef.current.delete(s));
      sendCommand({ action: "unsubscribe", symbols: upper });
    },
    [sendCommand],
  );

  useEffect(() => {
    intentionalCloseRef.current = false;
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, subscribe, unsubscribe } as const;
}
