export type SizedTab = { id: string; width: number };
export function fitTabIds(
  tabs: SizedTab[],
  activeId: string,
  available: number,
  overflowBtnWidth: number,
): { visibleIds: string[]; hiddenIds: string[] } {
  if (tabs.length === 0) return { visibleIds: [], hiddenIds: [] };
  const widthOf = (id: string) => tabs.find((t) => t.id === id)?.width ?? 0;
  const visible = tabs.map((t) => t.id);
  const sum = (ids: string[]) => ids.reduce((s, id) => s + widthOf(id), 0);
  if (!Number.isFinite(available) || available <= 0 || sum(visible) <= available) {
    return { visibleIds: visible, hiddenIds: [] };
  }
  const budget = Math.max(0, available - overflowBtnWidth);
  const hidden: string[] = [];
  while (visible.length > 1 && sum(visible) > budget) {
    let dropIdx = -1;
    for (let i = visible.length - 1; i >= 0; i -= 1) {
      if (visible[i] !== activeId) {
        dropIdx = i;
        break;
      }
    }
    if (dropIdx < 0) break;
    hidden.unshift(visible[dropIdx]);
    visible.splice(dropIdx, 1);
  }
  return { visibleIds: visible, hiddenIds: hidden };
}
