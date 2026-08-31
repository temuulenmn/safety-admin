import { useEffect, useRef } from 'react'

// Subscribe to the backend Server-Sent Events stream.
//
// EventSource can't send Authorization headers, so the connection has to carry
// its credential in the URL. Passing the long-lived JWT there leaked it into
// access logs, proxy logs and browser history — so instead we exchange the JWT
// (sent properly in a header) for a 60-second single-use ticket and put only
// that in the URL.
//
// Usage:
//   useEventStream((ev) => {
//     if (ev.type === 'gate_scan') refresh()
//     if (ev.type === 'violation') showToast()
//   })
//
// The connection is opened on mount and closed on unmount. If the browser's
// automatic reconnect fires after the ticket is spent the server closes it,
// so we fetch a fresh ticket and reopen ourselves.
export function useEventStream(onEvent) {
  // Store the latest handler in a ref so the stream isn't torn down on every
  // re-render just because the parent passed a new closure.
  const cbRef = useRef(onEvent)
  useEffect(() => { cbRef.current = onEvent }, [onEvent])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3500').replace(/\/+$/, '')
    let es = null
    let retry = null
    let closed = false
    let backoff = 1000

    const handle = (ev) => {
      try {
        cbRef.current?.(JSON.parse(ev.data))
      } catch (e) {
        console.warn('[SSE] parse error', e, ev.data)
      }
    }

    const connect = async () => {
      if (closed) return
      let ticket
      try {
        const res = await fetch(`${base}/api/events/ticket`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`ticket ${res.status}`)
        ticket = (await res.json()).data.ticket
      } catch (e) {
        // Сервер унтарсан эсвэл токен хүчингүй — тодорхой хугацааны дараа дахин.
        if (!closed) retry = setTimeout(connect, backoff = Math.min(backoff * 2, 30000))
        return
      }
      if (closed) return

      es = new EventSource(`${base}/api/events/stream?ticket=${encodeURIComponent(ticket)}`)
      ;['message', 'gate_scan', 'violation', 'hello'].forEach((t) =>
        es.addEventListener(t, handle))

      es.onopen = () => { backoff = 1000 }
      es.onerror = () => {
        // Тасалбар нэг удаагийн тул хөтчийн автомат reconnect ажиллахгүй —
        // холболтоо хааж, шинэ тасалбартай дахин нээнэ.
        es.close()
        if (!closed) retry = setTimeout(connect, backoff = Math.min(backoff * 2, 30000))
      }
    }

    connect()

    return () => {
      closed = true
      clearTimeout(retry)
      es?.close()
    }
  }, [])
}
