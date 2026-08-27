import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/clerk-react'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import App from './App'
import { store } from './app/store'
import { ClerkTokenBridge } from './features/auth/ClerkTokenBridge'
import { clerkAppearance, clerkLocalization } from './features/auth/clerkAppearance'
import {
  applyDocumentLanguage,
  readRegionalPrefs,
} from './features/settings/regionalPrefs'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY && import.meta.env.PROD) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

applyDocumentLanguage(readRegionalPrefs().language)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY || 'pk_test_e2e'}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={clerkAppearance}
      localization={clerkLocalization}
    >
      <Provider store={store}>
        <ClerkTokenBridge />
        <App />
      </Provider>
    </ClerkProvider>
  </StrictMode>,
)

// Keep diagnostics out of production bundles.
if (import.meta.env.DEV) {
  void import('./reportWebVitals').then(({ observeLongTasks, reportWebVitals }) => {
    reportWebVitals((metric) => {
      console.info(`[web-vitals] ${metric.name}: ${Math.round(metric.value)}`, metric)
    })
    observeLongTasks((entry) => {
      console.warn(`[longtask] ${Math.round(entry.duration)}ms`, entry)
    })
  })
}
