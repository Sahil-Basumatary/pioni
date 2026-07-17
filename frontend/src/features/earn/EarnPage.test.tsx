import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import EarnPage from "../../pages/EarnPage";

describe("EarnPage", () => {
  it("renders earn chrome without competitor brand copy", () => {
    render(
      <MemoryRouter>
        <EarnPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Earn balance")).toBeInTheDocument();
    expect(screen.getByText("Auto Earn")).toBeInTheDocument();
    expect(screen.getByText("Est. annual earnings")).toBeInTheDocument();
    expect(screen.getByText("Lifetime earnings")).toBeInTheDocument();
    expect(screen.getByText("For you")).toBeInTheDocument();
    expect(screen.getByText("Earn with Staking")).toBeInTheDocument();
    expect(screen.getByText("Ready to earn")).toBeInTheDocument();
    expect(screen.getAllByText("Bitcoin").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Payouts" })).toBeInTheDocument();
    expect(screen.queryByText(/kraken/i)).not.toBeInTheDocument();
  });

  it("switches bottom tab to activity empty state", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EarnPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(
      screen.getByText(/No earn activity yet/),
    ).toBeInTheDocument();
  });
});
