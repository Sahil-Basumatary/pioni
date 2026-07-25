import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EarnPage from "../../pages/EarnPage";
import { renderWithStore } from "../../test/utils";

describe("EarnPage", () => {
  it("renders earn chrome without competitor brand copy", () => {
    renderWithStore(<EarnPage />);
    expect(screen.getByText("Earn balance")).toBeInTheDocument();
    expect(screen.getByText("Auto Earn")).toBeInTheDocument();
    expect(screen.getByText("Est. annual earnings")).toBeInTheDocument();
    expect(screen.getByText("Lifetime earnings")).toBeInTheDocument();
    expect(screen.getByText("For you")).toBeInTheDocument();
    expect(screen.getByText("Earn with Staking")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ready to earn" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Buy to earn" })).toBeInTheDocument();
    expect(screen.getAllByText("Bitcoin").length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "Payouts" })).toBeInTheDocument();
  });

  it("switches bottom tab to activity empty state", async () => {
    const user = userEvent.setup();
    renderWithStore(<EarnPage />);
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(
      screen.getByText(/No earn activity yet/),
    ).toBeInTheDocument();
  });

  it("switches to buy to earn table", async () => {
    const user = userEvent.setup();
    renderWithStore(<EarnPage />);
    await user.click(screen.getByRole("tab", { name: "Buy to earn" }));
    expect(screen.getByText("Dymension")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Buy" }).length).toBeGreaterThan(0);
  });
});
