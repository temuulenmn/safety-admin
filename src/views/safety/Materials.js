import React, { useEffect, useState, useCallback } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CNav, CNavItem, CNavLink,
  CTabContent, CTabPane, CForm,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const money = (n) => Number(n || 0).toLocaleString() + '₮'
const EMPTY_NORM = { name:'', category:'', unit:'ширхэг', qty_per_m2:'', unit_price:'', waste_pct:'', notes:'' }

export default function Materials() {
  const [tab, setTab] = useState('calc')

  // Norms
  const [norms, setNorms] = useState([])
  const [loadingNorms, setLoadingNorms] = useState(false)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_NORM)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  // Calculator
  const [area, setArea] = useState('')
  const [calcCat, setCalcCat] = useState('')
  const [calc, setCalc] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [estTitle, setEstTitle] = useState('')
  const [savingEst, setSavingEst] = useState(false)

  // Saved estimates
  const [estimates, setEstimates] = useState([])

  const loadNorms = useCallback(() => {
    setLoadingNorms(true)
    api.getMaterialNorms().then(r => setNorms(r.data || [])).finally(() => setLoadingNorms(false))
  }, [])
  const loadEstimates = useCallback(() => {
    api.getMaterialEstimates().then(r => setEstimates(r.data || []))
  }, [])

  useEffect(() => { loadNorms(); loadEstimates() }, [loadNorms, loadEstimates])

  // ── Norm CRUD ──
  const openCreate = () => { setEditing(null); setForm(EMPTY_NORM); setModal(true) }
  const openEdit = (n) => {
    setEditing(n.id)
    setForm({ name:n.name, category:n.category||'', unit:n.unit, qty_per_m2:n.qty_per_m2,
      unit_price:n.unit_price, waste_pct:n.waste_pct, notes:n.notes||'' })
    setModal(true)
  }
  const saveNorm = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        qty_per_m2: Number(form.qty_per_m2) || 0,
        unit_price: Number(form.unit_price) || 0,
        waste_pct:  Number(form.waste_pct) || 0,
      }
      editing ? await api.updateMaterialNorm(editing, payload) : await api.createMaterialNorm(payload)
      setModal(false); loadNorms()
    } finally { setSaving(false) }
  }
  const deleteNorm = async (id) => {
    if (!window.confirm('Энэ нормыг устгах уу?')) return
    await api.deleteMaterialNorm(id); loadNorms()
  }

  // ── Calculate ──
  const runCalc = async () => {
    const a = Number(area)
    if (!a || a <= 0) return
    setCalculating(true)
    try {
      const r = await api.calculateMaterials({ area_m2: a, category: calcCat || undefined })
      setCalc(r.data)
    } finally { setCalculating(false) }
  }
  const saveEstimate = async () => {
    if (!estTitle || !Number(area)) return
    setSavingEst(true)
    try {
      await api.saveMaterialEstimate({ title: estTitle, area_m2: Number(area), category: calcCat || undefined })
      setEstTitle(''); loadEstimates()
    } finally { setSavingEst(false) }
  }

  const categories = [...new Set(norms.map(n => n.category).filter(Boolean))].sort()
  const deleteEstimate = async (id) => {
    if (!window.confirm('Тооцоог устгах уу?')) return
    await api.deleteMaterialEstimate(id); loadEstimates()
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Материалын тооцоо</h4>
        {tab === 'norms' && <CButton color="primary" onClick={openCreate}>+ Норм нэмэх</CButton>}
      </div>

      <CNav variant="tabs" className="mb-3">
        {[['calc','Тооцоолуур'],['norms','Нормын жагсаалт'],['saved','Хадгалсан тооцоо']].map(([k,l]) => (
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        {/* ── Calculator ── */}
        <CTabPane visible={tab==='calc'}>
          <CCard className="mb-3">
            <CCardBody>
              <CRow className="g-3 align-items-end">
                <CCol sm={4}>
                  <CFormLabel>Талбай (м²)</CFormLabel>
                  <CFormInput type="number" min="0" value={area}
                    onChange={e=>setArea(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runCalc()} />
                </CCol>
                <CCol sm={4}>
                  <CFormLabel>Ажлын төрөл</CFormLabel>
                  <CFormSelect value={calcCat} onChange={e=>setCalcCat(e.target.value)}>
                    <option value="">Бүгд</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </CFormSelect>
                </CCol>
                <CCol sm={3}>
                  <CButton color="primary" onClick={runCalc} disabled={calculating || !Number(area)}>
                    {calculating ? <CSpinner size="sm" /> : 'Бодох'}
                  </CButton>
                </CCol>
              </CRow>
              <div className="small text-medium-emphasis mt-2">
                ⓘ Ажлын төрлөө сонгоод талбай оруулна (ж: "Өрлөг" → 100 м² хана). Норм = 1 м²-т ногдох хэмжээ × талбай × (1 + хаягдал%).
                <br />Бүх төрлийг хольж тооцоолбол нийлбэр утгагүй болохыг анхаараарай.
              </div>
            </CCardBody>
          </CCard>

          {calc && (
            <CCard>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold">{calc.area_m2} м²-ийн материал</span>
                <span className="fw-bold fs-5 text-success">{money(calc.total_cost)}</span>
              </CCardHeader>
              <CCardBody>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Материал</CTableHeaderCell>
                      <CTableHeaderCell>Ангилал</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Норм/м²</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Хэмжээ</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Нэгж үнэ</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Өртөг</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {calc.lines.length === 0 && (
                      <CTableRow><CTableDataCell colSpan={6} className="text-center text-medium-emphasis">
                        Норм оруулаагүй байна — "Нормын жагсаалт" хэсгээс нэмнэ үү.
                      </CTableDataCell></CTableRow>
                    )}
                    {calc.lines.map(l => (
                      <CTableRow key={l.norm_id}>
                        <CTableDataCell>{l.name}</CTableDataCell>
                        <CTableDataCell>{l.category || '—'}</CTableDataCell>
                        <CTableDataCell className="text-end">{l.qty_per_m2}</CTableDataCell>
                        <CTableDataCell className="text-end">{l.quantity} {l.unit}</CTableDataCell>
                        <CTableDataCell className="text-end">{money(l.unit_price)}</CTableDataCell>
                        <CTableDataCell className="text-end fw-semibold">{money(l.cost)}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>

                {calc.lines.length > 0 && (
                  <CRow className="g-2 align-items-end mt-2">
                    <CCol sm={5}>
                      <CFormLabel>Тооцоог хадгалах нэр</CFormLabel>
                      <CFormInput value={estTitle} onChange={e=>setEstTitle(e.target.value)} placeholder="ж: А блок, 1-р давхар" />
                    </CCol>
                    <CCol sm={3}>
                      <CButton color="success" variant="outline" onClick={saveEstimate} disabled={savingEst || !estTitle}>
                        {savingEst ? <CSpinner size="sm" /> : 'Хадгалах'}
                      </CButton>
                    </CCol>
                  </CRow>
                )}
              </CCardBody>
            </CCard>
          )}
        </CTabPane>

        {/* ── Norms list ── */}
        <CTabPane visible={tab==='norms'}>
          <CCard>
            <CCardBody>
              {loadingNorms ? <div className="text-center py-4"><CSpinner /></div> : (
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Материал</CTableHeaderCell>
                      <CTableHeaderCell>Ангилал</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Норм/м²</CTableHeaderCell>
                      <CTableHeaderCell>Нэгж</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Үнэ</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Хаягдал%</CTableHeaderCell>
                      <CTableHeaderCell>Төлөв</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Үйлдэл</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {norms.length === 0 && (
                      <CTableRow><CTableDataCell colSpan={8} className="text-center text-medium-emphasis">
                        Норм байхгүй байна.
                      </CTableDataCell></CTableRow>
                    )}
                    {norms.map(n => (
                      <CTableRow key={n.id}>
                        <CTableDataCell>{n.name}</CTableDataCell>
                        <CTableDataCell>{n.category || '—'}</CTableDataCell>
                        <CTableDataCell className="text-end">{n.qty_per_m2}</CTableDataCell>
                        <CTableDataCell>{n.unit}</CTableDataCell>
                        <CTableDataCell className="text-end">{money(n.unit_price)}</CTableDataCell>
                        <CTableDataCell className="text-end">{n.waste_pct}%</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={n.is_active ? 'success' : 'secondary'}>{n.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={()=>openEdit(n)}>Засах</CButton>
                          <CButton size="sm" color="danger" variant="outline" onClick={()=>deleteNorm(n.id)}>Устгах</CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CTabPane>

        {/* ── Saved estimates ── */}
        <CTabPane visible={tab==='saved'}>
          <CCard>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Нэр</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Талбай</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Нийт өртөг</CTableHeaderCell>
                    <CTableHeaderCell>Үүсгэсэн</CTableHeaderCell>
                    <CTableHeaderCell>Огноо</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Үйлдэл</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {estimates.length === 0 && (
                    <CTableRow><CTableDataCell colSpan={6} className="text-center text-medium-emphasis">
                      Хадгалсан тооцоо алга.
                    </CTableDataCell></CTableRow>
                  )}
                  {estimates.map(e => (
                    <CTableRow key={e.id}>
                      <CTableDataCell>{e.title}</CTableDataCell>
                      <CTableDataCell className="text-end">{e.area_m2} м²</CTableDataCell>
                      <CTableDataCell className="text-end fw-semibold">{money(e.total_cost)}</CTableDataCell>
                      <CTableDataCell>{e.created_by_name || '—'}</CTableDataCell>
                      <CTableDataCell>{dayjs(e.created_at).format('YYYY-MM-DD')}</CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButton size="sm" color="danger" variant="outline" onClick={()=>deleteEstimate(e.id)}>Устгах</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CTabPane>
      </CTabContent>

      {/* Norm create/edit modal */}
      <CModal visible={modal} onClose={()=>setModal(false)}>
        <CModalHeader><CModalTitle>{editing ? 'Норм засах' : 'Норм нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={8}><CFormLabel>Материалын нэр *</CFormLabel>
              <CFormInput value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></CCol>
            <CCol sm={4}><CFormLabel>Нэгж</CFormLabel>
              <CFormSelect value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                {['ширхэг','кг','м³','м²','уут','литр','тонн','багц'].map(u => <option key={u} value={u}>{u}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Ангилал / ажлын төрөл</CFormLabel>
              <CFormInput value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="ж: Цутгалт" /></CCol>
            <CCol sm={6}><CFormLabel>1 м²-т ногдох хэмжээ *</CFormLabel>
              <CFormInput type="number" step="0.0001" min="0" value={form.qty_per_m2}
                onChange={e=>setForm(f=>({...f,qty_per_m2:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Нэгж үнэ (₮)</CFormLabel>
              <CFormInput type="number" min="0" value={form.unit_price}
                onChange={e=>setForm(f=>({...f,unit_price:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Хаягдлын нөөц (%)</CFormLabel>
              <CFormInput type="number" min="0" value={form.waste_pct}
                onChange={e=>setForm(f=>({...f,waste_pct:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
              <CFormInput value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={saveNorm} disabled={saving || !form.name || !form.qty_per_m2}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
