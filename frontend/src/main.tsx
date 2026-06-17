import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App'
import { store } from './app/store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
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
