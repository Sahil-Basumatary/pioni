import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { ChevronDownSmallIcon } from "../components/shell/shellIcons";
import { OTC_FAQ, OTC_RESOURCES, OTC_WHY } from "../features/otc/otcContent";
import { isOtcUnlocked, setOtcUnlocked } from "../features/otc/otcPortalContent";
import { useToast } from "../features/toasts/useToast";

export default function OtcPage() {
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const toast = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [confirmUnlock, setConfirmUnlock] = useState(false);

  const goPortal = () => {
    setOtcUnlocked(true);
    setConfirmUnlock(false);
    navigate("/otc/portal");
  };

  const unlock = () => {
    if (isOtcUnlocked()) {
      navigate("/otc/portal");
      return;
    }
    setConfirmUnlock(true);
  };

  const scrollToWhy = () => {
    document.getElementById("otc-why")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-2 pb-16 pt-1 text-[var(--text-primary)]">
      {confirmUnlock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otc-unlock-title"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--card-bg)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
            style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
          >
            <h2 id="otc-unlock-title" className="mb-2 text-lg font-medium">
              Unlock paper OTC Portal?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--text-muted)]">
              You’ll get RFQ, exposure and quote history for practice only. No real
              funds move. Simulated minimum size is 50,000 USD.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmUnlock(false)}
                className="inline-flex h-10 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-4 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goPortal}
                className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white"
              >
                Confirm unlock
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        className="overflow-hidden rounded-2xl bg-[var(--card-bg)] px-6 py-10 md:px-10"
        style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
      >
        <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center lg:gap-20">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Pioni OTC
            </p>
            <h1 className="max-w-[660px] text-[32px] font-medium leading-tight tracking-tight md:text-[40px]">
              White-glove service for large trades
            </h1>
            <div className="flex max-w-[660px] flex-col gap-4 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
              <p>
                Pioni’s OTC (over-the-counter) desk offers deep liquidity, tighter
                spreads and private settlement off the open order book.
              </p>
              <p>
                Become an OTC client today to enjoy a discreet, secure service
                built for institutions and high-net-worth clients.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SignedOut>
                <button
                  type="button"
                  onClick={() => openSignIn({})}
                  className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-soft)]"
                >
                  Unlock OTC trading
                </button>
              </SignedOut>
              <SignedIn>
                <button
                  type="button"
                  onClick={unlock}
                  className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:bg-[var(--accent-soft)]"
                >
                  Unlock OTC trading
                </button>
              </SignedIn>
              <button
                type="button"
                onClick={scrollToWhy}
                className="inline-flex h-10 items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
              >
                Learn more
              </button>
            </div>
          </div>
          <div className="relative mx-auto w-56 shrink-0 self-center sm:w-64 lg:mx-0 lg:block lg:w-72">
            <div
              className="pointer-events-none absolute inset-0 scale-150 rounded-full opacity-50 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at 45% 45%, rgba(42,42,42,0.14), transparent 68%)",
              }}
              aria-hidden
            />
            <img
              src="/illustrations/otc-hero.png?v=2"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 w-full scale-[1.85] object-contain opacity-35 blur-[22px]"
            />
            <img
              src="/illustrations/otc-hero.png?v=2"
              alt="Pioni OTC illustration"
              className="relative w-full object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
            />
          </div>
        </div>
      </section>

      <section id="otc-why" className="my-8">
        <h2 className="pb-3 text-base font-medium tracking-tight">Why trade OTC?</h2>
        <div
          className="overflow-hidden rounded-2xl bg-[var(--card-bg)] px-6 py-6 md:px-8 md:py-8"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          <div className="flex flex-col gap-8 lg:flex-row">
            <button
              type="button"
              onClick={() => toast("Paper OTC walkthrough — coming soon")}
              className="relative w-full overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{ aspectRatio: "16 / 9" }}
              aria-label="Play OTC walkthrough"
            >
              <img
                src="/illustrations/otc-why-media.png"
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
            <ul className="mx-auto grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-8 lg:flex lg:w-80 lg:min-w-80 lg:flex-col lg:items-center lg:justify-between lg:gap-1 lg:py-8">
              {OTC_WHY.map(({ id, title, body, Icon }) => (
                <li
                  key={id}
                  className="flex flex-col items-center justify-center gap-1 py-2 text-center"
                >
                  <div className="mb-1 flex size-fit rounded-full bg-[rgba(42,42,42,0.08)] p-2 text-[var(--text-primary)]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-base font-medium">{title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="my-8">
        <h2 className="pb-4 text-base font-medium tracking-tight">Resources</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {OTC_RESOURCES.map((item) => (
            <article
              key={item.kind}
              className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-[var(--card-bg)] px-4 py-4"
              style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
            >
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: "1674 / 480" }}
              >
                <img
                  src={item.image}
                  alt=""
                  width={1674}
                  height={480}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {item.kind}
              </p>
              <h3 className="text-base font-medium">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {item.body}
              </p>
              <button
                type="button"
                onClick={() =>
                  toast(`Paper ${item.cta.toLowerCase()} — coming soon`)
                }
                className="mt-auto inline-flex h-10 w-fit items-center rounded-lg bg-[rgba(104,107,130,0.08)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(104,107,130,0.12)]"
              >
                {item.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="my-8">
        <h2 className="pb-4 text-base font-medium tracking-tight">OTC trading FAQ</h2>
        <div
          className="overflow-hidden rounded-2xl bg-[var(--card-bg)] px-4 py-2 md:px-6"
          style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.07)" }}
        >
          {OTC_FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="relative min-w-full">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="group w-full cursor-pointer border-0 bg-transparent py-0 text-left hover:bg-black/[0.02]"
                >
                  <div className="flex w-full items-center py-4">
                    <span className="text-sm text-[var(--text-primary)]">
                      {item.q}
                    </span>
                    <span
                      className={`ms-auto flex shrink-0 items-center ps-7 text-[var(--text-muted)] transition-transform duration-300 ease-in-out ${
                        open ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDownSmallIcon className="size-6" />
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="flex flex-col gap-3 pb-4">
                    <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                      {item.a}
                    </p>
                    {item.bullets && (
                      <ul className="flex list-inside list-disc flex-col gap-2">
                        {item.bullets.map((b) => (
                          <li
                            key={b}
                            className="text-sm leading-relaxed text-[var(--text-primary)]"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.sections?.map((section) => (
                      <div key={section.title} className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {section.title}
                        </p>
                        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                          {section.body}
                        </p>
                        {section.bullets && (
                          <ul className="flex list-inside list-disc flex-col gap-2">
                            {section.bullets.map((b) => (
                              <li
                                key={b}
                                className="text-sm leading-relaxed text-[var(--text-primary)]"
                              >
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
