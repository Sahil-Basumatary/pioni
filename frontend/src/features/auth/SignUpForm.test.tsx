import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SignUpForm from "./SignUpForm";
import { LanguageProvider } from "./LanguageProvider";

vi.mock("@clerk/clerk-react", () => ({
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: vi.fn(),
      prepareEmailAddressVerification: vi.fn(),
      attemptEmailAddressVerification: vi.fn(),
      authenticateWithRedirect: vi.fn(),
    },
    setActive: vi.fn(),
  }),
}));

describe("SignUpForm", () => {
  it("renders Pro-style stacked email and password fields", () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <SignUpForm />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "Create an account" })).toBeInTheDocument();
    expect(screen.getByText("Access paper trading on Pioni")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up with Google" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  });
});
