import { Link } from "react-router-dom";
import { MARKET_CATALOG } from "../../features/markets/catalog";
import { LEGAL } from "../legal/legalConfig";
import DocLayout from "./DocLayout";

export default function AboutPage() {
  return (
    <DocLayout
      eyebrow="Company"
      title="About Pioni"
      summary={
        <>
          A paper trading desk with live market data and simulated balances.
        </>
      }
      footer={
        <>
          Built by {LEGAL.operator}. Get in touch at{" "}
          <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
          .
        </>
      }
    >
      <h2>Why it exists</h2>
      <p>
        Real trading platforms require money before you can learn the order ticket. Pioni
        lets you practise market orders, limit orders, and position management without a
        deposit.
      </p>

      <h2>What it does</h2>
      <p>
        Pioni includes live prices for {MARKET_CATALOG.length} markets, charts, an order
        book, positions, and trade history. Orders use a simulated balance that you can
        reset.
      </p>

      <h2>How it is built</h2>
      <p>
        A React and TypeScript front end talks to a Python gateway that fronts separate
        services for market data, order matching, portfolio, and sentiment. Prices come
        from public exchange data. Orders match against a simulated book.
      </p>

      <h2>Who made it</h2>
      <p>
        Pioni is an independent project by {LEGAL.operator}, {LEGAL.operatorDescription}.
        It is not backed by, affiliated with, or endorsed by any exchange or broker.
      </p>

      <h2>What it is not</h2>
      <p>
        Pioni is not a broker or a regulated financial service, and nothing on it is
        advice. Read{" "}
        <Link className="underline" to="/rules">
          how paper trading works
        </Link>{" "}
        for the limits of the simulation before you draw conclusions from your results.
      </p>
    </DocLayout>
  );
}
