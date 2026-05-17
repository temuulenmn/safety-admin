import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormTextarea,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert, CProgress,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = { pending:'warning', in_progress:'info', completed:'primary', paid:'success', cancelled:'secondary' }
const STATUS_LABEL = { pending:'Хүлээгдэж буй', in_progress:'Гүйцэтгэж буй', completed:'Дууссан', paid:'Төлөгдсөн', cancelled:'Цуцлагдсан' }
const fmt = n => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function BrigadeContracts() {
  const [rows,    setRows]    = useState([])
  const [brigades,setBrigades]= useState([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const [modal,   setModal]   = useState(false)
  const [detail,  setDetail]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getBrigadeContracts({ status: status || undefined, limit: 200 })
      .then(r => setRows(r.data || [])).finally(()=>setLoading(false))
  }
  useEffect(() => {
    api.getBrigades({ active:'true' }).then(r => setBrigades(r.data || []))
  }, [])
  useEffect(load, [status])

  const open = (id) => api.getBrigadeContract(id).then(r => setDetail(r.data))

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Бригадын гэрээ</h4>
        <CButton color="primary" onClick={()=>setModal(true)} disabled={brigades.length===0}>+ Гэрээ үүсгэх</CButton>
      </div>

      {brigades.length === 0 && (
        <CAlert color="warning" className="py-2 small">
          Идэвхтэй бригад алга байна. Эхлээд "Бригадууд" хэсэгт бригад бүртгэнэ үү.
        </CAlert>
      )}

      <CRow className="g-2 mb-3 align-items-end">
        <CCol sm={3}>
          <CFormLabel className="mb-1">Төлөв</CFormLabel>
          <CFormSelect value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">Бүгд</option>
            {Object.entries(STATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
          </CFormSelect>
        </CCol>
      </CRow>

      <CCard>
        <CCardBody className="p-0">
          {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>№</CTableHeaderCell>
                  <CTableHeaderCell>Бригад</CTableHeaderCell>
                  <CTableHeaderCell>Ажил</CTableHeaderCell>
                  <CTableHeaderCell>Хугацаа</CTableHeaderCell>
                  <CTableHeaderCell>Дүн</CTableHeaderCell>
                  <CTableHeaderCell>Төлсөн</CTableHeaderCell>
                  <CTableHeaderCell>Төлөв</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map(r => {
                  const pct = r.contract_amount > 0
                    ? Math.round(Number(r.paid_amount)/Number(r.contract_amount)*100) : 0
                  return (
                    <CTableRow key={r.id} style={{cursor:'pointer'}} onClick={()=>open(r.id)}>
                      <CTableDataCell><code>{r.contract_number}</code></CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-semibold">{r.brigade_name}</div>
                        <small className="text-medium-emphasis">{r.specialty} · {r.leader_name}</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div style={{maxWidth:300,whiteSpace:'normal'}}>{r.work_description}</div>
                        {r.location && <small className="text-medium-emphasis">📍 {r.location}</small>}
                      </CTableDataCell>
                      <CTableDataCell className="small">
                        {r.start_date ? dayjs(r.start_date).format('MM-DD') : '—'} → {r.end_date ? dayjs(r.end_date).format('MM-DD') : '—'}
                      </CTableDataCell>
                      <CTableDataCell className="fw-semibold">{fmt(r.contract_amount)}</CTableDataCell>
                      <CTableDataCell style={{minWidth:140}}>
                        <div className="text-success small">{fmt(r.paid_amount)} ({pct}%)</div>
                        <CProgress value={pct} height={4} color={pct >= 100 ? 'success' : 'primary'} />
                      </CTableDataCell>
                      <CTableDataCell><CBadge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</CBadge></CTableDataCell>
                      <CTableDataCell onClick={e=>e.stopPropagation()}>
                        <CButton size="sm" color="primary" variant="outline" onClick={()=>open(r.id)}>Үзэх</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
                {rows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center text-medium-emphasis py-4">Гэрээ алга</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {modal && <ContractForm brigades={brigades}
        onClose={()=>setModal(false)} onSaved={()=>{ setModal(false); load() }} />}

      {detail && <ContractDetailModal contract={detail}
        onClose={()=>{ setDetail(null); load() }} onRefresh={()=>open(detail.id)} />}
    </div>
  )
}

// ── Create contract form ────────────────────────────────────────────
function ContractForm({ brigades, onClose, onSaved }) {
  const [form, setForm] = useState({
    brigade_id:'', work_description:'', location:'',
    start_date:'', end_date:'', contract_amount:'', notes:'',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const save = async () => {
    setError('')
    if (!form.brigade_id) return setError('Бригад сонгоно уу')
    if (!form.work_description) return setError('Ажлын тайлбар оруулна уу')
    if (!Number(form.contract_amount)) return setError('Гэрээний дүн оруулна уу')
    setSaving(true)
    try {
      await api.createBrigadeContract({ ...form, contract_amount: Number(form.contract_amount) })
      onSaved()
    } catch (e) { setError(e.response?.data?.message || 'Алдаа гарлаа') }
    finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} size="lg" backdrop="static">
      <CModalHeader><CModalTitle>Шинэ гэрээ үүсгэх</CModalTitle></CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger" className="py-2 small">{error}</CAlert>}
        <CForm><CRow className="g-3">
          <CCol sm={12}><CFormLabel>Бригад *</CFormLabel>
            <CFormSelect value={form.brigade_id} onChange={e=>setForm(f=>({...f,brigade_id:e.target.value}))}>
              <option value="">-- Сонгох --</option>
              {brigades.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.specialty||'—'}) — {b.leader_name||'?'} {b.is_external?'[Гадны]':''}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol sm={12}><CFormLabel>Ажлын тайлбар *</CFormLabel>
            <CFormTextarea rows={2} value={form.work_description}
              onChange={e=>setForm(f=>({...f,work_description:e.target.value}))}
              placeholder="1-р давхрын мужаанийн ажил, шахалт цутгалт..." /></CCol>
          <CCol sm={12}><CFormLabel>Байршил/Талбай</CFormLabel>
            <CFormInput value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
              placeholder="1-р давхар, А блок..." /></CCol>
          <CCol sm={6}><CFormLabel>Эхлэх огноо</CFormLabel>
            <CFormInput type="date" value={form.start_date}
              onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Дуусах огноо</CFormLabel>
            <CFormInput type="date" value={form.end_date}
              onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></CCol>
          <CCol sm={12}><CFormLabel>Гэрээний нийт дүн (₮) *</CFormLabel>
            <CFormInput type="number" value={form.contract_amount}
              onChange={e=>setForm(f=>({...f,contract_amount:e.target.value}))} /></CCol>
          <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
            <CFormTextarea rows={2} value={form.notes}
              onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></CCol>
        </CRow></CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Болих</CButton>
        <CButton color="primary" onClick={save} disabled={saving}>
          {saving ? <CSpinner size="sm" /> : 'Үүсгэх'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

// ── Contract detail with payments ──────────────────────────────────
function ContractDetailModal({ contract, onClose, onRefresh }) {
  const [payMode, setPayMode] = useState(false)
  const [payForm, setPayForm] = useState({
    amount:'', paid_at: dayjs().format('YYYY-MM-DD'),
    payment_method:'cash', paid_to_name:'', receipt_number:'', notes:'',
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [acting,  setActing]  = useState(false)

  const remaining = Number(contract.contract_amount) - Number(contract.paid_amount)
  const pct = contract.contract_amount > 0
    ? Math.round(Number(contract.paid_amount)/Number(contract.contract_amount)*100) : 0

  const startContract = async () => {
    if (!window.confirm('Гүйцэтгэлийг эхлүүлэх үү?')) return
    setActing(true)
    try { await api.startBrigadeContract(contract.id); onRefresh() } finally { setActing(false) }
  }
  const completeContract = async () => {
    if (!window.confirm('Ажлыг дууссан гэж тэмдэглэх үү?')) return
    setActing(true)
    try { await api.completeBrigadeContract(contract.id); onRefresh() } finally { setActing(false) }
  }
  const cancelContract = async () => {
    if (!window.confirm('Гэрээг цуцлах уу?')) return
    setActing(true)
    try { await api.cancelBrigadeContract(contract.id); onRefresh() } finally { setActing(false) }
  }
  const savePay = async () => {
    setError('')
    const amt = Number(payForm.amount)
    if (!amt) return setError('Дүн оруулна уу')
    if (amt > remaining + 0.01) return setError(`Үлдсэн дүнгээс хэтэрсэн (үлд ${fmt(remaining)})`)
    setSaving(true)
    try {
      await api.recordBrigadePayment(contract.id, { ...payForm, amount: amt })
      setPayMode(false)
      setPayForm({ amount:'', paid_at:dayjs().format('YYYY-MM-DD'), payment_method:'cash',
                   paid_to_name:'', receipt_number:'', notes:'' })
      onRefresh()
    } catch (e) { setError(e.response?.data?.message || 'Алдаа гарлаа') }
    finally { setSaving(false) }
  }
  const removePayment = async (pid) => {
    if (!window.confirm('Төлбөрийн бичлэгийг устгах уу?')) return
    await api.deleteBrigadePayment(pid); onRefresh()
  }

  return (
    <CModal visible={true} onClose={onClose} size="xl" backdrop="static">
      <CModalHeader>
        <CModalTitle>
          {contract.contract_number} — {contract.brigade_name}
          <CBadge color={STATUS_COLOR[contract.status]} className="ms-2">{STATUS_LABEL[contract.status]}</CBadge>
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow className="g-2 mb-3">
          <CCol sm={6}>
            <div className="small text-medium-emphasis">Бригадын ахлагч</div>
            <div className="fw-semibold">{contract.leader_name} {contract.is_external && <CBadge color="info" className="ms-1">Гадны</CBadge>}</div>
            {contract.leader_phone && <div className="small">📞 {contract.leader_phone}</div>}
          </CCol>
          <CCol sm={3}>
            <div className="small text-medium-emphasis">Хугацаа</div>
            <div>{contract.start_date ? dayjs(contract.start_date).format('YYYY-MM-DD') : '—'}<br/>
                 {contract.end_date ? dayjs(contract.end_date).format('YYYY-MM-DD') : '—'}</div>
          </CCol>
          <CCol sm={3}>
            <div className="small text-medium-emphasis">Байршил</div>
            <div>{contract.location || '—'}</div>
          </CCol>
        </CRow>

        <div className="alert alert-secondary py-2 small mb-3">
          <strong>Ажил:</strong> {contract.work_description}
          {contract.notes && <div className="mt-1 text-medium-emphasis">📝 {contract.notes}</div>}
        </div>

        <CCard className="mb-3">
          <CCardBody>
            <CRow className="g-2 text-center">
              <CCol sm={4}>
                <div className="small text-medium-emphasis">Гэрээний дүн</div>
                <div className="fw-bold fs-4 text-primary">{fmt(contract.contract_amount)}</div>
              </CCol>
              <CCol sm={4}>
                <div className="small text-medium-emphasis">Төлсөн</div>
                <div className="fw-bold fs-4 text-success">{fmt(contract.paid_amount)}</div>
              </CCol>
              <CCol sm={4}>
                <div className="small text-medium-emphasis">Үлдсэн</div>
                <div className={`fw-bold fs-4 ${remaining > 0 ? 'text-danger' : 'text-success'}`}>{fmt(remaining)}</div>
              </CCol>
            </CRow>
            <CProgress value={pct} className="mt-2" color={pct >= 100 ? 'success' : 'primary'} />
          </CCardBody>
        </CCard>

        {/* Status actions */}
        <div className="mb-3 d-flex gap-2 flex-wrap">
          {contract.status === 'pending' && (
            <CButton color="info" onClick={startContract} disabled={acting}>▶ Гүйцэтгэл эхлүүлэх</CButton>
          )}
          {contract.status === 'in_progress' && (
            <CButton color="primary" onClick={completeContract} disabled={acting}>✓ Ажил дууссан</CButton>
          )}
          {(contract.status === 'pending' || contract.status === 'in_progress') && (
            <CButton color="danger" variant="outline" onClick={cancelContract} disabled={acting}>Цуцлах</CButton>
          )}
        </div>

        {/* Payments */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Төлбөрийн түүх ({contract.payments?.length || 0})</strong>
            {contract.status !== 'cancelled' && remaining > 0 && (
              <CButton size="sm" color="success" onClick={()=>setPayMode(true)}>+ Төлбөр бүртгэх</CButton>
            )}
          </CCardHeader>
          {payMode && (
            <div className="p-3 bg-body-tertiary">
              {error && <CAlert color="danger" className="py-2 small">{error}</CAlert>}
              <CRow className="g-2">
                <CCol sm={3}><CFormLabel className="small mb-1">Дүн (₮) *</CFormLabel>
                  <CFormInput type="number" value={payForm.amount}
                    onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} placeholder={`үлд ${fmt(remaining)}`} /></CCol>
                <CCol sm={2}><CFormLabel className="small mb-1">Огноо</CFormLabel>
                  <CFormInput type="date" value={payForm.paid_at}
                    onChange={e=>setPayForm(f=>({...f,paid_at:e.target.value}))} /></CCol>
                <CCol sm={2}><CFormLabel className="small mb-1">Хэлбэр</CFormLabel>
                  <CFormSelect value={payForm.payment_method}
                    onChange={e=>setPayForm(f=>({...f,payment_method:e.target.value}))}>
                    <option value="cash">Бэлэн</option>
                    <option value="transfer">Шилжүүлэг</option>
                    <option value="card">Карт</option>
                  </CFormSelect></CCol>
                <CCol sm={3}><CFormLabel className="small mb-1">Авсан хүн (ахлагч)</CFormLabel>
                  <CFormInput value={payForm.paid_to_name}
                    placeholder={contract.leader_name||''}
                    onChange={e=>setPayForm(f=>({...f,paid_to_name:e.target.value}))} /></CCol>
                <CCol sm={2}><CFormLabel className="small mb-1">Баримтын №</CFormLabel>
                  <CFormInput value={payForm.receipt_number}
                    onChange={e=>setPayForm(f=>({...f,receipt_number:e.target.value}))} /></CCol>
                <CCol sm={12}>
                  <CFormInput placeholder="Тэмдэглэл" value={payForm.notes}
                    onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} />
                </CCol>
                <CCol sm={12} className="text-end">
                  <CButton size="sm" color="secondary" className="me-2" onClick={()=>setPayMode(false)}>Болих</CButton>
                  <CButton size="sm" color="success" onClick={savePay} disabled={saving}>
                    {saving ? <CSpinner size="sm" /> : 'Бүртгэх'}
                  </CButton>
                </CCol>
              </CRow>
            </div>
          )}
          <CTable small hover className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Огноо</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Дүн</CTableHeaderCell>
                <CTableHeaderCell>Хэлбэр</CTableHeaderCell>
                <CTableHeaderCell>Авсан хүн</CTableHeaderCell>
                <CTableHeaderCell>Баримт</CTableHeaderCell>
                <CTableHeaderCell>Бүртгэсэн</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {contract.payments?.map(p => (
                <CTableRow key={p.id}>
                  <CTableDataCell>{dayjs(p.paid_at).format('YYYY-MM-DD')}</CTableDataCell>
                  <CTableDataCell className="text-end fw-semibold">{fmt(p.amount)}</CTableDataCell>
                  <CTableDataCell>{p.payment_method}</CTableDataCell>
                  <CTableDataCell>{p.paid_to_name || '—'}</CTableDataCell>
                  <CTableDataCell>{p.receipt_number || '—'}</CTableDataCell>
                  <CTableDataCell className="small text-medium-emphasis">{p.recorded_by_name || '—'}</CTableDataCell>
                  <CTableDataCell><CButton size="sm" color="danger" variant="outline" onClick={()=>removePayment(p.id)}>X</CButton></CTableDataCell>
                </CTableRow>
              ))}
              {(!contract.payments || contract.payments.length === 0) && (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center text-medium-emphasis py-3">Төлбөр алга</CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCard>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Хаах</CButton>
      </CModalFooter>
    </CModal>
  )
}
