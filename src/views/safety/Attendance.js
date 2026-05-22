import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CNav, CNavItem, CNavLink,
  CTabContent, CTabPane, CFormInput, CFormSelect, CRow, CCol, CSpinner,
  CBadge, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormLabel,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import { useSelector } from 'react-redux'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'
import api from 'src/services/api'
import dayjs from 'dayjs'

export default function Attendance() {
  const logsGridRef = useRef()
  const gridTheme = useGridTheme()
  const [tab,      setTab]     = useState('today')
  const [today,    setToday]   = useState([])
  const [summary,  setSummary] = useState([])
  const [loading,  setLoading] = useState(false)
  const [emps,     setEmps]    = useState([])
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [dateFrom, setDateFrom]= useState(dayjs().format('YYYY-MM-DD'))
  const [dateTo,   setDateTo]  = useState(dayjs().format('YYYY-MM-DD'))
  const [sumYear,  setSumYear] = useState(dayjs().year())
  const [sumMonth, setSumMonth]= useState(dayjs().month() + 1)
  const [ciModal,  setCiModal] = useState(false)
  const [ciEmp,    setCiEmp]   = useState('')
  const [ciSaving, setCiSaving]= useState(false)

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    loadToday()
  }, [])

  const loadToday = () => {
    setLoading(true)
    api.getTodayAttendance().then(r => setToday(r.data || [])).finally(() => setLoading(false))
  }

  // ── Logs: server-side AG Grid ────────────────────────────────────────
  const refreshLogs = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit, sort_by, sort_dir }) =>
      api.getAttendance({ page, limit, date_from: dateFrom, date_to: dateTo, project_id: currentProjectId || undefined, sort_by, sort_dir })
    )
    logsGridRef.current?.api?.setGridOption('datasource', ds)
  }, [dateFrom, dateTo, currentProjectId])

  useEffect(() => { if (tab === 'logs') refreshLogs() }, [tab, refreshLogs])

  // ── Summary: plain fetch ─────────────────────────────────────────────
  const loadSummary = useCallback(() => {
    setLoading(true)
    api.getAttendanceSummary({ year: sumYear, month: sumMonth })
      .then(r => setSummary(r.data || [])).finally(() => setLoading(false))
  }, [sumYear, sumMonth])

  useEffect(() => { if (tab === 'summary') loadSummary() }, [tab, loadSummary])

  const checkIn = async () => {
    if (!ciEmp) return
    setCiSaving(true)
    try { await api.checkIn({ employee_id: ciEmp, source: 'manual' }); setCiModal(false); loadToday() }
    finally { setCiSaving(false) }
  }

  const fmt = (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'

  const logCols = [
    { field: 'emp_code',    headerName: 'Код',        width: 90 },
    { field: 'full_name',   headerName: 'Нэр',        flex: 1 },
    { field: 'department',  headerName: 'Хэлтэс',     width: 130 },
    { field: 'check_in',    headerName: 'Ирсэн',      width: 150, valueFormatter: p => fmt(p.value) },
    { field: 'check_out',   headerName: 'Гарсан',     width: 150, valueFormatter: p => p.value ? fmt(p.value) : '—' },
    { field: 'work_hours',  headerName: 'Цаг',        width: 80 },
    { field: 'project_name', headerName: 'Төсөл',     width: 150, valueFormatter: p => p.value || '—' },
    { field: 'source',      headerName: 'Эх сурвалж', width: 110 },
  ]

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">Ирц</h4>
      <CNav variant="tabs" className="mb-3">
        {[['today','Өнөөдөр'],['logs','Лог'],['summary','Тайлан']].map(([k,l]) => (
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={() => setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        {/* ── Today (plain table) ─────────────────────────────────── */}
        <CTabPane visible={tab==='today'}>
          <div className="d-flex justify-content-between mb-3">
            <span className="text-medium-emphasis">Өнөөдөр ирсэн: <strong>{today.length}</strong></span>
            <div>
              <CButton size="sm" color="success" className="me-2" onClick={() => setCiModal(true)}>Ирц тэмдэглэх</CButton>
              <CButton size="sm" color="secondary" variant="outline" onClick={loadToday}>Шинэчлэх</CButton>
            </div>
          </div>
          {loading ? <CSpinner /> : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Код</CTableHeaderCell>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
                  <CTableHeaderCell>Ирсэн</CTableHeaderCell>
                  <CTableHeaderCell>Гарсан</CTableHeaderCell>
                  <CTableHeaderCell>Цаг</CTableHeaderCell>
                  <CTableHeaderCell>Эх</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {today.map((r, i) => (
                  <CTableRow key={i}>
                    <CTableDataCell>{r.emp_code}</CTableDataCell>
                    <CTableDataCell>{r.full_name}</CTableDataCell>
                    <CTableDataCell>{r.department}</CTableDataCell>
                    <CTableDataCell>{fmt(r.check_in)}</CTableDataCell>
                    <CTableDataCell>{r.check_out ? fmt(r.check_out) : <CBadge color="warning">Гараагүй</CBadge>}</CTableDataCell>
                    <CTableDataCell>{r.work_hours ?? '—'}</CTableDataCell>
                    <CTableDataCell><CBadge color="info">{r.source}</CBadge></CTableDataCell>
                  </CTableRow>
                ))}
                {today.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center text-medium-emphasis py-3">Өгөгдөл байхгүй</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CTabPane>

        {/* ── Logs (server-side AG Grid) ──────────────────────────── */}
        <CTabPane visible={tab==='logs'}>
          <CCard className="mb-3">
            <CCardHeader>
              <CRow className="g-2 align-items-end">
                <CCol sm={3}><CFormLabel className="mb-1">Эхний огноо</CFormLabel>
                  <CFormInput type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></CCol>
                <CCol sm={3}><CFormLabel className="mb-1">Эцсийн огноо</CFormLabel>
                  <CFormInput type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></CCol>
                <CCol sm={2}><CButton color="primary" onClick={refreshLogs}>Хайх</CButton></CCol>
              </CRow>
            </CCardHeader>
            <CCardBody className="p-0">
              <div style={{ height: 560, width: '100%' }}>
                <AgGridReact
                  ref={logsGridRef}
                  theme={gridTheme}
                  rowModelType="infinite"
                  columnDefs={logCols}
                  defaultColDef={defaultColDef}
                  cacheBlockSize={25}
                  onGridReady={refreshLogs}
                />
              </div>
            </CCardBody>
          </CCard>
        </CTabPane>

        {/* ── Summary (plain table) ───────────────────────────────── */}
        <CTabPane visible={tab==='summary'}>
          <CRow className="g-2 mb-3">
            <CCol sm={2}>
              <CFormInput type="number" value={sumYear} onChange={e=>setSumYear(e.target.value)} placeholder="Жил" />
            </CCol>
            <CCol sm={2}>
              <CFormSelect value={sumMonth} onChange={e=>setSumMonth(e.target.value)}>
                {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}-р сар</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={2}><CButton color="primary" onClick={loadSummary}>Харах</CButton></CCol>
          </CRow>
          {loading ? <CSpinner /> : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Код</CTableHeaderCell>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell>Ажилласан өдөр</CTableHeaderCell>
                  <CTableHeaderCell>Нийт цаг</CTableHeaderCell>
                  <CTableHeaderCell>Дундаж цаг</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {summary.map((r,i) => (
                  <CTableRow key={i}>
                    <CTableDataCell>{r.emp_code}</CTableDataCell>
                    <CTableDataCell>{r.full_name}</CTableDataCell>
                    <CTableDataCell>{r.total_days}</CTableDataCell>
                    <CTableDataCell>{Number(r.total_hours||0).toFixed(1)}</CTableDataCell>
                    <CTableDataCell>{Number(r.avg_hours||0).toFixed(1)}</CTableDataCell>
                  </CTableRow>
                ))}
                {summary.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={5} className="text-center text-medium-emphasis py-3">Өгөгдөл байхгүй</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CTabPane>
      </CTabContent>

      {/* Check-in modal */}
      <CModal visible={ciModal} onClose={() => setCiModal(false)}>
        <CModalHeader><CModalTitle>Ирц тэмдэглэх</CModalTitle></CModalHeader>
        <CModalBody>
          <CFormLabel>Ажилтан <span className="text-danger">*</span></CFormLabel>
          <CFormSelect value={ciEmp} onChange={e => setCiEmp(e.target.value)}>
            <option value="">-- Сонгох --</option>
            {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
          </CFormSelect>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCiModal(false)}>Болих</CButton>
          <CButton color="success" onClick={checkIn} disabled={ciSaving || !ciEmp}>
            {ciSaving ? <CSpinner size="sm" /> : 'Тэмдэглэх'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
