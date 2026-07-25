import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SignInForm from "./SignInForm";
import { clerkErrorMessage } from "./authErrors";
import { LanguageProvider } from "./LanguageProvider";

vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: vi.fn(), authenticateWithRedirect: vi.fn() },
    setActive: vi.fn(),
  }),
}));

vi.mock("@clerk/clerk-react/errors", () => ({
  isClerkAPIResponseError: () => false,
}));

describe("clerkErrorMessage", () => {
  it("reads Error messages", () => {
    expect(clerkErrorMessage(new Error("Nope"))).toBe("Nope");
  });
  it("falls back for unknown errors", () => {
    expect(clerkErrorMessage({})).toBe("Something went wrong");
  });
});

describe("SignInForm", () => {
  it("renders joined email and password fields on one screen", () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <SignInForm />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "Sign in to Pioni" })).toBeInTheDocument();
    expect(screen.getByText("Email or username")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "password" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });
});
