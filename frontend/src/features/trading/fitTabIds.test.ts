import { describe, expect, it } from "vitest";
import { fitTabIds } from "./fitTabIds";

describe("fitTabIds", () => {
  const tabs = [
    { id: "a", width: 80 },
    { id: "b", width: 90 },
    { id: "c", width: 70 },
  ];

  it("shows all when space is enough", () => {
    const fit = fitTabIds(tabs, "a", 300, 36);
    expect(fit.visibleIds).toEqual(["a", "b", "c"]);
    expect(fit.hiddenIds).toEqual([]);
  });

  it("hides whole tabs from the right and keeps active", () => {
    const fit = fitTabIds(tabs, "a", 130, 36);
    expect(fit.visibleIds).toContain("a");
    expect(fit.hiddenIds.length).toBeGreaterThan(0);
    expect(fit.visibleIds.concat(fit.hiddenIds).sort()).toEqual(["a", "b", "c"]);
  });

  it("never mid-splits a tab id list", () => {
    const fit = fitTabIds(tabs, "c", 100, 36);
    expect(fit.visibleIds).toContain("c");
    for (const id of fit.visibleIds) {
      expect(["a", "b", "c"]).toContain(id);
    }
  });
});
