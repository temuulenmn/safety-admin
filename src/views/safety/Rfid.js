import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CNav, CNavItem, CNavLink,
  CTabContent, CTabPane, CRow, CCol, CFormInput, CFormSelect, CFormLabel,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'
import api from 'src/services/api'
import dayjs from 'dayjs'

export default function Rfid() {
  const scansGridRef = useRef()
  const gridTheme = useGridTheme()
  const [tab,     setTab]     = useState('readers')
  const [readers, setReaders] = useState([])
  const [cards,   setCards]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [emps,    setEmps]    = useState([])
  const [modal,   setModal]   = useState(null) // 'reader'|'card'
  const [form,    setForm]    = useState({})
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [dateFrom,setDateFrom]= useState(dayjs().subtract(7,'day').format('YYYY-MM-DD'))
  const [dateTo,  setDateTo]  = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data||[]))
    loadReaders()
    loadCards()
  }, [])

  // ── Readers & Cards: plain tables (small data sets) ──────────────────
  const loadReaders = () => api.getRfidReaders().then(r => setReaders(r.data||[]))
  const loadCards   = () => api.getRfidCards().then(r => setCards(r.data||[]))

  // ── Scans: server-side AG Grid ────────────────────────────────────────
  const refreshScans = useCallback(() => {
    // Load stats in parallel
    api.getRfidScanStats({ date_from: dateFrom, date_to: dateTo })
      .then(r => setStats(r.data))

    const ds = makeServerDatasource(({ page, limit, sort_by, sort_dir }) =>
      api.getRfidScans({ page, limit, date_from: dateFrom, date_to: dateTo, sort_by, sort_dir })
    )
    scansGridRef.current?.api?.setGridOption('datasource', ds)
  }, [dateFrom, dateTo])

  useEffect(() => { if (tab === 'scans') refreshScans() }, [tab, refreshScans])

  // ── Modals ────────────────────────────────────────────────────────────
  const openReader = (r) => {
    setEditing(r?.id||null)
    setForm(r
      ? { reader_code: r.reader_code, location_name: r.location_name||'', zone: r.zone||'', ip_address: r.ip_address||'' }
      : { reader_code: '', location_name: '', zone: '', ip_address: '' })
    setModal('reader')
  }
  const openCard = () => {
    setEditing(null)
    setForm({ employee_id: '', card_uid: '', card_type: 'UHF', expiry_date: '' })
    setModal('card')
  }
  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'reader') {
        editing ? await api.updateRfidReader(editing, form) : await api.createRfidReader(form)
        loadReaders()
      } else {
        await api.createRfidCard(form)
        loadCards()
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  const scanCols = [
    { field: 'scanned_at',     headerName: 'Цаг',       width: 150, valueFormatter: p => dayjs(p.value).format('MM-DD HH:mm:ss') },
    { field: 'full_name',      headerName: 'Нэр',       flex: 1 },
    { field: 'card_uid',       headerName: 'Карт UID',  width: 130 },
    { field: 'location_name',  headerName: 'Байршил',   width: 130 },
    { field: 'zone',           headerName: 'Бүс',       width: 100 },
    { field: 'direction',      headerName: 'Чиглэл',    width: 90,
      cellRenderer: p => <CBadge color={p.value==='entry'?'success':'warning'}>{p.value==='entry'?'Орж':'Гарч'}</CBadge> },
    { field: 'access_result',  headerName: 'Үр дүн',    width: 130,
      cellRenderer: p => <CBadge color={p.value==='granted'?'success':'danger'}>{p.value}</CBadge> },
    { field: 'deny_reason',    headerName: 'Шалтгаан',  flex: 1 },
  ]

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">RFID</h4>
      <CNav variant="tabs" className="mb-3">
        {[['readers','Уншигчид'],['cards','Картууд'],['scans','Скан лог']].map(([k,l])=>(
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        {/* ── Readers ──────────────────────────────────────────────── */}
        <CTabPane visible={tab==='readers'}>
          <div className="d-flex justify-content-end mb-2">
            <CButton color="primary" onClick={() => openReader(null)}>+ Уншигч нэмэх</CButton>
          </div>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Код</CTableHeaderCell>
                <CTableHeaderCell>Байршил</CTableHeaderCell>
                <CTableHeaderCell>Бүс</CTableHeaderCell>
                <CTableHeaderCell>IP</CTableHeaderCell>
                <CTableHeaderCell>Төлөв</CTableHeaderCell>
                <CTableHeaderCell>Сүүлийн холболт</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {readers.map(r=>(
                <CTableRow key={r.id}>
                  <CTableDataCell className="fw-semibold">{r.reader_code}</CTableDataCell>
                  <CTableDataCell>{r.location_name||'—'}</CTableDataCell>
                  <CTableDataCell>{r.zone||'—'}</CTableDataCell>
                  <CTableDataCell>{r.ip_address||'—'}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={r.is_active?'success':'secondary'}>{r.is_active?'Идэвхтэй':'Идэвхгүй'}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{r.last_heartbeat ? dayjs(r.last_heartbeat).format('MM-DD HH:mm') : '—'}</CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" color="primary" variant="outline" onClick={()=>openReader(r)}>Засах</CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {readers.length === 0 && (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center text-medium-emphasis py-3">Өгөгдөл байхгүй</CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CTabPane>

        {/* ── Cards ────────────────────────────────────────────────── */}
        <CTabPane visible={tab==='cards'}>
          <div className="d-flex justify-content-end mb-2">
            <CButton color="primary" onClick={openCard}>+ Карт нэмэх</CButton>
          </div>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Карт UID</CTableHeaderCell>
                <CTableHeaderCell>Ажилтны код</CTableHeaderCell>
                <CTableHeaderCell>Нэр</CTableHeaderCell>
                <CTableHeaderCell>Төрөл</CTableHeaderCell>
                <CTableHeaderCell>Дуусах огноо</CTableHeaderCell>
                <CTableHeaderCell>Төлөв</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {cards.map(c=>(
                <CTableRow key={c.id}>
                  <CTableDataCell><code>{c.card_uid}</code></CTableDataCell>
                  <CTableDataCell>{c.emp_code}</CTableDataCell>
                  <CTableDataCell>{c.full_name}</CTableDataCell>
                  <CTableDataCell>{c.card_type}</CTableDataCell>
                  <CTableDataCell>{c.expiry_date?.slice(0,10)||'—'}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={c.is_active?'success':'secondary'}>{c.is_active?'Идэвхтэй':'Блоклогдсон'}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" color={c.is_active?'warning':'success'} variant="outline"
                      onClick={()=>api.toggleRfidCard(c.id).then(loadCards)}>
                      {c.is_active?'Блоклох':'Нээх'}
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {cards.length === 0 && (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center text-medium-emphasis py-3">Өгөгдөл байхгүй</CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CTabPane>

        {/* ── Scans (server-side AG Grid) ──────────────────────────── */}
        <CTabPane visible={tab==='scans'}>
          <CRow className="g-2 mb-3 align-items-end">
            <CCol sm={3}><CFormLabel className="mb-1">Эхний огноо</CFormLabel>
              <CFormInput type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></CCol>
            <CCol sm={3}><CFormLabel className="mb-1">Эцсийн огноо</CFormLabel>
              <CFormInput type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></CCol>
            <CCol sm={2}><CButton color="primary" onClick={refreshScans}>Хайх</CButton></CCol>
          </CRow>

          {stats && (
            <CRow className="g-2 mb-3">
              {[
                ['Нийт скан',  stats.today_scans ?? 0],
                ['Зөвшөөрсөн', stats.granted     ?? 0],
                ['Татгалзсан', stats.denied       ?? 0],
                ['Нэвтэрсэн',  stats.entries      ?? 0],
                ['Гарсан',     stats.exits        ?? 0],
              ].map(([l,v])=>(
                <CCol key={l} xs={6} sm={2}>
                  <CCard>
                    <CCardBody className="py-2 text-center">
                      <div className="small text-medium-emphasis">{l}</div>
                      <div className="fw-bold fs-5">{v}</div>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          )}

          <div style={{ height: 560, width: '100%' }}>
            <AgGridReact
              ref={scansGridRef}
              theme={gridTheme}
              rowModelType="infinite"
              columnDefs={scanCols}
              defaultColDef={defaultColDef}
              cacheBlockSize={50}
              onGridReady={refreshScans}
            />
          </div>
        </CTabPane>
      </CTabContent>

      {/* ── Reader modal ─────────────────────────────────────────────── */}
      <CModal visible={modal==='reader'} onClose={()=>setModal(null)}>
        <CModalHeader><CModalTitle>{editing?'Уншигч засах':'Уншигч нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody><CForm><CRow className="g-3">
          <CCol sm={12}><CFormLabel>Reader Code <span className="text-danger">*</span></CFormLabel>
            <CFormInput value={form.reader_code||''} onChange={e=>setForm(f=>({...f,reader_code:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Байршил</CFormLabel>
            <CFormInput value={form.location_name||''} onChange={e=>setForm(f=>({...f,location_name:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Бүс</CFormLabel>
            <CFormInput value={form.zone||''} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>IP хаяг</CFormLabel>
            <CFormInput value={form.ip_address||''} onChange={e=>setForm(f=>({...f,ip_address:e.target.value}))} /></CCol>
        </CRow></CForm></CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setModal(null)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>{saving?<CSpinner size="sm"/>:'Хадгалах'}</CButton>
        </CModalFooter>
      </CModal>

      {/* ── Card modal ───────────────────────────────────────────────── */}
      <CModal visible={modal==='card'} onClose={()=>setModal(null)}>
        <CModalHeader><CModalTitle>Карт нэмэх</CModalTitle></CModalHeader>
        <CModalBody><CForm><CRow className="g-3">
          <CCol sm={12}><CFormLabel>Ажилтан <span className="text-danger">*</span></CFormLabel>
            <CFormSelect value={form.employee_id||''} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
              <option value="">-- Сонгох --</option>
              {emps.map(e=><option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
            </CFormSelect>
          </CCol>
          <CCol sm={12}><CFormLabel>Карт UID <span className="text-danger">*</span></CFormLabel>
            <CFormInput value={form.card_uid||''} onChange={e=>setForm(f=>({...f,card_uid:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Дуусах огноо</CFormLabel>
            <CFormInput type="date" value={form.expiry_date||''} onChange={e=>setForm(f=>({...f,expiry_date:e.target.value}))} /></CCol>
        </CRow></CForm></CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setModal(null)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>{saving?<CSpinner size="sm"/>:'Хадгалах'}</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
