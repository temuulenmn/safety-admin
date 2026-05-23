import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormTextarea,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane,
} from '@coreui/react'
import { useSelector } from 'react-redux'
import api from 'src/services/api'
import dayjs from 'dayjs'

const HAZARD_COLOR = { low:'success', medium:'warning', high:'danger', critical:'dark' }
const HAZARD_LABEL = { low:'Бага', medium:'Дунд', high:'Өндөр', critical:'Аюултай' }
const PPE_OPTS = ['helmet','vest','gloves','boots','glasses','harness','mask','earmuff']
const PPE_LABEL = { helmet:'Каска', vest:'Хантааз', gloves:'Бээлий', boots:'Гутал', glasses:'Нүдний шил', harness:'Уяа', mask:'Маск', earmuff:'Чихэвч' }

export default function DangerZones() {
  const [tab, setTab] = useState('live')
  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">Аюултай бүсийн хяналт</h4>
      <CNav variant="tabs" className="mb-3">
        {[['live','Шууд хяналт'],['manage','Бүс тохируулах']].map(([k,l]) => (
          <CNavItem key={k}><CNavLink active={tab===k} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink></CNavItem>
        ))}
      </CNav>
      <CTabContent>
        <CTabPane visible={tab==='live'}><LiveTab /></CTabPane>
        <CTabPane visible={tab==='manage'}><ManageTab /></CTabPane>
      </CTabContent>
    </div>
  )
}

// ── Live monitoring ─────────────────────────────────────────────────
function LiveTab() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    api.getDangerZonesLive({ project_id: currentProjectId || undefined }).then(r => setZones(r.data || [])).finally(()=>setLoading(false))
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 30000)  // auto-refresh every 30s
    return () => clearInterval(t)
  }, [currentProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="text-center py-4"><CSpinner /></div>

  return (
    <>
      <div className="d-flex justify-content-end mb-2">
        <CButton size="sm" color="secondary" variant="outline" onClick={load}>↻ Шинэчлэх</CButton>
      </div>
      <CRow className="g-3">
        {zones.map(z => {
          const over = z.max_occupancy && z.current_count > z.max_occupancy
          return (
            <CCol key={z.id} md={6} lg={4}>
              <CCard className={`h-100 border-${HAZARD_COLOR[z.hazard_level]}`}>
                <CCardHeader className={`d-flex justify-content-between align-items-center bg-${HAZARD_COLOR[z.hazard_level]} ${z.hazard_level==='critical'||z.hazard_level==='high'?'text-white':''}`}>
                  <span className="fw-semibold">{z.name}</span>
                  <CBadge color="light" className="text-dark">{HAZARD_LABEL[z.hazard_level]}</CBadge>
                </CCardHeader>
                <CCardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-medium-emphasis small">Одоо бүсэд:</span>
                    <span className={`fw-bold fs-3 ${over?'text-danger':''}`}>
                      {z.current_count}{z.max_occupancy ? ` / ${z.max_occupancy}` : ''}
                    </span>
                  </div>
                  {over && <CBadge color="danger" className="mb-2">⚠ Хүн хэтэрсэн!</CBadge>}
                  <div style={{maxHeight:160, overflowY:'auto'}}>
                    {(z.occupants||[]).length === 0 ? (
                      <div className="text-medium-emphasis small">Хүн байхгүй</div>
                    ) : (z.occupants||[]).map(o => (
                      <div key={o.employee_id} className="d-flex justify-content-between small border-bottom py-1">
                        <span>{o.emp_code} — {o.full_name}</span>
                        <span className="text-medium-emphasis">{dayjs(o.since).format('HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          )
        })}
        {zones.length === 0 && (
          <CCol xs={12} className="text-center text-medium-emphasis py-5">
            Аюултай бүс тодорхойлоогүй байна. "Бүс тохируулах" хэсгээс нэмнэ үү.
          </CCol>
        )}
      </CRow>
    </>
  )
}

// ── Manage zones ────────────────────────────────────────────────────
function ManageTab() {
  const [zones,   setZones]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)

  const currentProjectId = useSelector(s => s.currentProjectId)
  const load = () => {
    setLoading(true)
    api.getDangerZones({ project_id: currentProjectId || undefined }).then(r => setZones(r.data || [])).finally(()=>setLoading(false))
  }
  useEffect(load, [currentProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    if (!window.confirm('Устгах уу?')) return
    await api.deleteDangerZone(id); load()
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-2">
        <CButton color="primary" onClick={()=>{ setEditing(null); setModal(true) }}>+ Аюултай бүс нэмэх</CButton>
      </div>
      <CCard>
        <CCardBody className="p-0">
          {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell>Зоны код</CTableHeaderCell>
                  <CTableHeaderCell>Эрсдэл</CTableHeaderCell>
                  <CTableHeaderCell>Шаардлагатай ХХХ</CTableHeaderCell>
                  <CTableHeaderCell>Багтаамж</CTableHeaderCell>
                  <CTableHeaderCell>Статус</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {zones.map(z => (
                  <CTableRow key={z.id}>
                    <CTableDataCell className="fw-semibold">{z.name}</CTableDataCell>
                    <CTableDataCell><code>{z.zone_code||'—'}</code></CTableDataCell>
                    <CTableDataCell><CBadge color={HAZARD_COLOR[z.hazard_level]}>{HAZARD_LABEL[z.hazard_level]}</CBadge></CTableDataCell>
                    <CTableDataCell>{(z.required_ppe||[]).map(p=>PPE_LABEL[p]||p).join(', ')||'—'}</CTableDataCell>
                    <CTableDataCell>{z.max_occupancy||'—'}</CTableDataCell>
                    <CTableDataCell><CBadge color={z.is_active?'success':'secondary'}>{z.is_active?'Идэвхтэй':'Хаагдсан'}</CBadge></CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={()=>{ setEditing(z); setModal(true) }}>Засах</CButton>
                      <CButton size="sm" color="danger" variant="outline" onClick={()=>remove(z.id)}>X</CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {zones.length === 0 && (
                  <CTableRow><CTableDataCell colSpan={7} className="text-center text-medium-emphasis py-4">Бүс алга</CTableDataCell></CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {modal && <ZoneForm editing={editing} onClose={()=>setModal(false)} onSaved={()=>{ setModal(false); load() }} />}
    </>
  )
}

function ZoneForm({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(editing ? {
    name: editing.name, zone_code: editing.zone_code||'', hazard_level: editing.hazard_level,
    description: editing.description||'', required_ppe: editing.required_ppe||[],
    max_occupancy: editing.max_occupancy||'', is_active: editing.is_active,
  } : {
    name:'', zone_code:'', hazard_level:'medium', description:'',
    required_ppe:[], max_occupancy:'', is_active:true,
  })
  const [saving, setSaving] = useState(false)

  const togglePpe = (p) => setForm(f => ({
    ...f, required_ppe: f.required_ppe.includes(p) ? f.required_ppe.filter(x=>x!==p) : [...f.required_ppe, p]
  }))
  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, max_occupancy: form.max_occupancy ? Number(form.max_occupancy) : null }
      editing ? await api.updateDangerZone(editing.id, payload) : await api.createDangerZone(payload)
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} backdrop="static">
      <CModalHeader><CModalTitle>{editing?'Бүс засах':'Аюултай бүс нэмэх'}</CModalTitle></CModalHeader>
      <CModalBody>
        <CForm><CRow className="g-3">
          <CCol sm={8}><CFormLabel>Нэр *</CFormLabel>
            <CFormInput value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></CCol>
          <CCol sm={4}><CFormLabel>Эрсдэл</CFormLabel>
            <CFormSelect value={form.hazard_level} onChange={e=>setForm(f=>({...f,hazard_level:e.target.value}))}>
              {Object.entries(HAZARD_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
            </CFormSelect></CCol>
          <CCol sm={6}><CFormLabel>Зоны код (RFID reader-тэй тааруулна)</CFormLabel>
            <CFormInput value={form.zone_code} onChange={e=>setForm(f=>({...f,zone_code:e.target.value}))}
              placeholder="steelwork, concrete..." /></CCol>
          <CCol sm={6}><CFormLabel>Хүний багтаамж</CFormLabel>
            <CFormInput type="number" value={form.max_occupancy} onChange={e=>setForm(f=>({...f,max_occupancy:e.target.value}))} /></CCol>
          <CCol sm={12}><CFormLabel>Шаардлагатай хамгаалах хэрэгсэл</CFormLabel>
            <div className="d-flex flex-wrap gap-2">
              {PPE_OPTS.map(p => (
                <CButton key={p} size="sm" color={form.required_ppe.includes(p)?'primary':'secondary'}
                  variant={form.required_ppe.includes(p)?undefined:'outline'} onClick={()=>togglePpe(p)}>
                  {PPE_LABEL[p]}
                </CButton>
              ))}
            </div>
          </CCol>
          <CCol sm={12}><CFormLabel>Тайлбар</CFormLabel>
            <CFormTextarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></CCol>
        </CRow></CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Болих</CButton>
        <CButton color="primary" onClick={save} disabled={saving || !form.name}>
          {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
