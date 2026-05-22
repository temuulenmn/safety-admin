import React, { useEffect, useState, useCallback } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormLabel, CProgress,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell,
} from '@coreui/react'
import api from 'src/services/api'

const scoreColor = (s) => s == null ? 'secondary' : s >= 90 ? 'success' : s >= 70 ? 'info' : s >= 50 ? 'warning' : 'danger'
const fmtVal = (v, unit) => v == null ? '—' : `${v}${unit || ''}`

export default function Kpi() {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const [tModal, setTModal] = useState(false)
  const [targets, setTargets] = useState([])
  const [savingKey, setSavingKey] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.getKpiOverview({ date_from: from, date_to: to })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [from, to])

  useEffect(() => { load() }, [load])

  const openTargets = async () => {
    const r = await api.getKpiTargets()
    setTargets((r.data || []).map(t => ({ ...t, target_value: Number(t.target_value), weight: Number(t.weight) })))
    setTModal(true)
  }
  const saveTarget = async (t) => {
    setSavingKey(t.metric_key)
    try {
      await api.updateKpiTarget({ metric_key: t.metric_key, target_value: Number(t.target_value), weight: Number(t.weight) })
      load()
    } finally { setSavingKey(null) }
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">KPI / Гүйцэтгэлийн үзүүлэлт</h4>
        <CButton color="primary" variant="outline" onClick={openTargets}>Зорилт тохируулах</CButton>
      </div>

      <CCard className="mb-3">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol sm={3}><CFormLabel>Эхлэх огноо</CFormLabel>
              <CFormInput type="date" value={from} onChange={e=>setFrom(e.target.value)} /></CCol>
            <CCol sm={3}><CFormLabel>Дуусах огноо</CFormLabel>
              <CFormInput type="date" value={to} onChange={e=>setTo(e.target.value)} /></CCol>
            <CCol sm={2}><CButton color="primary" onClick={load} disabled={loading}>
              {loading ? <CSpinner size="sm" /> : 'Шинэчлэх'}</CButton></CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading && !data ? <div className="text-center py-5"><CSpinner /></div> : data && (
        <>
          <CRow className="g-3 mb-3">
            <CCol md={4}>
              <CCard className="h-100">
                <CCardBody className="text-center">
                  <div className="text-medium-emphasis small">Нэгдсэн аюулгүйн оноо</div>
                  <div className={`fw-bold text-${scoreColor(data.safety_score)}`} style={{ fontSize: '3rem', lineHeight: 1.1 }}>
                    {data.safety_score ?? '—'}
                  </div>
                  <CProgress className="mt-2" value={data.safety_score || 0} color={scoreColor(data.safety_score)} />
                  <div className="small text-medium-emphasis mt-2">
                    {data.active_employees} идэвхтэй ажилтан · {data.period.from} → {data.period.to}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={8}>
              <CRow className="g-3">
                {data.metrics.map(m => (
                  <CCol sm={6} key={m.key}>
                    <CCard className="h-100">
                      <CCardBody className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small text-medium-emphasis">{m.label}</span>
                          {m.met != null && (
                            <CBadge color={m.met ? 'success' : 'danger'}>{m.met ? 'Хүрсэн' : 'Хүрээгүй'}</CBadge>
                          )}
                        </div>
                        <div className="d-flex align-items-baseline gap-2">
                          <span className={`fw-bold fs-4 text-${scoreColor(m.score)}`}>{fmtVal(m.value, m.unit)}</span>
                          <span className="small text-medium-emphasis">/ зорилт {fmtVal(m.target, m.unit)}</span>
                        </div>
                        <CProgress thin value={m.score || 0} color={scoreColor(m.score)} />
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))}
              </CRow>
            </CCol>
          </CRow>

          <CCard>
            <CCardHeader className="fw-semibold">Дэлгэрэнгүй</CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Үзүүлэлт</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Утга</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Зорилт</CTableHeaderCell>
                    <CTableHeaderCell>Чиглэл</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Жин</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Оноо</CTableHeaderCell>
                    <CTableHeaderCell>Төлөв</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data.metrics.map(m => (
                    <CTableRow key={m.key}>
                      <CTableDataCell>{m.label}</CTableDataCell>
                      <CTableDataCell className="text-end fw-semibold">{fmtVal(m.value, m.unit)}</CTableDataCell>
                      <CTableDataCell className="text-end">{fmtVal(m.target, m.unit)}</CTableDataCell>
                      <CTableDataCell>{m.direction === 'up' ? 'Их нь сайн' : 'Бага нь сайн'}</CTableDataCell>
                      <CTableDataCell className="text-end">{m.weight}</CTableDataCell>
                      <CTableDataCell className="text-end">{m.score == null ? '—' : `${m.score}%`}</CTableDataCell>
                      <CTableDataCell>
                        {m.met == null ? <CBadge color="secondary">Өгөгдөлгүй</CBadge>
                          : <CBadge color={m.met ? 'success' : 'danger'}>{m.met ? 'Хүрсэн' : 'Хүрээгүй'}</CBadge>}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </>
      )}

      {/* Targets modal */}
      <CModal visible={tModal} onClose={()=>setTModal(false)} size="lg">
        <CModalHeader><CModalTitle>KPI зорилт тохируулах</CModalTitle></CModalHeader>
        <CModalBody>
          <CTable responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Үзүүлэлт</CTableHeaderCell>
                <CTableHeaderCell>Зорилт</CTableHeaderCell>
                <CTableHeaderCell>Жин</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {targets.map((t, i) => (
                <CTableRow key={t.metric_key}>
                  <CTableDataCell>{t.label}</CTableDataCell>
                  <CTableDataCell style={{ width: 130 }}>
                    <CFormInput type="number" step="0.01" value={t.target_value}
                      onChange={e=>setTargets(ts=>ts.map((x,j)=>j===i?{...x,target_value:e.target.value}:x))} />
                  </CTableDataCell>
                  <CTableDataCell style={{ width: 110 }}>
                    <CFormInput type="number" step="0.1" value={t.weight}
                      onChange={e=>setTargets(ts=>ts.map((x,j)=>j===i?{...x,weight:e.target.value}:x))} />
                  </CTableDataCell>
                  <CTableDataCell style={{ width: 100 }}>
                    <CButton size="sm" color="primary" onClick={()=>saveTarget(t)} disabled={savingKey===t.metric_key}>
                      {savingKey===t.metric_key ? <CSpinner size="sm" /> : 'Хадгалах'}
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setTModal(false)}>Хаах</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
