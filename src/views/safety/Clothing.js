import React, { useEffect, useState, useCallback } from 'react'
import {
  CButton, CCard, CCardBody, CBadge, CSpinner, CRow, CCol, CFormInput, CFormSelect,
  CFormLabel, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = {
  pending:  'warning',
  approved: 'primary',
  rejected: 'danger',
  issued:   'success',
}
const STATUS_LABEL = {
  pending:  'Хүлээгдэж буй',
  approved: 'Батлагдсан',
  rejected: 'Татгалзсан',
  issued:   'Олгосон',
}

const SIZES = ['XS','S','M','L','XL','XXL','XXXL']

const EMPTY = {
  employee_id: '', item_type: '', size: '', quantity: 1, notes: '',
}

export default function Clothing() {
  const [rows,     setRows]    = useState([])
  const [emps,     setEmps]    = useState([])
  const [loading,  setLoading] = useState(false)
  const [filter,   setFilter]  = useState('all')
  const [modal,    setModal]   = useState(false)
  const [form,     setForm]    = useState(EMPTY)
  const [saving,   setSaving]  = useState(false)
  const [actioning,setActioning]=useState(null)

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    load()
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = filter !== 'all' ? { status: filter, limit: 500 } : { limit: 500 }
    api.getClothing(params).then(r => setRows(r.data || [])).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const create = async () => {
    setSaving(true)
    try { await api.createClothing(form); setModal(false); load() }
    finally { setSaving(false) }
  }

  const action = async (id, fn) => {
    setActioning(id)
    try { await fn(id); load() } finally { setActioning(null) }
  }

  const counts = {
    all:      rows.length,
    pending:  rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    issued:   rows.filter(r => r.status === 'issued').length,
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Хувцас хэрэглэл</h4>
        <CButton color="primary" onClick={() => { setForm(EMPTY); setModal(true) }}>+ Хүсэлт нэмэх</CButton>
      </div>

      {/* Summary badges */}
      <CRow className="g-2 mb-3">
        {[
          ['all', 'Бүгд', 'secondary'],
          ['pending', 'Хүлээгдэж буй', 'warning'],
          ['approved', 'Батлагдсан', 'primary'],
          ['issued', 'Олгосон', 'success'],
        ].map(([k, l, c]) => (
          <CCol key={k} xs="auto">
            <CButton
              color={c} variant={filter === k ? undefined : 'outline'} size="sm"
              onClick={() => setFilter(k)}
            >
              {l} <CBadge color="light" textColor="dark" className="ms-1">{counts[k] ?? 0}</CBadge>
            </CButton>
          </CCol>
        ))}
      </CRow>

      {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Огноо</CTableHeaderCell>
              <CTableHeaderCell>Ажилтан</CTableHeaderCell>
              <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
              <CTableHeaderCell>Хувцасны төрөл</CTableHeaderCell>
              <CTableHeaderCell>Хэмжээ</CTableHeaderCell>
              <CTableHeaderCell>Тоо</CTableHeaderCell>
              <CTableHeaderCell>Статус</CTableHeaderCell>
              <CTableHeaderCell>Тэмдэглэл</CTableHeaderCell>
              <CTableHeaderCell>Үйлдэл</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map(r => (
              <CTableRow key={r.id}>
                <CTableDataCell>{r.created_at ? dayjs(r.created_at).format('MM-DD') : '—'}</CTableDataCell>
                <CTableDataCell>{r.full_name}</CTableDataCell>
                <CTableDataCell>{r.department_name || '—'}</CTableDataCell>
                <CTableDataCell className="fw-semibold">{r.item_type}</CTableDataCell>
                <CTableDataCell>{r.size || '—'}</CTableDataCell>
                <CTableDataCell>{r.quantity}</CTableDataCell>
                <CTableDataCell>
                  <CBadge color={STATUS_COLOR[r.status] || 'secondary'}>
                    {STATUS_LABEL[r.status] || r.status}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>{r.notes || '—'}</CTableDataCell>
                <CTableDataCell>
                  {r.status === 'pending' && (
                    <>
                      <CButton size="sm" color="success" variant="outline" className="me-1"
                        disabled={actioning === r.id} onClick={() => action(r.id, api.approveClothing)}>
                        {actioning === r.id ? <CSpinner size="sm" /> : 'Батлах'}
                      </CButton>
                      <CButton size="sm" color="danger" variant="outline"
                        disabled={actioning === r.id} onClick={() => action(r.id, api.rejectClothing)}>
                        Татгалзах
                      </CButton>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <CButton size="sm" color="primary" variant="outline"
                      disabled={actioning === r.id} onClick={() => action(r.id, api.issueClothing)}>
                      {actioning === r.id ? <CSpinner size="sm" /> : 'Олгох'}
                    </CButton>
                  )}
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}

      {/* Create modal */}
      <CModal visible={modal} onClose={() => setModal(false)}>
        <CModalHeader><CModalTitle>Хувцасны хүсэлт нэмэх</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}><CFormLabel>Ажилтан <span className="text-danger">*</span></CFormLabel>
              <CFormSelect value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={12}><CFormLabel>Хувцасны төрөл <span className="text-danger">*</span></CFormLabel>
              <CFormInput value={form.item_type} onChange={e => setForm(f => ({...f, item_type: e.target.value}))}
                placeholder="Каска, Жилет, Гутал..." /></CCol>
            <CCol sm={6}><CFormLabel>Хэмжээ</CFormLabel>
              <CFormSelect value={form.size} onChange={e => setForm(f => ({...f, size: e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Тоо ширхэг</CFormLabel>
              <CFormInput type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({...f, quantity: e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
              <CFormInput value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={create} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
