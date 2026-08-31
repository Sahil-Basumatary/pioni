import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import { store } from './app/store'
import { ClerkTokenBridge } from './features/auth/ClerkTokenBridge'
import { clerkAppearance, clerkLocalization } from './features/auth/clerkAppearance'

export function mount(publishableKey: string) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider
        publishableKey={publishableKey}
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
}
