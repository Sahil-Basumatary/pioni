import { defineConfig } from "cypress";

// Shared E2E settings reused by the stubbed (default) and live smoke configs.
export const E2E_BASE = {
  baseUrl: "http://localhost:5173",
  supportFile: "cypress/support/e2e.ts",
  video: false,
} as const;

export default defineConfig({
  // We never read Cypress.env() in browser code, so keep the insecure bridge off.
  allowCypressEnv: false,
  e2e: {
    ...E2E_BASE,
    specPattern: "cypress/e2e/**/*.cy.ts",
    excludeSpecPattern: "cypress/e2e/smoke/**",
  },
});
