import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InfoTip from "./InfoTip";

describe("InfoTip", () => {
  it("opens on hover for fine pointers", () => {
    render(<InfoTip term="spread" />);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Spread" }).parentElement!);
    expect(screen.getByRole("tooltip")).toHaveTextContent(/gap between/i);
    fireEvent.mouseLeave(screen.getByRole("button", { name: "Spread" }).parentElement!);
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
});
