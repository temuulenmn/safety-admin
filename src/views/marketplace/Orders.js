import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = {
  pending:'warning', approved:'info', shipped:'primary', delivered:'success', cancelled:'secondary'
}
const STATUS_LABEL = {
  pending:'Хүлээгдэж буй', approved:'Батлагдсан', shipped:'Илгээгдсэн',
  delivered:'Хүргэгдсэн', cancelled:'Цуцлагдсан'
}
const fmtMNT = (n) => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function Orders() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const [detail,  setDetail]  = useState(null)
  const [acting,  setActing]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getMarketOrders({ status: status || undefined, limit: 200 })
      .then(r => setRows(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [status])

  const openDetail = (id) => api.getMarketOrder(id).then(r => setDetail(r.data))

  const cancel = async (id) => {
    if (!window.confirm('Цуцлах уу?')) return
    setActing(id)
    try { await api.cancelMarketOrder(id); load(); if (detail?.id === id) openDetail(id) }
    finally { setActing(null) }
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Миний захиалгууд</h4>
        <div style={{width:220}}>
          <CFormSelect value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Бүх төлөв</option>
            {Object.entries(STATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
          </CFormSelect>
        </div>
      </div>

      <CCard>
        <CCardBody className="p-0">
          {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>№</CTableHeaderCell>
                  <CTableHeaderCell>Бараа</CTableHeaderCell>
                  <CTableHeaderCell>Дүн</CTableHeaderCell>
                  <CTableHeaderCell>Огноо</CTableHeaderCell>
                  <CTableHeaderCell>Төлөв</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map(r => (
                  <CTableRow key={r.id} style={{cursor:'pointer'}} onClick={() => openDetail(r.id)}>
                    <CTableDataCell><code>{r.order_number}</code></CTableDataCell>
                    <CTableDataCell>{r.item_count}</CTableDataCell>
                    <CTableDataCell className="fw-semibold">{fmtMNT(r.total_amount)}</CTableDataCell>
                    <CTableDataCell>{dayjs(r.ordered_at).format('YYYY-MM-DD HH:mm')}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell onClick={e => e.stopPropagation()}>
                      {r.status === 'pending' && (
                        <CButton size="sm" color="danger" variant="outline"
                          disabled={acting === r.id} onClick={() => cancel(r.id)}>
                          Цуцлах
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {rows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center text-medium-emphasis py-4">
                      Захиалга алга
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={!!detail} onClose={() => setDetail(null)} size="lg">
        <CModalHeader>
          <CModalTitle>Захиалга #{detail?.order_number}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {detail && (
            <>
              <CRow className="mb-3">
                <CCol sm={6}>
                  <div className="text-medium-emphasis small">Захиалсан</div>
                  <div>{detail.ordered_by_name} | {dayjs(detail.ordered_at).format('YYYY-MM-DD HH:mm')}</div>
                </CCol>
                <CCol sm={6} className="text-end">
                  <CBadge color={STATUS_COLOR[detail.status]} className="fs-6">{STATUS_LABEL[detail.status]}</CBadge>
                </CCol>
              </CRow>
              {detail.note && (
                <div className="mb-3 p-2 bg-body-tertiary rounded">
                  <div className="small text-medium-emphasis">Тэмдэглэл</div>
                  <div>{detail.note}</div>
                </div>
              )}
              <CTable small bordered>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Бараа</CTableHeaderCell>
                    <CTableHeaderCell>Хэмжээ</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Тоо</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Үнэ</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Дүн</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {detail.items?.map(it => (
                    <CTableRow key={it.id}>
                      <CTableDataCell>{it.item_name}</CTableDataCell>
                      <CTableDataCell>{it.size||'—'}</CTableDataCell>
                      <CTableDataCell className="text-end">{it.quantity}</CTableDataCell>
                      <CTableDataCell className="text-end">{fmtMNT(it.unit_price)}</CTableDataCell>
                      <CTableDataCell className="text-end fw-semibold">{fmtMNT(it.subtotal)}</CTableDataCell>
                    </CTableRow>
                  ))}
                  <CTableRow>
                    <CTableDataCell colSpan={4} className="text-end fw-bold">Нийт дүн</CTableDataCell>
                    <CTableDataCell className="text-end fw-bold fs-5">{fmtMNT(detail.total_amount)}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          {detail?.status === 'pending' && (
            <CButton color="danger" variant="outline" onClick={() => cancel(detail.id)}>Захиалга цуцлах</CButton>
          )}
          <CButton color="secondary" onClick={() => setDetail(null)}>Хаах</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
