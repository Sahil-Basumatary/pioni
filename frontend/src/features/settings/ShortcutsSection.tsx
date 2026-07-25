import { buildShortcutGroups, modifierKeyLabel } from "./keyboardShortcuts";

function KeyCap({ label }: { label: string }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-[6px] border border-[rgba(28,19,1,0.11)] bg-[#F9F8F7] px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none text-[#2C2C2B] shadow-[0_1px_0_rgba(42,28,0,0.06)]">
      {label}
    </kbd>
  );
}

export default function ShortcutsSection() {
  const mod = modifierKeyLabel();
  const groups = buildShortcutGroups(mod);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-[#787774]">
        Shortcuts work across Pioni unless you are typing in a field.
      </p>
      {groups.map((group) => (
        <section key={group.id}>
          <h3 className="text-base font-semibold text-[#2C2C2B]">{group.title}</h3>
          <ul className="mt-3 divide-y divide-[rgba(42,28,0,0.07)]">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-6 py-3.5 first:pt-0"
              >
                <span className="text-sm text-[#2C2C2B]">{item.action}</span>
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  {item.chords.map((chord, chordIndex) => (
                    <span
                      key={`${item.id}-${chordIndex}`}
                      className="inline-flex items-center gap-1"
                    >
                      {chord.keys.map((key, keyIndex) => (
                        <span
                          key={`${item.id}-${chordIndex}-${key}`}
                          className="inline-flex items-center gap-1"
                        >
                          {keyIndex > 0 ? (
                            <span className="text-xs text-[#A19E99]">+</span>
                          ) : null}
                          <KeyCap label={key} />
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
