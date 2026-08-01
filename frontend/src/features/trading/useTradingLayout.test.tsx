import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ResizeHandle from "./ResizeHandle";
import { useTradingLayout } from "./useTradingLayout";
import { DEFAULT_LAYOUT } from "./layoutStorage";
import { LanguageProvider } from "../auth/LanguageProvider";

function Harness() {
  const { sizes, beginResize, dragging } = useTradingLayout();
  return (
    <div>
      <span data-testid="ticket-width">{sizes.ticketWidth}</span>
      <span data-testid="dragging">{dragging ?? "none"}</span>
      <ResizeHandle
        orientation="vertical"
        label="Resize order ticket"
        active={dragging === "ticketWidth"}
        onPointerDown={(e) => beginResize("ticketWidth", "horizontal", e, 1)}
      />
    </div>
  );
}

describe("resize drag", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("widens the ticket when the handle is dragged right", () => {
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>,
    );
    const handle = screen.getByRole("button", { name: "Resize order ticket" });
    expect(screen.getByTestId("ticket-width")).toHaveTextContent(
      String(DEFAULT_LAYOUT.ticketWidth),
    );
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 50, button: 0, pointerId: 1 });
    expect(screen.getByTestId("dragging")).toHaveTextContent("ticketWidth");
    fireEvent.pointerMove(window, { clientX: 160, clientY: 50, buttons: 1, pointerId: 1 });
    expect(screen.getByTestId("ticket-width")).toHaveTextContent(
      String(DEFAULT_LAYOUT.ticketWidth + 60),
    );
    fireEvent.pointerUp(window, { clientX: 160, clientY: 50, pointerId: 1 });
    expect(screen.getByTestId("dragging")).toHaveTextContent("none");
  });
});
