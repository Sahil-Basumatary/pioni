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
          <strong>The short version:</strong> a trading desk you can learn on, built so
          that a first order costs nothing but attention.
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
        Most people meet a real order ticket for the first time with their own money on it.
        That is an expensive place to learn what a limit order does, how an order book
        moves, or how it feels to hold a losing position. Pioni gives you the same
        instrument with the money taken out.
      </p>

      <h2>What it does</h2>
      <p>
        Live prices for {MARKET_CATALOG.length} markets, a matching engine, an order book,
        charts, positions, and a full trade history, all running against a practice
        balance. You place orders the way you would anywhere else. The difference is that
        the balance is simulated and the reset button carries no consequences.
      </p>

      <h2>How it is built</h2>
      <p>
        A React and TypeScript front end talks to a Python gateway that fronts separate
        services for market data, order matching, portfolio, and sentiment. Prices come
        from public exchange data. The matching engine is our own, which is what makes the
        order book behave like a book rather than a list of numbers.
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
