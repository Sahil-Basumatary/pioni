import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SignedOutUnlock from "./SignedOutUnlock";

describe("SignedOutUnlock", () => {
  it("matches Pro unlock line with Sign in and Sign up links", () => {
    render(
      <MemoryRouter>
        <SignedOutUnlock />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Unlock everything Pioni has to offer/i),
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
