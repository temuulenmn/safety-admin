import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CForm, CFormTextarea,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell,
} from '@coreui/react'
import api from 'src/services/api'
import { downloadCSV } from 'src/utils/exporters'

const money = (n) => Number(n || 0).toLocaleString() + '₮'
const scoreColor = (s) => s == null ? 'secondary' : s >= 90 ? 'success' : s >= 70 ? 'info' : s >= 50 ? 'warning' : 'danger'
const STATUS = { planned:'info', active:'success', suspended:'warning', completed:'secondary' }
const STATUS_LABEL = { planned:'Төлөвлөсөн', active:'Идэвхтэй', suspended:'Түр зогссон', completed:'Дууссан' }
const EMPTY = { code:'', name:'', location:'', client_name:'', manager_id:'', status:'active',
  start_date:'', end_date:'', budget_amount:'', area_m2:'', description:'' }

export default function Projects() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState(null)
  const [board, setBoard] = useState([])
  const [emps, setEmps] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusF, setStatusF] = useState('')
  const [search, setSearch] = useState('')

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.getProjects({ status: statusF || undefined, search: search || undefined })
      .then(r => setRows(r.data || [])).finally(() => setLoading(false))
    api.getProjectStats().then(r => setStats(r.data))
    api.getProjectLeaderboard().then(r => setBoard(r.data?.projects || []))
  }, [statusF, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data || [])) }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (e, p) => {
    e.stopPropagation()
    setEditing(p.id)
    setForm({
      code:p.code||'', name:p.name, location:p.location||'', client_name:p.client_name||'',
      manager_id:p.manager_id||'', status:p.status,
      start_date:p.start_date?p.start_date.slice(0,10):'', end_date:p.end_date?p.end_date.slice(0,10):'',
      budget_amount:p.budget_amount||'', area_m2:p.area_m2||'', description:p.description||'',
    })
    setModal(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        manager_id: form.manager_id || null,
        budget_amount: form.budget_amount ? Number(form.budget_amount) : null,
        area_m2: form.area_m2 ? Number(form.area_m2) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      editing ? await api.updateProject(editing, payload) : await api.createProject(payload)
      setModal(false); load()
    } finally { setSaving(false) }
  }
  const remove = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Төслийг устгах уу? (холбоотой бичлэгүүд төслөөс салгагдана)')) return
    await api.deleteProject(id); load()
  }

  const exportExcel = () => {
    downloadCSV('tosluud',
      ['Код','Нэр','Байршил','Менежер','Төлөв','Гэрээ тоо','Гэрээ дүн','Нээлттэй ажил','Төсөв'],
      rows.map(p => [p.code||'', p.name, p.location||'', p.manager_name||'',
        STATUS_LABEL[p.status]||p.status, p.contract_count, p.contract_value, p.open_tasks, p.budget_amount||0]))
  }

  const SUMMARY = stats ? [
    ['Идэвхтэй төсөл', stats.active ?? 0, 'success'],
    ['Өнөөдөр ирсэн', stats.present_today ?? 0, 'info'],
    ['Зөрчил (30 хоног)', stats.violations_30d ?? 0, 'warning'],
    ['Гэрээний дүн', money(stats.contract_value), 'primary'],
    ['Идэвхтэй төсөв', money(stats.active_budget), 'secondary'],
  ] : []

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Төсөл / Объект</h4>
        <div>
          <CButton color="secondary" variant="outline" className="me-2" onClick={exportExcel}>⬇ Excel</CButton>
          <CButton color="primary" onClick={openCreate}>+ Төсөл нэмэх</CButton>
        </div>
      </div>

      {/* Neon-style overall summary band */}
      {stats && (
        <CCard className="mb-3">
          <CCardBody>
            <CRow className="g-3">
              {SUMMARY.map(([l,v,c]) => (
                <CCol key={l} xs={6} md className="text-center text-md-start">
                  <div className="small text-medium-emphasis">{l}</div>
                  <div className={`fw-bold fs-4 text-${c}`}>{v}</div>
                </CCol>
              ))}
            </CRow>
            <div className="small text-medium-emphasis mt-2">
              Бүх төслийн нэгдсэн үзүүлэлт. Төсөл дээр дарж дэлгэрэнгүй рүү орно.
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Safety-score leaderboard */}
      {board.length > 0 && (
        <CCard className="mb-3">
          <CCardHeader className="fw-semibold">Төслүүдийн аюулгүйн оноо</CCardHeader>
          <CCardBody className="p-0">
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{width:50}}>#</CTableHeaderCell>
                  <CTableHeaderCell>Төсөл</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Оноо</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">ХХХ нийцэл</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Зөрчил</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Ажилтан</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {board.map((p, idx) => (
                  <CTableRow key={p.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/projects/${p.id}`)}>
                    <CTableDataCell>{idx + 1}</CTableDataCell>
                    <CTableDataCell className="fw-semibold">{p.name}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CBadge color={scoreColor(p.safety_score)}>{p.safety_score ?? '—'}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{p.ppe_compliance == null ? '—' : p.ppe_compliance + '%'}</CTableDataCell>
                    <CTableDataCell className="text-end">{p.violations}</CTableDataCell>
                    <CTableDataCell className="text-end">{p.workers}</CTableDataCell>
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
            <CCol sm={4}><CFormInput placeholder="Хайх..." value={search}
              onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} /></CCol>
            <CCol sm={3}>
              <CFormSelect value={statusF} onChange={e=>setStatusF(e.target.value)}>
                <option value="">Бүх төлөв</option>
                {Object.entries(STATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody>
          {loading ? <div className="text-center py-4"><CSpinner /></div> : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Код</CTableHeaderCell>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell>Байршил</CTableHeaderCell>
                  <CTableHeaderCell>Менежер</CTableHeaderCell>
                  <CTableHeaderCell>Төлөв</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Гэрээ</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Нээлттэй ажил</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Үйлдэл</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.length === 0 && (
                  <CTableRow><CTableDataCell colSpan={8} className="text-center text-medium-emphasis">
                    Төсөл алга. "Төсөл нэмэх"-ээр эхлүүлнэ үү.
                  </CTableDataCell></CTableRow>
                )}
                {rows.map(p => (
                  <CTableRow key={p.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/projects/${p.id}`)}>
                    <CTableDataCell>{p.code || '—'}</CTableDataCell>
                    <CTableDataCell className="fw-semibold">{p.name}</CTableDataCell>
                    <CTableDataCell>{p.location || '—'}</CTableDataCell>
                    <CTableDataCell>{p.manager_name || '—'}</CTableDataCell>
                    <CTableDataCell><CBadge color={STATUS[p.status]||'secondary'}>{STATUS_LABEL[p.status]||p.status}</CBadge></CTableDataCell>
                    <CTableDataCell className="text-end">{p.contract_count} · {money(p.contract_value)}</CTableDataCell>
                    <CTableDataCell className="text-end">{p.open_tasks}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={(e)=>openEdit(e,p)}>Засах</CButton>
                      <CButton size="sm" color="danger" variant="outline" onClick={(e)=>remove(e,p.id)}>Устгах</CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Create/edit modal */}
      <CModal visible={modal} onClose={()=>setModal(false)} size="lg">
        <CModalHeader><CModalTitle>{editing ? 'Төсөл засах' : 'Төсөл нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={4}><CFormLabel>Код</CFormLabel>
              <CFormInput value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} /></CCol>
            <CCol sm={8}><CFormLabel>Төслийн нэр *</CFormLabel>
              <CFormInput value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Байршил</CFormLabel>
              <CFormInput value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Захиалагч</CFormLabel>
              <CFormInput value={form.client_name} onChange={e=>setForm(f=>({...f,client_name:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Менежер</CFormLabel>
              <CFormSelect value={form.manager_id} onChange={e=>setForm(f=>({...f,manager_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Төлөв</CFormLabel>
              <CFormSelect value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {Object.entries(STATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={3}><CFormLabel>Эхлэх</CFormLabel>
              <CFormInput type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></CCol>
            <CCol sm={3}><CFormLabel>Дуусах</CFormLabel>
              <CFormInput type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></CCol>
            <CCol sm={3}><CFormLabel>Төсөв (₮)</CFormLabel>
              <CFormInput type="number" min="0" value={form.budget_amount} onChange={e=>setForm(f=>({...f,budget_amount:e.target.value}))} /></CCol>
            <CCol sm={3}><CFormLabel>Талбай (м²)</CFormLabel>
              <CFormInput type="number" min="0" value={form.area_m2} onChange={e=>setForm(f=>({...f,area_m2:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Тайлбар</CFormLabel>
              <CFormTextarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving || !form.name}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
