import { defineConfig } from "cypress";
import { E2E_BASE } from "./cypress.config";

// Smoke suite: runs against the real running stack, so it lives behind its own
// config and the dedicated `npm run e2e:smoke` script (never the default CI run).
export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    ...E2E_BASE,
    specPattern: "cypress/e2e/smoke/**/*.cy.ts",
  },
});
