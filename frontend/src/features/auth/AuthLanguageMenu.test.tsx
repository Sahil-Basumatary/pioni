import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AuthLanguageMenu from "./AuthLanguageMenu";
import SignInForm from "./SignInForm";
import { LanguageProvider } from "./LanguageProvider";
import {
  LANGUAGE_OPTIONS,
  readRegionalPrefs,
  writeRegionalPrefs,
} from "../settings/regionalPrefs";

vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: vi.fn(), authenticateWithRedirect: vi.fn() },
    setActive: vi.fn(),
  }),
}));

describe("AuthLanguageMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    writeRegionalPrefs({
      timezone: "Europe/London",
      currency: "USD",
      language: "en-US",
      numberFormat: "en-US",
    });
  });

  it("opens Pro language list and persists selection", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <AuthLanguageMenu />
      </LanguageProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("option", { name: "Deutsch" })).toBeInTheDocument();
    expect(LANGUAGE_OPTIONS.length).toBeGreaterThan(20);
    await user.click(screen.getByRole("option", { name: "Deutsch" }));
    expect(readRegionalPrefs().language).toBe("de-DE");
    expect(screen.getByRole("button", { name: "Sprache" })).toHaveTextContent("Deutsch");
    expect(document.documentElement.lang).toBe("de-DE");
  });

  it("translates sign-in copy when language changes", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <MemoryRouter>
          <AuthLanguageMenu />
          <SignInForm />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "Sign in to Pioni" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByRole("option", { name: "Deutsch" }));
    expect(screen.getByRole("heading", { name: "Bei Pioni anmelden" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fortfahren" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mit Google anmelden" })).toBeInTheDocument();
  });
});
