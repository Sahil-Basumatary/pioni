import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InfoTip, { placeInfoTip } from "./InfoTip";

describe("placeInfoTip", () => {
  const tip = { width: 240, height: 80 };
  const viewport = { width: 800, height: 600 };

  it("flips below when there is no room above", () => {
    const trigger = {
      top: 20,
      bottom: 36,
      left: 100,
      right: 160,
      width: 60,
      height: 16,
      x: 100,
      y: 20,
      toJSON() {},
    };
    const pos = placeInfoTip(trigger as DOMRect, tip, "top", viewport);
    expect(pos.placement).toBe("bottom");
    expect(pos.top).toBeGreaterThan(trigger.bottom);
  });

  it("clamps horizontally inside the viewport", () => {
    const trigger = {
      top: 200,
      bottom: 216,
      left: 700,
      right: 760,
      width: 60,
      height: 16,
      x: 700,
      y: 200,
      toJSON() {},
    };
    const pos = placeInfoTip(trigger as DOMRect, tip, "top", viewport);
    expect(pos.left + tip.width).toBeLessThanOrEqual(viewport.width - 8);
  });
});

describe("InfoTip", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on hover for fine pointers", () => {
    vi.useFakeTimers();
    render(<InfoTip term="spread" />);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Spread" }).parentElement!);
    expect(screen.getByRole("tooltip")).toHaveTextContent(/gap between/i);
    fireEvent.mouseLeave(screen.getByRole("button", { name: "Spread" }).parentElement!);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens on focus and closes on Escape", () => {
    render(<InfoTip term="limit_order" label="Limit" />);
    const trigger = screen.getByRole("button", { name: "Limit" });
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("portals the tip to document.body so panes cannot clip it", () => {
    render(
      <div style={{ overflow: "hidden", width: 40, height: 20 }}>
        <InfoTip term="spread" />
      </div>,
    );
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Spread" }).parentElement!);
    const tip = screen.getByRole("tooltip");
    expect(tip.parentElement).toBe(document.body);
  });
});
