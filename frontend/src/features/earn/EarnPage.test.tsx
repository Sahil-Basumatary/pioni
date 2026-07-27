import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import EarnPage from "../../pages/EarnPage";
import { renderWithStore } from "../../test/utils";

const auth = vi.hoisted(() => ({ isSignedIn: true }));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isSignedIn: auth.isSignedIn }),
}));

function renderEarn() {
  return renderWithStore(
    <MemoryRouter>
      <EarnPage />
    </MemoryRouter>,
  );
}

describe("EarnPage", () => {
  it("shows unlock splash when signed out", () => {
    auth.isSignedIn = false;
    renderEarn();
    expect(
      screen.getByText(/Unlock everything Pioni has to offer/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Earn balance")).not.toBeInTheDocument();
  });

  it("renders earn chrome without competitor brand copy", () => {
    auth.isSignedIn = true;
    renderEarn();
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
    auth.isSignedIn = true;
    const user = userEvent.setup();
    renderEarn();
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(
      screen.getByText(/No earn activity yet/),
    ).toBeInTheDocument();
  });

  it("switches to buy to earn table", async () => {
    auth.isSignedIn = true;
    const user = userEvent.setup();
    renderEarn();
    await user.click(screen.getByRole("tab", { name: "Buy to earn" }));
    expect(screen.getByText("Dymension")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Buy" }).length).toBeGreaterThan(0);
  });
});
