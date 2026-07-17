import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ConvertProvider } from "./ConvertContext";
import ConvertDialog from "./ConvertDialog";
import { quoteReceive } from "./convertQuote";

describe("convertQuote", () => {
  it("quotes crypto from usd paper mid", () => {
    expect(quoteReceive("USD", "BTC", 645)).toBeCloseTo(0.01, 6);
  });
});

describe("ConvertDialog", () => {
  it("renders convert chrome and keeps review disabled until amount set", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/home#dialog/convert-asset/USD/BTC");
    render(
      <MemoryRouter>
        <ConvertProvider>
          <ConvertDialog />
        </ConvertProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Convert" })).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    const review = screen.getByRole("button", { name: "Review" });
    expect(review).toBeDisabled();
    const amount = screen.getByLabelText("From amount");
    await user.type(amount, "100");
    expect(review).not.toBeDisabled();
    expect(screen.queryByText(/kraken/i)).not.toBeInTheDocument();
  });
});
