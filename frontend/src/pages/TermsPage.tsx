import LegalLayout from "./legal/LegalLayout";
import { LEGAL } from "./legal/legalConfig";
export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      summary={
        <>
          {LEGAL.product} uses <strong>simulated money only</strong>. It does not provide real
          trading or financial advice. By using {LEGAL.product}, you agree to these terms.
        </>
      }
    >
      <h2>1. Agreement to these terms</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) are a legal agreement between you and{" "}
        {LEGAL.operator}, {LEGAL.operatorDescription} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
        &ldquo;{LEGAL.product}&rdquo;). By creating an account or using {LEGAL.product}, you confirm
        that you have read, understood, and agree to be bound by these Terms and by our Privacy
        Policy. If you do not agree, please do not use {LEGAL.product}.
      </p>

      <h2>2. What {LEGAL.product} is</h2>
      <p>
        {LEGAL.product} is an <strong>educational paper-trading platform</strong>. It lets you
        practise buying and selling cryptocurrencies using <strong>virtual funds that have no
        monetary value</strong>. All prices, orders, trades, portfolios, and balances on the
        platform are <strong>simulated</strong>. No real money changes hands, no real assets are
        bought or sold, and no order you place is ever routed to a real exchange or market.
      </p>
      <p>
        We are <strong>not</strong> a bank, broker, dealer, exchange, custodian, or any kind of
        regulated financial institution, and we do not provide any regulated financial service.
      </p>

      <h2>3. Not financial advice</h2>
      <p>
        Everything on {LEGAL.product} — including prices, charts, sentiment scores, and automated
        signals — is provided for information and education only. It is{" "}
        <strong>not</strong> financial, investment, legal, or tax advice, and it is not a
        recommendation or solicitation to buy, sell, or hold any asset. Cryptocurrency is volatile
        and high-risk. If you later choose to trade with real money on a real platform, you do so
        entirely at your own risk and should consider seeking advice from a qualified, independent
        professional.
      </p>

      <h2>4. Eligibility</h2>
      <p>
        You must be at least {LEGAL.minimumAge} years old and legally able to enter into a contract
        to use {LEGAL.product}. By using the platform you confirm that you meet these requirements
        and that your use complies with the laws that apply to you.
      </p>

      <h2>5. Your account</h2>
      <p>
        Accounts are created and secured through our authentication provider, Clerk. You are
        responsible for keeping access to your account secure and for all activity that happens under
        it. Please let us know promptly at{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> if you believe your account
        has been accessed without your permission. You must provide accurate information and must not
        impersonate anyone else or create an account on behalf of someone else without authority.
      </p>

      <h2>6. Virtual balances</h2>
      <p>
        {LEGAL.product} may credit your account with a {LEGAL.startingPaperBalanceLabel} and other
        virtual amounts. These are fictional, have <strong>no cash or monetary value</strong>, cannot
        be withdrawn, redeemed, transferred, or exchanged for anything of value, and are provided
        solely to let you practise. We may adjust, reset, or remove virtual balances at any time —
        for example to maintain the service or to fix an error.
      </p>

      <h2>7. Market data and third-party content</h2>
      <p>
        {LEGAL.product} displays market prices, news, and sentiment sourced from third parties. This
        information is provided &ldquo;as is&rdquo;, may be delayed, incomplete, or inaccurate, and
        may differ from prices on real exchanges. We do not guarantee its accuracy and are not
        responsible for decisions you make based on it. Automated sentiment and signals are generated
        by software and are not judgements about any asset&rsquo;s value.
      </p>

      <h2>8. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use {LEGAL.product} for any unlawful, fraudulent, or harmful purpose;</li>
        <li>
          attempt to disrupt, overload, or attack the service, or bypass rate limits, security, or
          authentication;
        </li>
        <li>
          reverse engineer, scrape beyond what is reasonably permitted, or copy the platform to build
          a competing product;
        </li>
        <li>access another user&rsquo;s account or data, or misuse anyone&rsquo;s personal data;</li>
        <li>upload malware or interfere with the integrity or performance of the service.</li>
      </ul>

      <h2>9. Intellectual property</h2>
      <p>
        {LEGAL.product}, including its software, design, and content (excluding third-party market
        data), belongs to us and is protected by intellectual property law. We grant you a limited,
        personal, non-transferable, revocable licence to use {LEGAL.product} for its intended,
        non-commercial educational purpose. You may not use our name, logo, or branding without our
        permission.
      </p>

      <h2>10. Availability of the service</h2>
      <p>
        {LEGAL.product} is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We
        may change, suspend, or discontinue any part of the service at any time, and we do not
        guarantee that it will always be available, uninterrupted, or error-free.
      </p>

      <h2>11. Disclaimers and limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we exclude all warranties not expressly stated in
        these Terms, and we are not liable for any indirect or consequential loss, or for any loss
        arising from your reliance on simulated results, market data, or signals shown on{" "}
        {LEGAL.product}. Because {LEGAL.product} involves no real money, you cannot suffer real
        financial trading losses through the platform itself.
      </p>
      <p>
        Nothing in these Terms limits or excludes our liability where it would be unlawful to do so —
        including liability for death or personal injury caused by our negligence, or for fraud or
        fraudulent misrepresentation. Nothing in these Terms affects your statutory rights as a
        consumer.
      </p>

      <h2>12. Changes to the service and these terms</h2>
      <p>
        We may update these Terms as {LEGAL.product} evolves. If we ever introduce features that
        involve real money or regulated activity, those will be governed by separate, updated terms.
        When we make material changes we will update the &ldquo;Last updated&rdquo; date above and,
        where appropriate, notify you. Continuing to use {LEGAL.product} after changes take effect
        means you accept the updated Terms.
      </p>

      <h2>13. Suspension and termination</h2>
      <p>
        You may stop using {LEGAL.product} at any time. We may suspend or terminate your access if you
        breach these Terms or use the platform in a way that could harm {LEGAL.product} or other
        users.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These Terms are governed by the law of {LEGAL.jurisdiction}, and the courts of{" "}
        {LEGAL.jurisdiction} will have jurisdiction over any dispute, subject to any mandatory
        consumer-protection rights you have in your country of residence.
      </p>

      <h2>15. Contact</h2>
      <p>
        For any question about these Terms, email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </LegalLayout>
  );
}
