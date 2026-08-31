import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import {
  applyDocumentLanguage,
  readRegionalPrefs,
} from './features/settings/regionalPrefs'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY && import.meta.env.PROD) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

applyDocumentLanguage(readRegionalPrefs().language)

void import('./bootstrap').then(({ mount }) => {
  mount(PUBLISHABLE_KEY || 'pk_test_e2e')
})

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
