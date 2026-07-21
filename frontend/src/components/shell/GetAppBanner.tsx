export default function GetAppBanner() {
  return (
    <div
      className="w-full p-2"
      style={{ background: "rgba(148, 151, 169, 0.08)" }}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--text-primary)]">
            <img
              src="/logo.svg"
              alt=""
              className="h-5 brightness-0 invert"
            />
          </div>
          <div className="min-w-0 truncate text-base font-semibold text-[var(--text-primary)]">
            Pioni
          </div>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="shrink-0 cursor-not-allowed rounded-xl bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-white opacity-100"
        >
          Get the App
        </button>
      </div>
    </div>
  );
}
