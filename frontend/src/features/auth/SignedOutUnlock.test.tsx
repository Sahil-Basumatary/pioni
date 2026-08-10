import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SignedOutUnlock from "./SignedOutUnlock";

describe("SignedOutUnlock", () => {
  it("shows the sign-in prompt with account links", () => {
    render(
      <MemoryRouter>
        <SignedOutUnlock />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Sign in or create an account to continue/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  it("can show the page logo splash", () => {
    render(
      <MemoryRouter>
        <SignedOutUnlock size="page" showLogo />
      </MemoryRouter>,
    );
    expect(document.querySelector('img[src="/logo.svg"]')).toBeTruthy();
  });
});
