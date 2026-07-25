import { describe, expect, it } from "vitest";
import { FORGOT_PASSWORD_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "./authRoutes";
import { clerkAppearance, clerkLocalization } from "./clerkAppearance";

describe("authRoutes", () => {
  it("exposes Pro-style path routes", () => {
    expect(SIGN_IN_PATH).toBe("/sign-in");
    expect(SIGN_UP_PATH).toBe("/sign-up");
    expect(FORGOT_PASSWORD_PATH).toBe("/forgot-password");
  });
});

describe("clerkAppearance", () => {
  it("uses Pioni monochrome tokens and Pro-like layout", () => {
    expect(clerkAppearance.variables?.colorPrimary).toBe("#101114");
    expect(clerkAppearance.layout?.socialButtonsPlacement).toBe("bottom");
    expect(clerkAppearance.layout?.logoImageUrl).toBe("/logo.svg");
    expect(clerkAppearance.elements?.cardBox).toContain("rounded-[20px]");
  });
});

describe("clerkLocalization", () => {
  it("drops AI from the sign-in title", () => {
    expect(clerkLocalization.signIn.start.title).toBe("Sign in to Pioni");
    expect(clerkLocalization.signUp.start.title).toBe("Create an account");
  });
});
