import LegalLayout from "./legal/LegalLayout";
import { LEGAL } from "./legal/legalConfig";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      summary={
        <>
          {LEGAL.product} is a simulated paper-trading tool. We use your sign-in identity and
          technical logs to run and secure the service. We do not collect payment details or sell
          your data.
        </>
      }
    >
      <h2>1. Who we are</h2>
      <p>
        {LEGAL.product} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is operated by{" "}
        {LEGAL.operator}, {LEGAL.operatorDescription}. For the purposes of UK data protection law
        (the UK GDPR and the Data Protection Act 2018), {LEGAL.operator} is the{" "}
        <strong>data controller</strong> responsible for your personal data.
      </p>
      <p>
        You can reach us at any time about privacy at{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>2. What {LEGAL.product} is (and what it is not)</h2>
      <p>
        {LEGAL.product} is an educational <strong>paper-trading</strong> platform. All balances,
        orders, and trades are <strong>simulated</strong> using virtual funds with no monetary
        value. We are not a bank, broker, exchange, or financial institution, and we do not process
        deposits, withdrawals, or real-money transactions. Because of this, we do not collect
        payment card details, bank details, or government identity documents.
      </p>

      <h2>3. The information we collect</h2>
      <h3>Account and identity data</h3>
      <p>
        When you sign in, authentication is handled by our provider{" "}
        <strong>Clerk</strong>. Depending on how you sign in (email, Google, or X), we receive from
        Clerk your name, email address, username, profile image, and a unique account identifier. If
        you use a social login, we receive only the basic profile fields that provider shares — we
        never receive your password.
      </p>
      <h3>Activity data</h3>
      <p>
        We store the paper-trading activity you generate inside {LEGAL.product}: your virtual
        portfolio, simulated orders and trades, and the tickers you look up. This is used to power
        your dashboard and is not real financial information.
      </p>
      <h3>Technical and log data</h3>
      <p>
        Like any secure web service, our servers automatically record technical data when you
        interact with {LEGAL.product} — including your IP address, browser and device type, request
        timestamps, pages or endpoints accessed, and a short request correlation ID. We use this to
        keep the service running, prevent abuse, and diagnose problems.
      </p>

      <h2>4. How and why we use your information</h2>
      <p>Under UK GDPR we must have a lawful basis for using your data. Ours are:</p>
      <ul>
        <li>
          <strong>To provide the service</strong> — creating your account and running your paper
          portfolio (basis: performance of a contract with you).
        </li>
        <li>
          <strong>To keep the service secure</strong> — rate-limiting, abuse prevention, fraud and
          bot detection, and debugging (basis: our legitimate interests in a safe, reliable
          platform).
        </li>
        <li>
          <strong>To maintain and improve {LEGAL.product}</strong> — understanding which features are
          used and fixing issues (basis: our legitimate interests).
        </li>
        <li>
          <strong>To meet legal obligations</strong> — where the law requires us to retain or
          disclose information (basis: legal obligation).
        </li>
      </ul>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        Today {LEGAL.product} uses only <strong>strictly necessary cookies</strong>, set by Clerk to
        keep you securely signed in. These do not require consent because the service cannot function
        without them. We do not currently use advertising or tracking cookies.
      </p>
      <p>
        We may in future introduce privacy-conscious analytics (for example Vercel Web Analytics or a
        product-analytics tool). If and when we do, we will update this policy and, where required,
        ask for your consent through a cookie banner before any non-essential cookies are set.
      </p>

      <h2>6. Who we share your information with</h2>
      <p>
        We do not sell your personal data. We share it only with the service providers
        (&ldquo;processors&rdquo;) that {LEGAL.product} is built on, and only so they can perform
        their function:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — user authentication and account management.
        </li>
        <li>
          <strong>Render</strong> — backend hosting and our application database.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and delivery of the {LEGAL.product} web app.
        </li>
      </ul>
      <p>
        {LEGAL.product} also reads public market and news data from third parties (such as
        cryptocurrency exchanges, NewsAPI, Reddit, and X) to display prices and sentiment. We request
        this data as {LEGAL.product}; we do not send your personal information to these sources.
      </p>
      <p>
        We may also disclose information if required to do so by law, or to protect the rights,
        safety, or property of {LEGAL.product}, our users, or the public.
      </p>

      <h2>7. International data transfers</h2>
      <p>
        Some of our providers are based outside the UK (for example in the United States). Where your
        personal data is transferred internationally, we rely on appropriate safeguards recognised
        under UK law — such as the UK International Data Transfer Agreement or the UK Addendum to the
        EU Standard Contractual Clauses — so that your data remains protected.
      </p>

      <h2>8. How long we keep your information</h2>
      <p>
        We keep your account and activity data for as long as your account is active. If you ask us
        to delete your account, we will remove your personal data within a reasonable period, except
        where we must retain limited information to comply with legal obligations or to resolve
        disputes. Technical logs are kept only for a short period for security and troubleshooting.
      </p>

      <h2>9. How we protect your information</h2>
      <p>
        We use industry-standard measures to protect your data, including encryption in transit
        (HTTPS), delegated authentication so we never store your password, access controls between
        our internal services, and rate-limiting to guard against abuse. No online service can be
        100% secure, but we take these responsibilities seriously.
      </p>

      <h2>10. Your rights</h2>
      <p>Under UK GDPR you have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>ask us to correct inaccurate or incomplete data;</li>
        <li>ask us to erase your data (&ldquo;right to be forgotten&rdquo;);</li>
        <li>restrict or object to how we use your data;</li>
        <li>request a copy of your data in a portable format;</li>
        <li>withdraw consent where we rely on it, at any time.</li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. You will not be charged,
        and we will respond within the timeframes required by law.
      </p>

      <h2>11. Children</h2>
      <p>
        {LEGAL.product} is intended only for people aged {LEGAL.minimumAge} or over. We do not
        knowingly collect personal data from anyone under {LEGAL.minimumAge}. If you believe a minor
        has provided us with personal data, please contact us and we will delete it.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy as {LEGAL.product} evolves — for example if we add new
        features or providers. When we make material changes, we will update the &ldquo;Last
        updated&rdquo; date above and, where appropriate, notify you in the app.
      </p>

      <h2>13. How to contact us and complaints</h2>
      <p>
        For any privacy question or request, email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. If you are unhappy with how
        we have handled your data, you also have the right to complain to the UK&rsquo;s Information
        Commissioner&rsquo;s Office (ICO) at{" "}
        <a href="https://ico.org.uk/" target="_blank" rel="noreferrer noopener">
          ico.org.uk
        </a>
        , though we would appreciate the chance to resolve your concern first.
      </p>
    </LegalLayout>
  );
}
