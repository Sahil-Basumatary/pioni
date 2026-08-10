import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PropPage from "../../pages/PropPage";

describe("PropPage", () => {
  it("presents Prop as an unavailable concept", () => {
    render(
      <MemoryRouter>
        <PropPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        name: "Preview a prop evaluation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Review example plans and risk limits\.\s*No fees, funding, or payouts are available\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Review an example plan")).toBeInTheDocument();
    expect(screen.getByText("Preview a result")).toBeInTheDocument();
    expect(screen.getByText("Preview a payout")).toBeInTheDocument();
    expect(screen.getByText("Concept preview")).toBeInTheDocument();
    expect(screen.getByText("Choose an example wallet size")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10,000 USD" })).toBeInTheDocument();
    expect(screen.getByText("Pioni Prop FAQ")).toBeInTheDocument();
    expect(screen.getByText("What is prop trading?")).toBeInTheDocument();
    expect(screen.queryByText(/35,000 wallets funded/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/keep up to 90%/i)).not.toBeInTheDocument();
  });

  it("expands FAQ answers and updates wallet selection and fees", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PropPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("85.00 USD")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "50,000 USD" }));
    expect(screen.getByText(/Starter 50,000 USD/)).toBeInTheDocument();
    expect(screen.getByText("400.00 USD")).toBeInTheDocument();
    expect(screen.getByText("280.00 USD")).toBeInTheDocument();
    expect(screen.getByText("180.00 USD")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "200,000 USD" }));
    expect(screen.getByText("1,090.00 USD")).toBeInTheDocument();
    expect(screen.getByText("660.00 USD")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "What is prop trading?" }));
    expect(
      screen.getByText(/Pioni Prop is only a concept preview/),
    ).toBeInTheDocument();
  });
});
