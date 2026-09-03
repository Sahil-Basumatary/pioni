import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import {
  applyDocumentLanguage,
  readRegionalPrefs,
} from './features/settings/regionalPrefs'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const publishableKey =
  PUBLISHABLE_KEY || (import.meta.env.PROD ? undefined : 'pk_test_e2e')

applyDocumentLanguage(readRegionalPrefs().language)

void import('./bootstrap').then(({ mount }) => {
  mount(publishableKey)
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
