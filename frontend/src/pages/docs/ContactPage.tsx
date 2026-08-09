import { Link } from "react-router-dom";
import { LEGAL } from "../legal/legalConfig";
import DocLayout from "./DocLayout";

export default function ContactPage() {
  return (
    <DocLayout
      eyebrow="Company"
      title="Contact"
      summary={
        <>
          <strong>The short version:</strong> one inbox,{" "}
          <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
          . Pioni is a personal project, so replies come from a person rather than a queue.
        </>
      }
    >
      <h2>Support</h2>
      <p>
        Check the{" "}
        <Link className="underline" to="/help">
          help centre
        </Link>{" "}
        first, since it covers the questions that come up most. If it does not answer
        yours, email{" "}
        <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
          {LEGAL.contactEmail}
        </a>{" "}
        and include what you were doing and what you expected to happen.
      </p>

      <h2>Bugs</h2>
      <p>
        Tell us the market, the action, and roughly when it happened. A screenshot helps
        more than a description. If something looks wrong with a balance or a fill, do not
        reset the account before reporting it, or the evidence goes with it.
      </p>

      <h2>Privacy and account deletion</h2>
      <p>
        Email from the address on the account and say what you want removed. The{" "}
        <Link className="underline" to="/privacy">
          privacy policy
        </Link>{" "}
        sets out what we hold and your rights over it.
      </p>

      <h2>Anything else</h2>
      <p>
        Feedback on the product, questions about how it is built, or notes on the API are
        all welcome at the same address.
      </p>
    </DocLayout>
  );
}
