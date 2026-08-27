const DEFAULT_GATEWAY_URL = "http://localhost:8000";
const DEFAULT_MARKET_WS_URL = "ws://localhost:8000/ws/market";

export const GATEWAY_URL =
  import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || GATEWAY_URL;

export const MARKET_WS_URL =
  import.meta.env.VITE_WS_URL || DEFAULT_MARKET_WS_URL;
