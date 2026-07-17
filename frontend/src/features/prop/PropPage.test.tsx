import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PropPage from "../../pages/PropPage";

describe("PropPage", () => {
  it("matches prop surface chrome and keeps competitor brand out of copy", () => {
    render(
      <MemoryRouter>
        <PropPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        name: "Trade with our money — not yours",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You bring the strategy\. We provide the capital\.\s*You keep up to 90% of your profits\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Buy an evaluation")).toBeInTheDocument();
    expect(screen.getByText("Get funded")).toBeInTheDocument();
    expect(screen.getByText("Collect profits")).toBeInTheDocument();
    expect(screen.getByText("No capital needed")).toBeInTheDocument();
    expect(screen.getByText("Choose your wallet size")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10,000 USD" })).toBeInTheDocument();
    expect(screen.getByText("Pioni Prop FAQ")).toBeInTheDocument();
    expect(screen.getByText("What is prop trading?")).toBeInTheDocument();
    expect(screen.queryByText(/kraken/i)).not.toBeInTheDocument();
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
      screen.getByText(/Prop trading \(proprietary trading\) is when traders trade/),
    ).toBeInTheDocument();
  });
});
