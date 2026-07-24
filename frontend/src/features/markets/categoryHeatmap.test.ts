import { describe, expect, it } from "vitest";
import { layoutTreemap, type HeatDatum } from "./categoryHeatmap";

const sample: HeatDatum[] = [
  { id: "a", label: "A", color: "#000", value: 100, changePct: 1 },
  { id: "b", label: "B", color: "#000", value: 50, changePct: -1 },
  { id: "c", label: "C", color: "#000", value: 25, changePct: 0 },
  { id: "d", label: "D", color: "#000", value: 25, changePct: 2 },
];

describe("layoutTreemap", () => {
  it("lays out all leaves inside the canvas", () => {
    const cells = layoutTreemap(sample, 400, 300, 2);
    expect(cells).toHaveLength(4);
    for (const cell of cells) {
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.w).toBeGreaterThan(0);
      expect(cell.h).toBeGreaterThan(0);
    }
  });
});
