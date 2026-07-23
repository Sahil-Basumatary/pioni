import { createRoot, type Root } from "react-dom/client";
import TourStepDemo from "./TourStepDemo";
import "./tourDemos.css";

let demoRoot: Root | null = null;
let demoHost: HTMLElement | null = null;

export function mountTourStepDemo(host: HTMLElement, stepId: string) {
  if (demoHost !== host) {
    demoRoot?.unmount();
    demoRoot = createRoot(host);
    demoHost = host;
  }
  const root = demoRoot ?? createRoot(host);
  demoRoot = root;
  demoHost = host;
  root.render(<TourStepDemo stepId={stepId} />);
}

export function unmountTourStepDemo() {
  demoRoot?.unmount();
  demoRoot = null;
  demoHost = null;
}
