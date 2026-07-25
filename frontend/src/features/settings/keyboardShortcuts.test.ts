import { describe, expect, it } from "vitest";
import {
  buildShortcutGroups,
  isEditableKeyboardTarget,
  modifierKeyLabel,
} from "./keyboardShortcuts";

describe("keyboardShortcuts", () => {
  it("lists search, shortcuts, and escape under general", () => {
    const groups = buildShortcutGroups("⌘");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((i) => i.id)).toEqual([
      "search",
      "shortcuts",
      "dismiss",
    ]);
    expect(groups[0]?.items[0]?.chords[0]?.keys).toEqual(["⌘", "K"]);
  });

  it("returns a modifier label", () => {
    expect(["⌘", "Ctrl"]).toContain(modifierKeyLabel());
  });

  it("detects editable keyboard targets", () => {
    const input = document.createElement("input");
    const div = document.createElement("div");
    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(div)).toBe(false);
  });
});
