import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell, CSpinner, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CCol,
} from '@coreui/react'
import api from 'src/services/api'

const EMPTY = { name: '', location: '', manager_id: '' }

export default function Departments() {
  const [rows,      setRows]      = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editing,   setEditing]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.getDepartments(), api.getEmployees({ limit: 500 })])
      .then(([d, e]) => { setRows(d.data || []); setEmployees(e.data || []) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit   = (r) => {
    setEditing(r.id)
    setForm({ name: r.name, location: r.location || '', manager_id: r.manager_id || '' })
    setModal(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      editing ? await api.updateDepartment(editing, form) : await api.createDepartment(form)
      setModal(false); load()
    } finally { setSaving(false) }
  }
  const remove = async (id) => {
    if (!window.confirm('Хэлтсийг устгах уу?')) return
    setDeleting(id)
    try { await api.deleteDepartment(id); load() } finally { setDeleting(null) }
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Хэлтсүүд</h4>
        <CButton color="primary" onClick={openCreate}>+ Нэмэх</CButton>
      </div>

      <CCard>
        <CCardBody className="p-0">
          {loading ? <div className="text-center py-4"><CSpinner /></div> : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell>Байрлал</CTableHeaderCell>
                  <CTableHeaderCell>Менежер</CTableHeaderCell>
                  <CTableHeaderCell>Үйлдэл</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map((r, i) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>{i + 1}</CTableDataCell>
                    <CTableDataCell className="fw-semibold">{r.name}</CTableDataCell>
                    <CTableDataCell>{r.location || '—'}</CTableDataCell>
                    <CTableDataCell>{r.manager_name || '—'}</CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={() => openEdit(r)}>Засах</CButton>
                      <CButton size="sm" color="danger"  variant="outline" onClick={() => remove(r.id)} disabled={deleting === r.id}>
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

      <CModal visible={modal} onClose={() => setModal(false)}>
        <CModalHeader><CModalTitle>{editing ? 'Хэлтэс засах' : 'Хэлтэс нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol sm={12}>
                <CFormLabel>Нэр <span className="text-danger">*</span></CFormLabel>
                <CFormInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </CCol>
              <CCol sm={12}>
                <CFormLabel>Байрлал</CFormLabel>
                <CFormInput value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </CCol>
              <CCol sm={12}>
                <CFormLabel>Менежер</CFormLabel>
                <CFormSelect value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
                  <option value="">-- Сонгох --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.last_name} {e.first_name}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CForm>
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
