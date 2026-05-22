import React, { useEffect, useState, useMemo } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormCheck,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CProgress,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const PPE_CHECK = [
  { key:'helmet',  label:'Каска' },
  { key:'vest',    label:'Хантааз' },
  { key:'gloves',  label:'Бээлий' },
  { key:'boots',   label:'Гутал' },
  { key:'glasses', label:'Нүдний шил' },
]

export default function MorningInspection() {
  const [summary,   setSummary]   = useState(null)
  const [notChecked,setNotChecked]= useState([])
  const [emps,      setEmps]      = useState([])
  const [today,     setToday]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [preselect, setPreselect] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getMorningToday(),
      api.getMorningInspections({ date: dayjs().format('YYYY-MM-DD'), limit: 500 }),
    ]).then(([t, l]) => {
      setSummary(t.data?.summary); setNotChecked(t.data?.not_checked || [])
      setToday(l.data || [])
    }).finally(()=>setLoading(false))
  }
  useEffect(() => {
    api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data || []))
    load()
  }, [])

  const openCheck = (emp) => { setPreselect(emp); setModal(true) }

  const pct = summary?.total_active > 0
    ? Math.round(summary.checked / summary.total_active * 100) : 0

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Өглөөний шалгалт</h4>
        <CButton color="primary" onClick={()=>{ setPreselect(null); setModal(true) }}>+ Шалгалт бүртгэх</CButton>
      </div>

      <div className="alert alert-info py-2 small mb-3">
        ⓘ Өглөө бүр ажилтан нэг нэгнийхээ хувийн хамгаалах хэрэгслийг шалгаад, талбайд гарахдаа RFID уншуулж бүртгүүлнэ.
      </div>

      {summary && (
        <CRow className="g-2 mb-3">
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Шалгагдсан</div>
            <div className="fw-bold fs-4">{summary.checked} / {summary.total_active}</div>
            <CProgress value={pct} height={4} className="mt-1" />
          </CCardBody></CCard></CCol>
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Тэнцсэн</div>
            <div className="fw-bold fs-4 text-success">{summary.passed}</div>
          </CCardBody></CCard></CCol>
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">Тэнцээгүй</div>
            <div className="fw-bold fs-4 text-danger">{summary.failed}</div>
          </CCardBody></CCard></CCol>
          <CCol sm={3}><CCard><CCardBody className="py-2 text-center">
            <div className="small text-medium-emphasis">RFID бүртгэсэн</div>
            <div className="fw-bold fs-4 text-info">{summary.registered}</div>
          </CCardBody></CCard></CCol>
        </CRow>
      )}

      {loading ? <div className="text-center py-4"><CSpinner /></div> : (
        <CRow className="g-3">
          {/* Checked today */}
          <CCol lg={7}>
            <CCard>
              <CCardHeader className="fw-semibold">Өнөөдөр шалгагдсан ({today.length})</CCardHeader>
              <CCardBody className="p-0" style={{maxHeight:500, overflowY:'auto'}}>
                <CTable hover small className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Ажилтан</CTableHeaderCell>
                      <CTableHeaderCell>Шалгасан</CTableHeaderCell>
                      <CTableHeaderCell>ХХХ</CTableHeaderCell>
                      <CTableHeaderCell>Үр дүн</CTableHeaderCell>
                      <CTableHeaderCell>RFID</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {today.map(m => (
                      <CTableRow key={m.id}>
                        <CTableDataCell>
                          <div className="fw-semibold">{m.emp_code} {m.full_name}</div>
                          <small className="text-medium-emphasis">{dayjs(m.inspected_at).format('HH:mm')}</small>
                        </CTableDataCell>
                        <CTableDataCell className="small">{m.inspector_name||'—'}</CTableDataCell>
                        <CTableDataCell>
                          {PPE_CHECK.map(p => (
                            <span key={p.key} title={p.label} className="me-1">
                              {m.ppe_items?.[p.key] ? '✅' : '❌'}
                            </span>
                          ))}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={m.passed?'success':'danger'}>{m.passed?'Тэнцсэн':'Тэнцээгүй'}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{m.rfid_registered ? <CBadge color="info">✓</CBadge> : '—'}</CTableDataCell>
                      </CTableRow>
                    ))}
                    {today.length === 0 && (
                      <CTableRow><CTableDataCell colSpan={5} className="text-center text-medium-emphasis py-3">Шалгалт алга</CTableDataCell></CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Not yet checked */}
          <CCol lg={5}>
            <CCard>
              <CCardHeader className="fw-semibold text-warning">Шалгагдаагүй ({notChecked.length})</CCardHeader>
              <CCardBody className="p-0" style={{maxHeight:500, overflowY:'auto'}}>
                <CTable hover small className="mb-0">
                  <CTableBody>
                    {notChecked.map(e => (
                      <CTableRow key={e.id} style={{cursor:'pointer'}} onClick={()=>openCheck(e)}>
                        <CTableDataCell>
                          <div className="fw-semibold">{e.emp_code} {e.full_name}</div>
                          <small className="text-medium-emphasis">{e.department||'—'}</small>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton size="sm" color="primary" variant="outline">Шалгах</CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                    {notChecked.length === 0 && (
                      <CTableRow><CTableDataCell className="text-center text-success py-3">Бүгд шалгагдсан ✓</CTableDataCell></CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {modal && <CheckModal emps={emps} preselect={preselect}
        onClose={()=>setModal(false)} onSaved={()=>{ setModal(false); load() }} />}
    </div>
  )
}

function CheckModal({ emps, preselect, onClose, onSaved }) {
  const [empId,    setEmpId]    = useState(preselect?.id || '')
  const [inspector,setInspector]= useState('')
  const [zone,     setZone]     = useState('')
  const [ppe,      setPpe]      = useState({ helmet:true, vest:true, gloves:true, boots:true, glasses:true })
  const [rfid,     setRfid]     = useState(true)
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  const allPass = useMemo(() => PPE_CHECK.every(p => ppe[p.key]), [ppe])

  const save = async () => {
    if (!empId) return
    setSaving(true)
    try {
      await api.createMorningInspection({
        employee_id: empId, inspector_id: inspector || null, zone: zone || null,
        ppe_items: ppe, passed: allPass, rfid_registered: rfid, notes: notes || null,
      })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} backdrop="static">
      <CModalHeader><CModalTitle>Өглөөний шалгалт бүртгэх</CModalTitle></CModalHeader>
      <CModalBody>
        <CForm><CRow className="g-3">
          <CCol sm={12}><CFormLabel>Шалгуулж буй ажилтан *</CFormLabel>
            <CFormSelect value={empId} onChange={e=>setEmpId(e.target.value)}>
              <option value="">-- Сонгох --</option>
              {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
            </CFormSelect>
          </CCol>
          <CCol sm={6}><CFormLabel>Шалгасан хүн (хамт олон)</CFormLabel>
            <CFormSelect value={inspector} onChange={e=>setInspector(e.target.value)}>
              <option value="">-- Сонгох --</option>
              {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
            </CFormSelect>
          </CCol>
          <CCol sm={6}><CFormLabel>Талбай / бүс</CFormLabel>
            <CFormInput value={zone} onChange={e=>setZone(e.target.value)} /></CCol>

          <CCol sm={12}>
            <CFormLabel>Хувийн хамгаалах хэрэгсэл</CFormLabel>
            <div className="d-flex flex-wrap gap-3">
              {PPE_CHECK.map(p => (
                <CFormCheck key={p.key} label={p.label} checked={!!ppe[p.key]}
                  onChange={e=>setPpe(prev=>({...prev,[p.key]:e.target.checked}))} />
              ))}
            </div>
            <div className="mt-2">
              {allPass
                ? <CBadge color="success">Бүрэн — Тэнцэнэ</CBadge>
                : <CBadge color="danger">Дутуу — Тэнцэхгүй</CBadge>}
            </div>
          </CCol>

          <CCol sm={12}>
            <CFormCheck label="RFID уншуулж талбайд гарахыг бүртгэв" checked={rfid}
              onChange={e=>setRfid(e.target.checked)} />
          </CCol>
          <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
            <CFormInput value={notes} onChange={e=>setNotes(e.target.value)} /></CCol>
        </CRow></CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Болих</CButton>
        <CButton color="primary" onClick={save} disabled={saving || !empId}>
          {saving ? <CSpinner size="sm" /> : 'Бүртгэх'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
