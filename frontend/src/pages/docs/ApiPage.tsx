import { Link } from "react-router-dom";
import { LEGAL } from "../legal/legalConfig";
import DocLayout from "./DocLayout";

type Endpoint = { method: string; path: string; note: string };

const PUBLIC_ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/market/prices", note: "Latest quote for every listed market" },
  { method: "GET", path: "/market/prices/{symbol}", note: "Latest quote for one market" },
  { method: "GET", path: "/market/klines/{symbol}", note: "Candles for charting" },
  { method: "GET", path: "/orderbook/{symbol}", note: "Current simulated order book" },
  { method: "GET", path: "/health", note: "Service liveness and readiness" },
];

const ACCOUNT_ENDPOINTS: Endpoint[] = [
  { method: "POST", path: "/orders", note: "Place an order" },
  { method: "GET", path: "/orders", note: "List your orders" },
  { method: "DELETE", path: "/orders/{order_id}", note: "Cancel a resting order" },
  { method: "GET", path: "/me/portfolio", note: "Balance and holdings" },
  { method: "GET", path: "/me/positions", note: "Open positions" },
  { method: "GET", path: "/me/trades", note: "Fill history" },
  { method: "GET", path: "/me/ledger", note: "Balance movements" },
  { method: "POST", path: "/me/portfolio/reset", note: "Clear the book and start again" },
];

function EndpointTable({ rows }: { rows: Endpoint[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Path</th>
          <th>Returns</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.method} ${row.path}`}>
            <td>
              <code>{row.method}</code>
            </td>
            <td>
              <code>{row.path}</code>
            </td>
            <td>{row.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ApiPage() {
  return (
    <DocLayout
      eyebrow="Resources"
      title="API reference"
      summary={
        <>
          <strong>The short version:</strong> a REST gateway plus a WebSocket stream. Every
          write touches simulated balances only, so there is nothing here that can move
          real money.
        </>
      }
      footer={
        <>
          This reference covers the shape of the API rather than every field. Questions to{" "}
          <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
          .
        </>
      }
    >
      <h2>Authentication</h2>
      <p>
        Public market data needs no credentials. Anything under <code>/me</code> or{" "}
        <code>/orders</code> is tied to your account. Create a key from the API keys panel
        in Settings and send it with each request. Keys are shown once when created, so
        store yours somewhere safe. Delete a key from the same panel to revoke it
        immediately.
      </p>

      <h2>Public endpoints</h2>
      <EndpointTable rows={PUBLIC_ENDPOINTS} />

      <h2>Account endpoints</h2>
      <EndpointTable rows={ACCOUNT_ENDPOINTS} />

      <h2>Live updates</h2>
      <p>
        A WebSocket endpoint streams price and order book updates so you do not have to
        poll <code>/market/prices</code>. Subscribe to the symbols you care about and the
        gateway pushes changes as they arrive.
      </p>

      <h2>Limits and fair use</h2>
      <p>
        Requests are rate limited per account. Pioni is a personal educational project
        rather than a commercial service, so please poll at a sensible interval and prefer
        the WebSocket stream for anything that needs to stay current.
      </p>

      <h2>Stability</h2>
      <p>
        The API is not versioned yet and can change while Pioni is in active development.
        It is here to make the platform inspectable and scriptable, not to underpin
        anything you depend on. See the{" "}
        <Link className="underline" to="/terms">
          terms of service
        </Link>{" "}
        for the full position.
      </p>
    </DocLayout>
  );
}
