import { useEffect, useState } from 'react'
import { themeQuartz } from 'ag-grid-community'

// ── Light theme ────────────────────────────────────────────────────────
export const gridThemeLight = themeQuartz.withParams({
  accentColor:           '#0d6efd',
  browserColorScheme:    'light',
  fontFamily:            'inherit',
  fontSize:              13,
  rowHeight:             38,
  headerHeight:          40,
  headerBackgroundColor: '#f8f9fa',
  headerTextColor:       '#212529',
  oddRowBackgroundColor: '#ffffff',
  rowHoverColor:         '#f0f4ff',
  borderColor:           '#dee2e6',
  wrapperBorderRadius:   '0px',
})

// ── Dark theme ─────────────────────────────────────────────────────────
export const gridThemeDark = themeQuartz.withParams({
  accentColor:           '#3399ff',
  browserColorScheme:    'dark',
  fontFamily:            'inherit',
  fontSize:              13,
  rowHeight:             38,
  headerHeight:          40,
  backgroundColor:       '#212631',
  foregroundColor:       '#e6e8ec',
  headerBackgroundColor: '#2a2f3b',
  headerTextColor:       '#e6e8ec',
  oddRowBackgroundColor: '#212631',
  rowHoverColor:         '#2f3645',
  borderColor:           '#3a4150',
  wrapperBorderRadius:   '0px',
})

// Back-compat default
export const gridTheme = gridThemeLight

// ── Hook: returns the right theme based on CoreUI color mode ─────────
// CoreUI sets `data-coreui-theme="dark"` on <html> when dark mode is active.
export function useGridTheme() {
  const get = () => {
    if (typeof document === 'undefined') return gridThemeLight
    const t = document.documentElement.getAttribute('data-coreui-theme')
    if (t === 'dark')  return gridThemeDark
    if (t === 'light') return gridThemeLight
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? gridThemeDark : gridThemeLight
  }

  const [theme, setTheme] = useState(get)

  useEffect(() => {
    const update = () => setTheme(get())
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-coreui-theme'],
    })
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', update)
    return () => { obs.disconnect(); mq?.removeEventListener?.('change', update) }
  }, [])

  return theme
}

// ── Default col def ───────────────────────────────────────────────────
export const defaultColDef = {
  resizable: true,
  sortable:  true,
  filter:    false,
  minWidth:  60,
}

// ── Build an InfiniteRowModel datasource ──────────────────────────────
export function makeServerDatasource(fetcher) {
  return {
    getRows: async (params) => {
      const { startRow, endRow, sortModel } = params
      const limit = endRow - startRow
      const page  = Math.floor(startRow / limit) + 1
      const sort  = sortModel[0]
        ? { sort_by: sortModel[0].colId, sort_dir: sortModel[0].sort }
        : {}
      try {
        const r = await fetcher({ page, limit, ...sort })
        const total = r.pagination?.total ?? r.data?.length ?? 0
        params.successCallback(r.data || [], Number(total))
      } catch (e) {
        params.failCallback()
      }
    },
  }
}
