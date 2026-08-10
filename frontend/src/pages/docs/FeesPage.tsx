import { Link } from "react-router-dom";
import { PAPER_FEES } from "../../features/trading/paperFees";
import DocLayout from "./DocLayout";

const VENUE_LABELS: Record<keyof typeof PAPER_FEES, string> = {
  spot: "Spot",
  margin: "Margin",
  futures: "Futures",
};

export default function FeesPage() {
  return (
    <DocLayout
      eyebrow="Resources"
      title="Fee schedule"
      summary={
        <>
          Nothing is charged. The order ticket shows the simulated rates below.
        </>
      }
      footer={
        <>
          Fees are part of the simulation. See{" "}
          <Link className="underline" to="/rules">
            how paper trading works
          </Link>{" "}
          for the rest of the model.
        </>
      }
    >
      <h2>What you are charged</h2>
      <p>
        Nothing. Pioni holds no money, so there is no balance to deduct a fee from and no
        payment method on file. Fills are booked at zero cost in the orders service.
      </p>

      <h2>What the ticket quotes</h2>
      <p>
        The order ticket shows an estimated fee in the order total. These are the rates
        it uses.
      </p>
      <table>
        <thead>
          <tr>
            <th>Venue</th>
            <th>Maker</th>
            <th>Taker</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(PAPER_FEES) as (keyof typeof PAPER_FEES)[]).map((venue) => (
            <tr key={venue}>
              <td>{VENUE_LABELS[venue]}</td>
              <td>{PAPER_FEES[venue].maker}</td>
              <td>{PAPER_FEES[venue].taker}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Spot and margin are 0%. Futures shows separate maker and taker rates.
      </p>

      <h2>Maker and taker</h2>
      <p>
        An order that rests on the book and waits for someone else to trade against it is
        a <strong>maker</strong> order. An order that fills immediately against what is
        already resting is a <strong>taker</strong> order. Real venues usually charge
        takers more, which is why the futures rates differ.
      </p>

      <h2>Funding, withdrawals, and transfers</h2>
      <p>
        There are none. You cannot deposit or withdraw, so there are no payment,
        conversion, or network fees to publish.
      </p>
    </DocLayout>
  );
}
