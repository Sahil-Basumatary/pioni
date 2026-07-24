import { describe, expect, it } from "vitest";
import { deleteAccountCommand } from "./deleteAccountCommand";

describe("deleteAccountCommand", () => {
  it("wraps the username in the sudo delete command", () => {
    expect(deleteAccountCommand("sahil.test")).toBe('sudo delete "sahil.test"');
  });
});
