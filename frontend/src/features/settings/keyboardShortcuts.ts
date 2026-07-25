export type ShortcutChord = {
  keys: string[];
};

export type ShortcutItem = {
  id: string;
  action: string;
  chords: ShortcutChord[];
};

export type ShortcutGroup = {
  id: string;
  title: string;
  items: ShortcutItem[];
};

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modifierKeyLabel(): string {
  return isApplePlatform() ? "⌘" : "Ctrl";
}

export function buildShortcutGroups(mod: string = modifierKeyLabel()): ShortcutGroup[] {
  return [
    {
      id: "general",
      title: "General",
      items: [
        {
          id: "search",
          action: "Search markets",
          chords: [{ keys: [mod, "K"] }],
        },
        {
          id: "shortcuts",
          action: "Open keyboard shortcuts",
          chords: [{ keys: [mod, "/"] }],
        },
        {
          id: "dismiss",
          action: "Close dialog or menu",
          chords: [{ keys: ["Esc"] }],
        },
      ],
    },
  ];
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
