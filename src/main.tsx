import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ProveedorApp } from './state/store'
import './styles.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Falta el elemento #root')

// Cachea el shell para poder registrar comidas sin conexion. En entornos que
// no permiten service workers (algunos iframes) simplemente no se registra.
// VITE_EMBEBIDO lo omite en el empaquetado de archivo unico, sin sw.js al lado.
if ('serviceWorker' in navigator && import.meta.env.PROD && !import.meta.env.VITE_EMBEBIDO) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
    } catch {
      // Sin service worker: la app funciona igual, solo pierde el modo offline.
    }
  })
}

createRoot(raiz).render(
  <StrictMode>
    <ProveedorApp>
      <App />
    </ProveedorApp>
  </StrictMode>,
)
