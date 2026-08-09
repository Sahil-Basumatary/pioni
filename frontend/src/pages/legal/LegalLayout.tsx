import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import DocLayout from "../docs/DocLayout";
import { LEGAL } from "./legalConfig";

type LegalLayoutProps = {
  title: string;
  summary: ReactNode;
  children: ReactNode;
};

export default function LegalLayout({ title, summary, children }: LegalLayoutProps) {
  return (
    <DocLayout
      eyebrow="Legal"
      title={title}
      meta={`Last updated: ${LEGAL.lastUpdated}`}
      summary={summary}
      footer={
        <>
          Questions about this document? Email{" "}
          <a className="underline" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
          . See also our <NavLink className="underline" to="/terms">Terms of Service</NavLink> and{" "}
          <NavLink className="underline" to="/privacy">Privacy Policy</NavLink>.
        </>
      }
    >
      {children}
    </DocLayout>
  );
}
