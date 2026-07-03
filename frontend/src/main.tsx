import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'
import { store } from './app/store'
import { ClerkTokenBridge } from './features/auth/ClerkTokenBridge'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Provider store={store}>
        <ClerkTokenBridge />
        <App />
      </Provider>
    </ClerkProvider>
  </StrictMode>,
)

// DEV-gated so the entire reporting path is dead code in production and gets
// stripped from the shipped bundle; Lighthouse measures prod independently.
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
