import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "../auth/LanguageProvider";
import ContentWindow from "./ContentWindow";

function renderContent(ui: ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe("ContentWindow", () => {
  it("switches tabs and toggles maximize", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    const onMaximizeToggle = vi.fn();
    renderContent(
      <ContentWindow
        label="Order form"
        tabs={[
          { id: "orderform", labelKey: "tradePaneOrderForm" },
          { id: "alerts", labelKey: "tradePaneAlerts" },
        ]}
        activeTabId="orderform"
        onTabChange={onTabChange}
        maximized={false}
        onMaximizeToggle={onMaximizeToggle}
      >
        <p>Ticket body</p>
      </ContentWindow>,
    );
    expect(screen.getByText("Ticket body")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Alerts" }));
    expect(onTabChange).toHaveBeenCalledWith("alerts");
    await user.click(screen.getByRole("button", { name: "Maximize" }));
    expect(onMaximizeToggle).toHaveBeenCalled();
  });

  it("opens add-widget menu with coming-soon items", async () => {
    const user = userEvent.setup();
    const onMenuSelect = vi.fn();
    renderContent(
      <ContentWindow
        label="Order book"
        tabs={[{ id: "orderbook", labelKey: "tradePaneOrderBook" }]}
        activeTabId="orderbook"
        onTabChange={() => {}}
        addItems={[{ id: "depth", labelKey: "tradePaneDepthChart" }]}
        onMenuSelect={onMenuSelect}
        maximized={false}
        onMaximizeToggle={() => {}}
      >
        <p>Book</p>
      </ContentWindow>,
    );
    await user.click(screen.getByRole("button", { name: "Add widget" }));
    await user.click(screen.getByRole("menuitem", { name: /Depth chart/i }));
    expect(onMenuSelect).toHaveBeenCalledWith("depth");
  });

  it("keeps tab labels as single unbroken words", () => {
    renderContent(
      <ContentWindow
        label="Order book"
        tabs={[
          { id: "orderbook", labelKey: "tradePaneOrderBook" },
          { id: "markettrades", labelKey: "tradePaneMarketTrades" },
        ]}
        activeTabId="orderbook"
        onTabChange={() => {}}
        maximized={false}
        onMaximizeToggle={() => {}}
      >
        <p>Book</p>
      </ContentWindow>,
    );
    const tab = screen.getByRole("button", { name: "Order book" });
    expect(tab.className).toMatch(/whitespace-nowrap/);
  });
});
