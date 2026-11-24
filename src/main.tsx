import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// If the browser restores a page from its back/forward cache (e.g. pressing
// Back after signing out), reload it so auth is re-checked instead of showing
// a stale signed-in snapshot.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
