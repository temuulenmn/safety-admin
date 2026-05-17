import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol,
  CFormInput, CFormLabel, CFormTextarea,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const fmtMNT = n => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function PenaltyFund() {
  const [balance, setBalance] = useState(null)
  const [expenses,setExpenses]= useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState({ amount: '', purpose: '', spent_at: dayjs().format('YYYY-MM-DD'), notes: '' })
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.getFundBalance(), api.getFundExpenses()])
      .then(([b, e]) => { setBalance(b.data); setExpenses(e.data || []) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => {
    setForm({ amount: '', purpose: '', spent_at: dayjs().format('YYYY-MM-DD'), notes: '' })
    setModal(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      await api.createFundExpense({ ...form, amount: Number(form.amount) })
      setModal(false); load()
    } finally { setSaving(false) }
  }
  const remove = async (id) => {
    if (!window.confirm('Устгах уу?')) return
    await api.deleteFundExpense(id); load()
  }

  if (loading) return <div className="p-3 text-center"><CSpinner /></div>

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Торгуулийн сан</h4>
        <CButton color="primary" onClick={openCreate} disabled={Number(balance?.balance||0) <= 0}>
          + Зарцуулалт нэмэх
        </CButton>
      </div>

      <div className="alert alert-info py-2 small mb-3">
        ⓘ Цуглуулсан торгуулийн мөнгийг ажилчдад нээлттэй харуулна. Ажилчдын саналаар уг сангаас зарцуулна.
      </div>

      <CRow className="g-3 mb-4">
        <CCol sm={4}>
          <CCard>
            <CCardBody className="text-center">
              <div className="text-medium-emphasis small">Нийт цуглуулсан</div>
              <div className="fw-bold fs-2 text-success">{fmtMNT(balance?.collected)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={4}>
          <CCard>
            <CCardBody className="text-center">
              <div className="text-medium-emphasis small">Зарцуулсан</div>
              <div className="fw-bold fs-2 text-warning">{fmtMNT(balance?.spent)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={4}>
          <CCard>
            <CCardBody className="text-center">
              <div className="text-medium-emphasis small">Үлдэгдэл</div>
              <div className="fw-bold fs-2 text-primary">{fmtMNT(balance?.balance)}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader className="fw-semibold">Зарцуулалтын түүх</CCardHeader>
        <CCardBody className="p-0">
          <CTable hover responsive className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Огноо</CTableHeaderCell>
                <CTableHeaderCell>Зориулалт</CTableHeaderCell>
                <CTableHeaderCell>Тэмдэглэл</CTableHeaderCell>
                <CTableHeaderCell>Шийдсэн</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Дүн</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {expenses.map(e => (
                <CTableRow key={e.id}>
                  <CTableDataCell>{dayjs(e.spent_at).format('YYYY-MM-DD')}</CTableDataCell>
                  <CTableDataCell className="fw-semibold">{e.purpose}</CTableDataCell>
                  <CTableDataCell className="text-medium-emphasis small">{e.notes || '—'}</CTableDataCell>
                  <CTableDataCell>{e.decided_by_name || '—'}</CTableDataCell>
                  <CTableDataCell className="text-end fw-bold">{fmtMNT(e.amount)}</CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" color="danger" variant="outline" onClick={()=>remove(e.id)}>X</CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {expenses.length === 0 && (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center text-medium-emphasis py-4">
                    Зарцуулалт алга
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal visible={modal} onClose={()=>setModal(false)}>
        <CModalHeader><CModalTitle>Сангийн зарцуулалт</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}><CFormLabel>Зориулалт *</CFormLabel>
              <CFormInput value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}
                placeholder="Ажилчдын аялал, цайны өрөөний хэрэгсэл..." /></CCol>
            <CCol sm={6}><CFormLabel>Дүн (₮) *</CFormLabel>
              <CFormInput type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Огноо</CFormLabel>
              <CFormInput type="date" value={form.spent_at} onChange={e=>setForm(f=>({...f,spent_at:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
              <CFormTextarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></CCol>
            <CCol sm={12} className="small text-medium-emphasis">
              Үлдэгдэл: <strong>{fmtMNT(balance?.balance)}</strong>
            </CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={save}
            disabled={saving || !form.purpose || !Number(form.amount) || Number(form.amount) > Number(balance?.balance||0)}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
