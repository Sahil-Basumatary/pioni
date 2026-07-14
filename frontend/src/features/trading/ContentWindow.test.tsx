import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContentWindow from "./ContentWindow";

describe("ContentWindow", () => {
  it("switches tabs and toggles maximize", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    const onMaximizeToggle = vi.fn();
    render(
      <ContentWindow
        label="Order form"
        tabs={[
          { id: "orderform", label: "Order form" },
          { id: "alerts", label: "Alerts" },
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
    render(
      <ContentWindow
        label="Order book"
        tabs={[{ id: "orderbook", label: "Order book" }]}
        activeTabId="orderbook"
        onTabChange={() => {}}
        addItems={[{ id: "depth", label: "Depth chart" }]}
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
});
