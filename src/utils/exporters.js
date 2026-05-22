// Dependency-free report exporters.
//  - downloadCSV: Excel-compatible (UTF-8 BOM so Cyrillic renders correctly)
//  - printReport: opens a clean printable window → "Save as PDF"

export function downloadCSV(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// bodyHTML: report markup. Auto-opens the print dialog (user picks "Save as PDF").
export function printReport(title, bodyHTML) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111;margin:0}
      h1{font-size:20px;margin:0 0 4px} h2{font-size:14px;margin:20px 0 6px;color:#333}
      .muted{color:#666;font-size:11px;margin-bottom:12px}
      .cards{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}
      .card{border:1px solid #ddd;border-radius:8px;padding:8px 14px;min-width:110px}
      .card .l{font-size:10px;color:#666} .card .v{font-size:18px;font-weight:700}
      table{border-collapse:collapse;width:100%;margin-top:6px}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}
      th{background:#f5f5f5} .r{text-align:right}
      @media print{ button{display:none} }
    </style></head><body>${bodyHTML}
    <script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
    </body></html>`)
  w.document.close()
}
