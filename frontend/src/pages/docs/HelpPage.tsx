import { Link } from "react-router-dom";
import { SIGN_UP_PATH } from "../../features/auth/authRoutes";
import { LEGAL } from "../legal/legalConfig";
import DocLayout from "./DocLayout";

export default function HelpPage() {
  return (
    <DocLayout
      eyebrow="Resources"
      title="Help centre"
      summary={
        <>
          <strong>The short version:</strong> create an account, open the desk, and place
          an order. Practice USD is already there and nothing you do costs money.
        </>
      }
      footer={
        <>
          Cannot find an answer? Email{" "}
          <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
          .
        </>
      }
    >
      <h2>Getting started</h2>
      <p>
        <Link className="underline" to={SIGN_UP_PATH}>
          Create an account
        </Link>{" "}
        with an email address. The desk opens with practice USD already credited, so there
        is no funding step. Pick a market from the list on the left of the desk to load its
        chart, order book, and ticket.
      </p>

      <h2>Placing an order</h2>
      <p>
        Choose a side, buy or sell, then a type. A <strong>market</strong> order fills
        straight away at the best price on the book. A <strong>limit</strong> order waits
        until the market reaches the price you set. Enter a quantity, check the estimated
        total, and submit. The fill appears in your positions and trade history
        immediately.
      </p>

      <h2>Cancelling an order</h2>
      <p>
        Open orders sit in the panel below the chart. Cancel any of them from that panel
        while they are still resting. An order that has already filled cannot be undone,
        but you can close the position with an opposite trade.
      </p>

      <h2>Resetting your account</h2>
      <p>
        Go to Settings and reset the portfolio. That clears positions, open orders, and
        trade history and puts the balance back to its starting amount. It cannot be
        undone, and there is no limit on how often you can do it.
      </p>

      <h2>Prices look wrong or stopped moving</h2>
      <p>
        Quotes come from a public feed and refresh while the page is open. If they stall,
        reload the page first. Markets that are quiet can genuinely sit at the same price
        for a while, so check the 24h change before assuming the feed is stuck.
      </p>

      <h2>I cannot sign in</h2>
      <p>
        Use the{" "}
        <Link className="underline" to="/forgot-password">
          password reset
        </Link>{" "}
        link on the sign-in page. If you originally signed up with Google or another
        provider, use that same button rather than a password.
      </p>

      <h2>Deleting your account</h2>
      <p>
        Email{" "}
        <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
          {LEGAL.contactEmail}
        </a>{" "}
        from the address on the account and we will remove it. See the{" "}
        <Link className="underline" to="/privacy">
          privacy policy
        </Link>{" "}
        for what we store and for how long.
      </p>
    </DocLayout>
  );
}
