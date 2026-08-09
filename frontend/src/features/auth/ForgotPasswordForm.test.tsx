import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { clerkErrorMessage } from "./authErrors";
import { LanguageProvider } from "./LanguageProvider";

vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: vi.fn(), attemptFirstFactor: vi.fn() },
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
});

describe("ForgotPasswordForm", () => {
  it("shows request step", () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <ForgotPasswordForm />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "Forgot password" })).toBeInTheDocument();
    expect(
      screen.getByText(/Enter your email address. If it's correct/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send email" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });
});
