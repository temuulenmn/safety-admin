import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormTextarea,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'
import api from 'src/services/api'
import dayjs from 'dayjs'

const TYPE_LABEL = {
  clothing_missing: 'Хувцас дутуу',
  tool_missing:     'Багаж дутуу',
  no_helmet:        'Каскагүй',
  no_vest:          'Хантаазгүй',
  no_boots:         'Гутал буруу',
  other:            'Бусад',
}
const STATUS_COLOR = { pending:'warning', confirmed:'info', paid:'success', waived:'secondary' }
const STATUS_LABEL = { pending:'Хүлээгдэж буй', confirmed:'Баталгаажсан', paid:'Төлсөн', waived:'Чөлөөлсөн' }
const fmtMNT = n => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function Violations() {
  const gridTheme = useGridTheme()
  const gridRef = useRef()
  const [stats,    setStats]    = useState(null)
  const [emps,     setEmps]     = useState([])
  const [statusF,  setStatusF]  = useState('')
  const [typeF,    setTypeF]    = useState('')
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ employee_id:'', violation_type:'clothing_missing', zone:'', description:'', missing_items:'', penalty_amount:20000 })
  const [saving,   setSaving]   = useState(false)
  const [detail,   setDetail]   = useState(null)
  const [setModalOpen, setSetModalOpen] = useState(false)

  useEffect(() => {
    api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data || []))
    refreshStats()
  }, [])
  const refreshStats = () => api.getViolationStats({ days: 30 }).then(r => setStats(r.data))

  const refresh = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit }) =>
      api.getViolations({ page, limit, status: statusF || undefined, violation_type: typeF || undefined }))
    gridRef.current?.api?.setGridOption('datasource', ds)
  }, [statusF, typeF])
  useEffect(() => { refresh() }, [refresh])

  const openCreate = () => {
    setForm({ employee_id:'', violation_type:'clothing_missing', zone:'', description:'', missing_items:'', penalty_amount:20000 })
    setModal(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      await api.createViolation({
        ...form,
        missing_items: form.missing_items.split(',').map(s=>s.trim()).filter(Boolean),
        penalty_amount: Number(form.penalty_amount),
      })
      setModal(false); refresh(); refreshStats()
    } finally { setSaving(false) }
  }
  const changeStatus = async (id, status) => {
    await api.updateViolation(id, { status })
    refresh(); refreshStats()
    if (detail?.id === id) setDetail(d => ({ ...d, status }))
  }

  const cols = [
    { field:'occurred_at', headerName:'Огноо', width:150,
      valueFormatter: p => p.value ? dayjs(p.value).format('MM-DD HH:mm') : '' },
    { field:'emp_code', headerName:'Код', width:100 },
    { field:'full_name', headerName:'Ажилтан', flex:1 },
    { field:'department', headerName:'Хэлтэс', width:140 },
    { field:'violation_type', headerName:'Төрөл', width:140,
      cellRenderer: p => TYPE_LABEL[p.value] || p.value },
    { field:'zone', headerName:'Бүс', width:110 },
    { field:'penalty_amount', headerName:'Торгууль', width:130,
      cellRenderer: p => <span className="fw-semibold">{fmtMNT(p.value)}</span> },
    { field:'status', headerName:'Төлөв', width:130,
      cellRenderer: p => <CBadge color={STATUS_COLOR[p.value]}>{STATUS_LABEL[p.value]}</CBadge> },
    { headerName:'', width:90, sortable:false,
      cellRenderer: p => <CButton size="sm" color="primary" variant="outline" onClick={()=>setDetail(p.data)}>Үзэх</CButton> },
  ]

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Зөрчил / Торгууль</h4>
        <div>
          <CButton color="secondary" variant="outline" className="me-2" onClick={()=>setSetModalOpen(true)}>⚙ Тохиргоо</CButton>
          <CButton color="danger" onClick={openCreate}>+ Зөрчил бүртгэх</CButton>
        </div>
      </div>

      {stats?.overall && (
        <CRow className="g-2 mb-3">
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Нийт зөрчил (30 хоног)</div>
            <div className="fw-bold fs-4">{stats.overall.total}</div>
          </CCardBody></CCard></CCol>
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Хүлээгдэж буй</div>
            <div className="fw-bold fs-4 text-warning">{stats.overall.pending}</div>
          </CCardBody></CCard></CCol>
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Цуглуулсан</div>
            <div className="fw-bold fs-5 text-success">{fmtMNT(stats.overall.collected)}</div>
          </CCardBody></CCard></CCol>
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Авлага үлдсэн</div>
            <div className="fw-bold fs-5 text-danger">{fmtMNT(stats.overall.outstanding)}</div>
          </CCardBody></CCard></CCol>
        </CRow>
      )}

      {stats?.top_violators?.length > 0 && (
        <CCard className="mb-3">
          <CCardHeader className="fw-semibold">Хамгийн их зөрчилтэй (30 хоног)</CCardHeader>
          <CCardBody className="p-0">
            <CTable small className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Код</CTableHeaderCell>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Зөрчил</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Дүн</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {stats.top_violators.slice(0,5).map(v => (
                  <CTableRow key={v.employee_id}>
                    <CTableDataCell>{v.emp_code}</CTableDataCell>
                    <CTableDataCell>{v.full_name}</CTableDataCell>
                    <CTableDataCell className="text-end">{v.count}</CTableDataCell>
                    <CTableDataCell className="text-end fw-semibold">{fmtMNT(v.total_amount)}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      <CCard>
        <CCardHeader>
          <CRow className="g-2">
            <CCol sm={3}>
              <CFormSelect value={statusF} onChange={e=>setStatusF(e.target.value)}>
                <option value="">Бүх төлөв</option>
                {Object.entries(STATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={3}>
              <CFormSelect value={typeF} onChange={e=>setTypeF(e.target.value)}>
                <option value="">Бүх төрөл</option>
                {Object.entries(TYPE_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody className="p-0">
          <div style={{ height: 540, width:'100%' }}>
            <AgGridReact ref={gridRef} theme={gridTheme} rowModelType="infinite"
              columnDefs={cols} defaultColDef={defaultColDef} cacheBlockSize={25}
              onGridReady={refresh} />
          </div>
        </CCardBody>
      </CCard>

      {/* Create modal */}
      <CModal visible={modal} onClose={()=>setModal(false)}>
        <CModalHeader><CModalTitle>Зөрчил бүртгэх</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}><CFormLabel>Ажилтан *</CFormLabel>
              <CFormSelect value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Зөрчлийн төрөл</CFormLabel>
              <CFormSelect value={form.violation_type} onChange={e=>setForm(f=>({...f,violation_type:e.target.value}))}>
                {Object.entries(TYPE_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Бүс</CFormLabel>
              <CFormInput value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Дутуу зүйлс (таслалаар)</CFormLabel>
              <CFormInput value={form.missing_items} onChange={e=>setForm(f=>({...f,missing_items:e.target.value}))}
                placeholder="helmet, vest, gloves" /></CCol>
            <CCol sm={12}><CFormLabel>Тайлбар</CFormLabel>
              <CFormTextarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Торгуулийн дүн (₮)</CFormLabel>
              <CFormInput type="number" value={form.penalty_amount} onChange={e=>setForm(f=>({...f,penalty_amount:e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setModal(false)}>Болих</CButton>
          <CButton color="danger" onClick={save} disabled={saving || !form.employee_id}>
            {saving ? <CSpinner size="sm" /> : 'Бүртгэх'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Detail modal */}
      <CModal visible={!!detail} onClose={()=>setDetail(null)}>
        <CModalHeader><CModalTitle>Зөрчлийн дэлгэрэнгүй</CModalTitle></CModalHeader>
        <CModalBody>
          {detail && (
            <div>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Ажилтан</CCol>
                <CCol sm={8} className="fw-semibold">{detail.emp_code} — {detail.full_name}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Огноо</CCol>
                <CCol sm={8}>{dayjs(detail.occurred_at).format('YYYY-MM-DD HH:mm')}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Төрөл</CCol>
                <CCol sm={8}>{TYPE_LABEL[detail.violation_type] || detail.violation_type}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Бүс</CCol>
                <CCol sm={8}>{detail.zone || '—'}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Дутуу</CCol>
                <CCol sm={8}>{(detail.missing_items||[]).join(', ') || '—'}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Тайлбар</CCol>
                <CCol sm={8}>{detail.description || '—'}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Торгууль</CCol>
                <CCol sm={8} className="fw-bold text-danger">{fmtMNT(detail.penalty_amount)}</CCol></CRow>
              <CRow className="mb-2"><CCol sm={4} className="text-medium-emphasis">Төлөв</CCol>
                <CCol sm={8}><CBadge color={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</CBadge></CCol></CRow>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          {detail?.status === 'pending' && (
            <>
              <CButton color="info" variant="outline" onClick={()=>changeStatus(detail.id, 'confirmed')}>Баталгаажуулах</CButton>
              <CButton color="secondary" variant="outline" onClick={()=>changeStatus(detail.id, 'waived')}>Чөлөөлөх</CButton>
            </>
          )}
          {(detail?.status === 'pending' || detail?.status === 'confirmed') && (
            <CButton color="success" onClick={()=>changeStatus(detail.id, 'paid')}>Төлөв: Төлсөн</CButton>
          )}
          <CButton color="secondary" onClick={()=>setDetail(null)}>Хаах</CButton>
        </CModalFooter>
      </CModal>

      {setModalOpen && <SettingsModal onClose={()=>setSetModalOpen(false)} />}
    </div>
  )
}

// ── Warning/penalty threshold settings (#2) ─────────────────────────
function SettingsModal({ onClose }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getViolationSettings().then(r => setForm(r.data))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateViolationSettings({
        violation_warning_limit: Number(form.violation_warning_limit),
        penalty_amount: Number(form.penalty_amount),
        warning_reset_days: Number(form.warning_reset_days),
      })
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} backdrop="static">
      <CModalHeader><CModalTitle>Сануулга / Торгуулийн тохиргоо</CModalTitle></CModalHeader>
      <CModalBody>
        {!form ? <div className="text-center py-3"><CSpinner /></div> : (
          <>
            <div className="alert alert-info py-2 small">
              ⓘ Ажилтныг <strong>{form.violation_warning_limit}</strong> удаа сануулаад,
              дараагийн ({Number(form.violation_warning_limit)+1} дэх) зөрчилд автоматаар
              <strong> {Number(form.penalty_amount).toLocaleString()}₮</strong> торгууль ноогдуулна.
            </div>
            <CForm><CRow className="g-3">
              <CCol sm={12}>
                <CFormLabel>Сануулгын тоо (X удаа)</CFormLabel>
                <CFormInput type="number" min="0" value={form.violation_warning_limit}
                  onChange={e=>setForm(f=>({...f,violation_warning_limit:e.target.value}))} />
                <div className="form-text small">Энэ тооноос хэтэрвэл торгууль эхэлнэ</div>
              </CCol>
              <CCol sm={12}>
                <CFormLabel>Торгуулийн дүн (₮)</CFormLabel>
                <CFormInput type="number" min="0" value={form.penalty_amount}
                  onChange={e=>setForm(f=>({...f,penalty_amount:e.target.value}))} />
              </CCol>
              <CCol sm={12}>
                <CFormLabel>Сануулга тэглэх хугацаа (хоног)</CFormLabel>
                <CFormInput type="number" min="1" value={form.warning_reset_days}
                  onChange={e=>setForm(f=>({...f,warning_reset_days:e.target.value}))} />
                <div className="form-text small">Энэ хоногийн дотор тоолно (rolling window)</div>
              </CCol>
            </CRow></CForm>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Болих</CButton>
        <CButton color="primary" onClick={save} disabled={saving || !form}>
          {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
