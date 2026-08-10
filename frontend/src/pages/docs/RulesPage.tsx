import { Link } from "react-router-dom";
import { MARKET_CATALOG } from "../../features/markets/catalog";
import DocLayout from "./DocLayout";

const CATEGORY_COUNT = new Set(MARKET_CATALOG.map((m) => m.category)).size;
const MAX_MARGIN = Math.max(...MARKET_CATALOG.map((m) => m.marginLeverage ?? 0));

export default function RulesPage() {
  return (
    <DocLayout
      eyebrow="Resources"
      title="How paper trading works"
      summary={
        <>
          Prices use public market data. Balances, fills, and fees are simulated. Orders
          never reach an exchange.
        </>
      }
      footer={
        <>
          Still stuck? Try the{" "}
          <Link className="underline" to="/help">
            help centre
          </Link>
          .
        </>
      }
    >
      <h2>Your balance</h2>
      <p>
        Every account is credited with practice USD when it is created. The balance is a
        number in our database with no cash value. It cannot be funded, withdrawn,
        transferred, or redeemed for anything.
      </p>

      <h2>Prices</h2>
      <p>
        Quotes come from public exchange market data and refresh while the page is open.
        Pioni does not set or quote its own prices. Data can be delayed or briefly
        incomplete, and it may differ from what you see on a real exchange.
      </p>

      <h2>How orders fill</h2>
      <p>
        Orders are matched by our own engine against a simulated order book, not sent to
        any venue. Market orders fill against the best resting prices in that book. Limit
        orders rest until the price reaches them or you cancel. Because the book is
        simulated, a large order can fill more smoothly than it would in a real market.
      </p>

      <h2>What you can trade</h2>
      <p>
        {MARKET_CATALOG.length} markets across {CATEGORY_COUNT} categories, all quoted
        against USD. Margin practice goes up to {MAX_MARGIN}x. Positions, orders, and
        trade history update the moment an order fills.
      </p>

      <h2>Fees</h2>
      <p>
        Nothing is charged. The ticket shows a simulated fee estimate. See the{" "}
        <Link className="underline" to="/fees">
          fee schedule
        </Link>{" "}
        for the exact rates.
      </p>

      <h2>Resetting</h2>
      <p>
        A reset clears your positions, open orders, and trade history, and returns the
        balance to its starting amount. Your account, settings, and saved favourites stay
        as they are. There is no limit on how often you can reset.
      </p>

      <h2>What Pioni is not</h2>
      <p>
        Pioni is not a broker, exchange, or regulated financial service. Nothing on it is
        financial advice. Simulated results do not predict real-market slippage,
        liquidity, or risk.
      </p>
    </DocLayout>
  );
}
