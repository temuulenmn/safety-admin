// Register the service worker + surface the deferred install prompt.
//
// Usage:
//   import { registerPWA, onInstallable } from 'src/utils/pwa'
//   registerPWA()
//   onInstallable((prompt) => { /* show your "Install" button, call prompt() */ })

let deferredPrompt = null
const listeners = new Set()

export function registerPWA() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[PWA] SW registration failed:', err)
    })
  })

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    listeners.forEach((cb) => cb(() => promptInstall()))
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((cb) => cb(null))
  })
}

export function onInstallable(cb) {
  listeners.add(cb)
  // Fire immediately if the prompt is already available (e.g., after re-render).
  if (deferredPrompt) cb(() => promptInstall())
  return () => listeners.delete(cb)
}

async function promptInstall() {
  if (!deferredPrompt) return null
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  return outcome
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
