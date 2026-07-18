import { useCallback, useEffect, useRef, useState } from "react";
import {
  clamp,
  DEFAULT_LAYOUT,
  LAYOUT_LIMITS,
  readTradingLayout,
  TRADING_LAYOUT_EVENT,
  writeTradingLayout,
  type TradingLayoutSizes,
} from "./layoutStorage";

type Axis = "horizontal" | "vertical";
type SizeKey = keyof TradingLayoutSizes;

type DragState = {
  key: SizeKey;
  axis: Axis;
  startPointer: number;
  startSize: number;
  sign: 1 | -1;
};

export function useTradingLayout() {
  const [sizes, setSizes] = useState<TradingLayoutSizes>(() => readTradingLayout());
  const [dragging, setDragging] = useState<SizeKey | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;

  useEffect(() => {
    writeTradingLayout(sizes);
  }, [sizes]);

  useEffect(() => {
    function onPreset(event: Event) {
      const detail = (event as CustomEvent<{ sizes: TradingLayoutSizes }>).detail;
      if (!detail?.sizes) return;
      setSizes({ ...detail.sizes });
    }
    window.addEventListener(TRADING_LAYOUT_EVENT, onPreset);
    return () => window.removeEventListener(TRADING_LAYOUT_EVENT, onPreset);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const reset = useCallback(() => {
    setSizes({ ...DEFAULT_LAYOUT });
  }, []);

  const beginResize = useCallback(
    (
      key: SizeKey,
      axis: Axis,
      event: React.PointerEvent<HTMLElement>,
      sign: 1 | -1 = 1,
    ) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const startPointer = axis === "horizontal" ? event.clientX : event.clientY;
      dragRef.current = {
        key,
        axis,
        startPointer,
        startSize: sizesRef.current[key],
        sign,
      };
      setDragging(key);
      document.body.style.cursor = axis === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const pointer = drag.axis === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = (pointer - drag.startPointer) * drag.sign;
        const limits = LAYOUT_LIMITS[drag.key];
        const next = clamp(drag.startSize + delta, limits.min, limits.max);
        setSizes((prev) =>
          prev[drag.key] === next ? prev : { ...prev, [drag.key]: next },
        );
      };

      const onUp = () => {
        dragRef.current = null;
        setDragging(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [],
  );

  return {
    sizes,
    dragging,
    limits: LAYOUT_LIMITS,
    beginResize,
    reset,
  };
}
