import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PortfolioPanel from "./PortfolioPanel";

const { mockQuery, mockAuth } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockAuth: vi.fn(() => ({ isSignedIn: true })),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => mockAuth(),
}));

vi.mock("./portfolioApi", () => ({
  useGetMyPortfolioQuery: () => mockQuery(),
}));

describe("PortfolioPanel", () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockAuth.mockReturnValue({ isSignedIn: true });
  });

  it("shows a signed-out balance placeholder without a second sign-in button", () => {
    mockAuth.mockReturnValue({ isSignedIn: false });
    render(<PortfolioPanel />);
    expect(screen.getByText("Paper balance")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("shows the formatted paper balance when signed in", () => {
    mockQuery.mockReturnValue({
      data: { name: "Main", cash_balance: "10000" },
      isLoading: false,
      isError: false,
    });
    render(<PortfolioPanel />);
    expect(screen.getByText("Paper balance")).toBeInTheDocument();
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
  });

  it("shows a loading state while fetching", () => {
    mockQuery.mockReturnValue({ isLoading: true });
    render(<PortfolioPanel />);
    expect(screen.getByText("Loading portfolio…")).toBeInTheDocument();
  });

  it("shows a retry affordance on error", () => {
    mockQuery.mockReturnValue({ isError: true, refetch: vi.fn() });
    render(<PortfolioPanel />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});
