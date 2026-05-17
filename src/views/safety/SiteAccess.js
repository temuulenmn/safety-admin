import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormCheck,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CAlert,
} from '@coreui/react'
import api from 'src/services/api'

const EMPTY = { zone_name: '', description: '', requires_rfid: true, required_training_ids: [] }

export default function SiteAccess() {
  const [rules,     setRules]    = useState([])
  const [trainings, setTrainings]= useState([])
  const [emps,      setEmps]     = useState([])
  const [loading,   setLoading]  = useState(true)
  const [modal,     setModal]    = useState(false)
  const [form,      setForm]     = useState(EMPTY)
  const [editing,   setEditing]  = useState(null)
  const [saving,    setSaving]   = useState(false)
  const [deleting,  setDeleting] = useState(null)
  // Check access
  const [checkEmp,  setCheckEmp] = useState('')
  const [checkZone, setCheckZone]= useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [checking,  setChecking] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getSiteAccess(),
      api.getTrainings(),
      api.getEmployees({ status: 'active', limit: 500 }),
    ]).then(([r, t, e]) => {
      setRules(r.data || [])
      setTrainings(t.data || [])
      setEmps(e.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const load = () => {
    api.getSiteAccess().then(r => setRules(r.data || []))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    setForm({
      zone_name: r.zone_name,
      description: r.description || '',
      requires_rfid: r.requires_rfid,
      required_training_ids: r.required_training_ids || [],
    })
    setModal(true)
  }
  const toggleTraining = (id) => {
    setForm(f => ({
      ...f,
      required_training_ids: f.required_training_ids.includes(id)
        ? f.required_training_ids.filter(x => x !== id)
        : [...f.required_training_ids, id],
    }))
  }
  const save = async () => {
    setSaving(true)
    try {
      editing ? await api.updateSiteAccess(editing, form) : await api.createSiteAccess(form)
      setModal(false); load()
    } finally { setSaving(false) }
  }
  const remove = async (id) => {
    if (!window.confirm('Дүрэм устгах уу?')) return
    setDeleting(id)
    try { await api.deleteSiteAccess(id); load() } finally { setDeleting(null) }
  }

  const checkAccess = async () => {
    if (!checkEmp || !checkZone) return
    setChecking(true); setCheckResult(null)
    try {
      const r = await api.checkAccess({ employee_id: checkEmp, zone_name: checkZone })
      setCheckResult(r.data)
    } catch (e) {
      setCheckResult({ allowed: false, reason: e?.response?.data?.message || 'Алдаа гарлаа' })
    } finally { setChecking(false) }
  }

  const zoneOptions = [...new Set(rules.map(r => r.zone_name))]

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">Талбайн нэвтрэх дүрэм</h4>

      <CRow className="g-3">
        {/* Rules list */}
        <CCol lg={8}>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Бүсийн дүрмүүд</span>
              <CButton size="sm" color="primary" onClick={openCreate}>+ Дүрэм нэмэх</CButton>
            </CCardHeader>
            <CCardBody className="p-0">
              {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Бүсийн нэр</CTableHeaderCell>
                      <CTableHeaderCell>RFID шаардлага</CTableHeaderCell>
                      <CTableHeaderCell>Шаардлагатай сургалтууд</CTableHeaderCell>
                      <CTableHeaderCell>Тайлбар</CTableHeaderCell>
                      <CTableHeaderCell></CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {rules.map(r => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="fw-semibold">{r.zone_name}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={r.requires_rfid ? 'danger' : 'secondary'}>
                            {r.requires_rfid ? 'Шаардлагатай' : 'Шаардлагагүй'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {r.required_trainings?.length > 0
                            ? r.required_trainings.map(t => (
                                <CBadge key={t.id} color="info" className="me-1">{t.name}</CBadge>
                              ))
                            : <span className="text-medium-emphasis">—</span>
                          }
                        </CTableDataCell>
                        <CTableDataCell>{r.description || '—'}</CTableDataCell>
                        <CTableDataCell>
                          <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={() => openEdit(r)}>Засах</CButton>
                          <CButton size="sm" color="danger" variant="outline" onClick={() => remove(r.id)}
                            disabled={deleting === r.id}>
                            {deleting === r.id ? <CSpinner size="sm" /> : 'Устгах'}
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Access check panel */}
        <CCol lg={4}>
          <CCard>
            <CCardHeader className="fw-semibold">Нэвтрэх эрх шалгах</CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol sm={12}>
                  <CFormLabel>Ажилтан</CFormLabel>
                  <CFormSelect value={checkEmp} onChange={e => { setCheckEmp(e.target.value); setCheckResult(null) }}>
                    <option value="">-- Сонгох --</option>
                    {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
                  </CFormSelect>
                </CCol>
                <CCol sm={12}>
                  <CFormLabel>Бүс</CFormLabel>
                  <CFormSelect value={checkZone} onChange={e => { setCheckZone(e.target.value); setCheckResult(null) }}>
                    <option value="">-- Сонгох --</option>
                    {zoneOptions.map(z => <option key={z} value={z}>{z}</option>)}
                  </CFormSelect>
                </CCol>
                <CCol sm={12}>
                  <CButton color="primary" className="w-100" onClick={checkAccess}
                    disabled={checking || !checkEmp || !checkZone}>
                    {checking ? <CSpinner size="sm" /> : 'Шалгах'}
                  </CButton>
                </CCol>
              </CRow>

              {checkResult && (
                <CAlert className="mt-3 mb-0" color={checkResult.allowed ? 'success' : 'danger'}>
                  <div className="fw-bold mb-1">
                    {checkResult.allowed ? '✓ Нэвтрэх эрхтэй' : '✗ Нэвтрэх эрхгүй'}
                  </div>
                  {checkResult.reason && (
                    <div className="small">{checkResult.reason}</div>
                  )}
                  {checkResult.missing_trainings?.length > 0 && (
                    <div className="mt-2">
                      <div className="small fw-semibold">Дутуу сургалтууд:</div>
                      {checkResult.missing_trainings.map((t, i) => (
                        <CBadge key={i} color="warning" textColor="dark" className="me-1 mt-1">{t}</CBadge>
                      ))}
                    </div>
                  )}
                </CAlert>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* CRUD modal */}
      <CModal visible={modal} onClose={() => setModal(false)} size="lg">
        <CModalHeader><CModalTitle>{editing ? 'Дүрэм засах' : 'Дүрэм нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={6}><CFormLabel>Бүсийн нэр <span className="text-danger">*</span></CFormLabel>
              <CFormInput value={form.zone_name || ''} onChange={e => setForm(f => ({...f, zone_name: e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>RFID шаардлага</CFormLabel>
              <CFormSelect value={form.requires_rfid ? 'true' : 'false'}
                onChange={e => setForm(f => ({...f, requires_rfid: e.target.value === 'true'}))}>
                <option value="true">Шаардлагатай</option>
                <option value="false">Шаардлагагүй</option>
              </CFormSelect>
            </CCol>
            <CCol sm={12}><CFormLabel>Тайлбар</CFormLabel>
              <CFormInput value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></CCol>
            <CCol sm={12}>
              <CFormLabel>Шаардлагатай сургалтууд</CFormLabel>
              <CCard className="p-3" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {trainings.length === 0
                  ? <span className="text-medium-emphasis small">Сургалт байхгүй</span>
                  : trainings.map(t => (
                    <CFormCheck
                      key={t.id} id={`tr-${t.id}`}
                      label={`${t.name}${t.is_mandatory ? ' ⚠' : ''}`}
                      checked={form.required_training_ids?.includes(t.id)}
                      onChange={() => toggleTraining(t.id)}
                    />
                  ))
                }
              </CCard>
            </CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
