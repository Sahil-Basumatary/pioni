import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PortfolioPanel from "./PortfolioPanel";

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock("@clerk/clerk-react", () => ({
  SignedIn: ({ children }: { children: unknown }) => children,
  SignedOut: () => null,
  SignInButton: ({ children }: { children: unknown }) => children,
}));

vi.mock("./portfolioApi", () => ({
  useGetMyPortfolioQuery: () => mockQuery(),
}));

describe("PortfolioPanel", () => {
  beforeEach(() => mockQuery.mockReset());

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
