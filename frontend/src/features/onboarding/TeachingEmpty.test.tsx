import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TeachingEmpty from "./TeachingEmpty";
import { TEACHING_EMPTY } from "./teachingEmptyCopy";

function wrap(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("TeachingEmpty", () => {
  it("renders title and teaching body", () => {
    wrap(<TeachingEmpty id="trades" />);
    expect(screen.getByText(TEACHING_EMPTY.trades.title)).toBeTruthy();
    expect(screen.getByText(/first paper fill/i)).toBeTruthy();
  });

  it("runs custom action when provided", () => {
    const onAction = vi.fn();
    wrap(<TeachingEmpty id="positions" onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /start trading/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("hides CTA when entry has no action", () => {
    wrap(<TeachingEmpty id="notifications_alerts" size="panel" />);
    expect(screen.getByText(TEACHING_EMPTY.notifications_alerts.title)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
