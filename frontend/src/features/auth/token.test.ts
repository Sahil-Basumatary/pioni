import { describe, it, expect, beforeEach } from "vitest";
import { getAuthToken, setAuthTokenGetter } from "./token";

describe("auth token bridge", () => {
  beforeEach(() => setAuthTokenGetter(null));

  it("returns null when no getter is registered", async () => {
    expect(await getAuthToken()).toBeNull();
  });

  it("returns the token from the registered getter", async () => {
    setAuthTokenGetter(async () => "jwt-123");
    expect(await getAuthToken()).toBe("jwt-123");
  });

  it("swallows getter errors and degrades to anonymous", async () => {
    setAuthTokenGetter(async () => {
      throw new Error("clerk unavailable");
    });
    expect(await getAuthToken()).toBeNull();
  });
});
