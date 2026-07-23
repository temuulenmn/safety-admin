import { useEffect, useRef } from 'react'

// Subscribe to the backend Server-Sent Events stream.
// EventSource can't send Authorization headers, so we pass the JWT as ?token=.
//
// Usage:
//   useEventStream((ev) => {
//     if (ev.type === 'gate_scan') refresh()
//     if (ev.type === 'violation') showToast()
//   })
//
// The connection is opened on mount, kept alive by the server heartbeat,
// and closed on unmount. Browsers auto-reconnect on transient network drops.
export function useEventStream(onEvent) {
  // Store the latest handler in a ref so the EventSource isn't torn down on
  // every re-render just because the parent passed a new closure.
  const cbRef = useRef(onEvent)
  useEffect(() => { cbRef.current = onEvent }, [onEvent])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3500').replace(/\/+$/, '')
    const url = `${base}/api/events/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)

    const handle = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        cbRef.current?.(data)
      } catch (e) {
        console.warn('[SSE] parse error', e, ev.data)
      }
    }

    // Backend uses `event: <type>` per message → listen to known types +
    // fall back to generic `message`.
    ;['message', 'gate_scan', 'violation', 'hello'].forEach((t) =>
      es.addEventListener(t, handle))

    es.onerror = () => { /* browser reconnects automatically */ }

    return () => es.close()
  }, [])
}
