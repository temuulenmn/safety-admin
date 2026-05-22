import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CFormInput, CFormLabel,
} from '@coreui/react'
import api from 'src/services/api'
import { downloadCSV } from 'src/utils/exporters'
import dayjs from 'dayjs'

const STATUS_COLOR = { draft:'secondary', approved:'primary', paid:'success' }
const STATUS_LABEL = { draft:'Ноорог', approved:'Батлагдсан', paid:'Төлсөн' }

const fmt = (v) => Number(v || 0).toLocaleString('mn-MN')

export default function Payroll() {
  const [periods,  setPeriods]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [entries,  setEntries]  = useState([])
  const [summary,  setSummary]  = useState(null)
  const [entLoad,  setEntLoad]  = useState(false)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ year: dayjs().year(), month: dayjs().month()+1, start_date:'', end_date:'' })
  const [saving,   setSaving]   = useState(false)
  const [approving,setApproving]= useState(null)
  const [generating,setGenerating]= useState(false)

  const load = () => {
    setLoading(true)
    api.getPayrollPeriods().then(r => setPeriods(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openPeriod = async (p) => {
    setSelected(p); setEntLoad(true)
    const [e, s] = await Promise.all([api.getPeriodEntries(p.id), api.getPeriodSummary(p.id)])
    setEntries(e.data || []); setSummary(s.data || null); setEntLoad(false)
  }

  const createPeriod = async () => {
    setSaving(true)
    try { await api.createPayrollPeriod(form); setModal(false); load() }
    finally { setSaving(false) }
  }

  const approve = async (id) => {
    if (!window.confirm('Цалинг батлах уу?')) return
    setApproving(id)
    try { await api.approvePeriod(id); load(); if (selected?.id === id) openPeriod({ ...selected, status:'approved' }) }
    finally { setApproving(null) }
  }

  const generate = async () => {
    if (!selected) return
    if (!window.confirm('Бүх идэвхтэй ажилтны цалинг автоматаар тооцох уу?\n(Үндсэн цалин × ажилласан өдөр + илүү цаг − НДШ/ХАОАТ − торгууль)')) return
    setGenerating(true)
    try { await api.generatePayroll(selected.id); load(); openPeriod(selected) }
    finally { setGenerating(false) }
  }

  const exportExcel = () => {
    if (!selected) return
    downloadCSV(`tsalin-${selected.year}-${String(selected.month).padStart(2,'0')}`,
      ['Код','Нэр','Хэлтэс','Үндсэн','Илүү цаг','Урамшуулал','ААНТТШ','НДШХ','Бусад суутгал','Ажилласан өдөр','Цэвэр'],
      entries.map(e => [e.emp_code, e.full_name, e.department_name||'',
        e.base_salary||0, e.overtime_pay||0, e.bonus||0,
        e.deduction_tax||0, e.deduction_social||0, e.deduction_other||0, e.worked_days||0,
        e.net_salary ?? (Number(e.base_salary||0)+Number(e.overtime_pay||0)+Number(e.bonus||0)
          -Number(e.deduction_tax||0)-Number(e.deduction_social||0)-Number(e.deduction_other||0))]))
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Цалин</h4>
        <CButton color="primary" onClick={() => setModal(true)}>+ Хугацаа үүсгэх</CButton>
      </div>

      <CRow className="g-3">
        {/* Periods list */}
        <CCol lg={4}>
          <CCard>
            <CCardHeader className="fw-semibold">Цалингийн хугацаанууд</CCardHeader>
            <CCardBody className="p-0">
              {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
                <CTable hover>
                  <CTableBody>
                    {periods.map(p => (
                      <CTableRow key={p.id} active={selected?.id === p.id}
                        onClick={() => openPeriod(p)} style={{ cursor:'pointer' }}>
                        <CTableDataCell>
                          <div className="fw-semibold">{p.year} / {String(p.month).padStart(2,'0')}</div>
                          <small className="text-medium-emphasis">{p.start_date?.slice(0,10)} – {p.end_date?.slice(0,10)}</small>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CBadge color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</CBadge>
                          <div className="small text-medium-emphasis">{p.entry_count} ажилтан</div>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Entries */}
        <CCol lg={8}>
          {selected ? (
            <CCard>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold">{selected.year} / {String(selected.month).padStart(2,'0')} — дэлгэрэнгүй</span>
                <div>
                  <CButton size="sm" color="secondary" variant="outline" className="me-2" onClick={exportExcel}>⬇ Excel</CButton>
                  {selected.status === 'draft' && (
                    <>
                      <CButton size="sm" color="info" variant="outline" className="me-2"
                        onClick={generate} disabled={generating}>
                        {generating ? <CSpinner size="sm" /> : '⟲ Цалин тооцох'}
                      </CButton>
                      <CButton size="sm" color="success" onClick={() => approve(selected.id)} disabled={approving===selected.id}>
                        {approving===selected.id ? <CSpinner size="sm" /> : 'Батлах'}
                      </CButton>
                    </>
                  )}
                </div>
              </CCardHeader>
              {summary && (
                <div className="p-3 bg-light border-bottom">
                  <CRow className="g-2 text-center">
                    {[
                      ['Нийт ажилтан', summary.employee_count],
                      ['Үндсэн цалин', fmt(summary.total_base)+'₮'],
                      ['Илүү цаг', fmt(summary.total_overtime)+'₮'],
                      ['Урамшуулал', fmt(summary.total_bonus)+'₮'],
                      ['НДШХ', fmt(summary.total_social)+'₮'],
                      ['ААНТТШ', fmt(summary.total_tax)+'₮'],
                      ['Нийт цэвэр', fmt(summary.total_net)+'₮'],
                    ].map(([l,v]) => (
                      <CCol key={l} xs={6} sm={3}>
                        <div className="text-medium-emphasis small">{l}</div>
                        <div className="fw-bold">{v}</div>
                      </CCol>
                    ))}
                  </CRow>
                </div>
              )}
              <CCardBody className="p-0">
                {entLoad ? <div className="py-4 text-center"><CSpinner /></div> : (
                  <PayrollEntriesTable entries={entries}
                    canEdit={selected.status === 'draft'}
                    onUpdated={() => openPeriod(selected)} period={selected} />
                )}
              </CCardBody>
            </CCard>
          ) : (
            <div className="text-center text-medium-emphasis py-5">Хугацаа сонгоно уу</div>
          )}
        </CCol>
      </CRow>

      <CModal visible={modal} onClose={() => setModal(false)}>
        <CModalHeader><CModalTitle>Цалингийн хугацаа үүсгэх</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol sm={6}><CFormLabel>Жил</CFormLabel>
                <CFormInput type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} /></CCol>
              <CCol sm={6}><CFormLabel>Сар</CFormLabel>
                <CFormInput type="number" min="1" max="12" value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))} /></CCol>
              <CCol sm={6}><CFormLabel>Эхлэх огноо</CFormLabel>
                <CFormInput type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></CCol>
              <CCol sm={6}><CFormLabel>Дуусах огноо</CFormLabel>
                <CFormInput type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={createPeriod} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Үүсгэх'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

// ── Editable payroll entries table ──────────────────────────────────
function PayrollEntriesTable({ entries, canEdit, onUpdated, period }) {
  const [editing, setEditing] = useState(null)  // employee_id of row being edited
  const [bonusVal, setBonusVal] = useState('')
  const [noteVal,  setNoteVal]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const startEdit = (e) => {
    setEditing(e.employee_id)
    setBonusVal(Number(e.bonus || 0))
    setNoteVal(e.note || '')
  }
  const save = async (e) => {
    setSaving(true)
    try {
      await api.upsertEntry(period.id, {
        employee_id: e.employee_id,
        base_salary: e.base_salary,
        overtime_hours: e.overtime_hours,
        overtime_pay: e.overtime_pay,
        bonus: Number(bonusVal) || 0,
        deduction_tax: e.deduction_tax,
        deduction_social: e.deduction_social,
        deduction_other: e.deduction_other,
        worked_days: e.worked_days,
        absent_days: e.absent_days,
        note: noteVal || null,
      })
      setEditing(null); onUpdated()
    } finally { setSaving(false) }
  }
  const cancel = () => setEditing(null)

  return (
    <CTable hover responsive small className="mb-0">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Код</CTableHeaderCell>
          <CTableHeaderCell>Нэр</CTableHeaderCell>
          <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Үндсэн</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Илүү</CTableHeaderCell>
          <CTableHeaderCell className="text-end" style={{minWidth:140}}>Урамшуулал</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Суутгал</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Цэвэр</CTableHeaderCell>
          {canEdit && <CTableHeaderCell style={{width:90}}></CTableHeaderCell>}
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {entries.map(e => {
          const isEditing = editing === e.employee_id
          const deduction = Number(e.deduction_tax||0)+Number(e.deduction_social||0)+Number(e.deduction_other||0)
          return (
            <CTableRow key={e.id} active={isEditing}>
              <CTableDataCell>{e.emp_code}</CTableDataCell>
              <CTableDataCell>{e.full_name}</CTableDataCell>
              <CTableDataCell>{e.department_name}</CTableDataCell>
              <CTableDataCell className="text-end">{fmt(e.base_salary)}</CTableDataCell>
              <CTableDataCell className="text-end">{fmt(e.overtime_pay)}</CTableDataCell>
              <CTableDataCell className="text-end">
                {isEditing ? (
                  <CFormInput size="sm" type="number" value={bonusVal}
                    onChange={ev => setBonusVal(ev.target.value)}
                    className="text-end" autoFocus />
                ) : (
                  <span className={Number(e.bonus) > 0 ? 'text-success fw-semibold' : ''}>
                    {fmt(e.bonus)}
                  </span>
                )}
              </CTableDataCell>
              <CTableDataCell className="text-end text-danger">{fmt(deduction)}</CTableDataCell>
              <CTableDataCell className="text-end fw-bold">
                {fmt(Number(e.base_salary||0) + Number(e.overtime_pay||0) + (isEditing ? Number(bonusVal||0) : Number(e.bonus||0)) - deduction)}
              </CTableDataCell>
              {canEdit && (
                <CTableDataCell>
                  {isEditing ? (
                    <div className="d-flex gap-1">
                      <CButton size="sm" color="success" onClick={() => save(e)} disabled={saving}>
                        {saving ? <CSpinner size="sm" /> : '✓'}
                      </CButton>
                      <CButton size="sm" color="secondary" variant="outline" onClick={cancel}>×</CButton>
                    </div>
                  ) : (
                    <CButton size="sm" color="primary" variant="outline" onClick={() => startEdit(e)}>
                      Урамш
                    </CButton>
                  )}
                </CTableDataCell>
              )}
            </CTableRow>
          )
        })}
        {editing !== null && (
          <CTableRow>
            <CTableDataCell colSpan={canEdit ? 9 : 8} className="bg-body-tertiary">
              <div className="d-flex align-items-center gap-2">
                <CFormLabel className="mb-0 small text-medium-emphasis">Тэмдэглэл:</CFormLabel>
                <CFormInput size="sm" value={noteVal} onChange={e => setNoteVal(e.target.value)}
                  placeholder="Урамшууллын шалтгаан (заавал биш)" />
              </div>
            </CTableDataCell>
          </CTableRow>
        )}
        {entries.length === 0 && (
          <CTableRow>
            <CTableDataCell colSpan={canEdit ? 9 : 8} className="text-center text-medium-emphasis py-4">
              Ажилтан алга. "⟲ Цалин тооцох" товчоор үүсгэнэ үү
            </CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  )
}
