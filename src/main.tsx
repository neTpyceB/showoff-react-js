import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import type { AppState } from './platform/state.ts'
import './index.css'

declare global {
  interface Window {
    __APP_STATE__?: AppState
  }
}

const queryClient = new QueryClient()
const initialState = window.__APP_STATE__

if (!initialState) {
  throw new Error('SSR app state was not found.')
}

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <App initialState={initialState} />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
