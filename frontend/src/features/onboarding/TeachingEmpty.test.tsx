import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../auth/LanguageProvider";
import TeachingEmpty from "./TeachingEmpty";

function wrap(ui: ReactElement) {
  return render(
    <LanguageProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </LanguageProvider>,
  );
}

describe("TeachingEmpty", () => {
  it("renders title and teaching body", () => {
    wrap(<TeachingEmpty id="trades" />);
    expect(screen.getByText("No trades yet")).toBeTruthy();
    expect(screen.getByText(/Your fills appear here/i)).toBeTruthy();
  });

  it("runs custom action when provided", () => {
    const onAction = vi.fn();
    wrap(<TeachingEmpty id="positions" onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /start trading/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("hides CTA when entry has no action", () => {
    wrap(<TeachingEmpty id="notifications_alerts" size="panel" />);
    expect(screen.getByText("No alerts yet")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
