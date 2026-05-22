import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CRow, CCol, CFormInput, CFormSelect,
  CFormLabel, CFormTextarea, CSpinner, CBadge, CNav, CNavItem, CNavLink,
  CTabContent, CTabPane, CProgress,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import { useSelector } from 'react-redux'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'
import api from 'src/services/api'
import dayjs from 'dayjs'

const SHIFT_COLOR = { day: 'success', night: 'dark', rotating: 'warning' }
const SHIFT_LABEL = { day: 'Өдөр', night: 'Шөнө', rotating: 'Ротаци' }
const EMPTY = { employee_id: '', work_date: dayjs().format('YYYY-MM-DD'), shift: 'day', start_time: '', end_time: '', task_description: '', site_zone: '' }

const TSTATUS_COLOR = { planned:'secondary', active:'primary', completed:'success', cancelled:'danger' }
const TSTATUS_LABEL = { planned:'Төлөвлөсөн', active:'Гүйцэтгэж буй', completed:'Дууссан', cancelled:'Цуцлагдсан' }
const PRIORITY_COLOR = { low:'secondary', normal:'info', high:'warning', urgent:'danger' }
const PRIORITY_LABEL = { low:'Бага', normal:'Энгийн', high:'Өндөр', urgent:'Яаралтай' }

export default function Schedules() {
  const [tab, setTab] = useState('individual')
  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">Ажлын хуваарь</h4>
      <CNav variant="tabs" className="mb-3">
        {[['individual','Ажилтны хуваарь'],['brigade','Бригадын даалгавар']].map(([k,l]) => (
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>
      <CTabContent>
        <CTabPane visible={tab==='individual'}><IndividualTab /></CTabPane>
        <CTabPane visible={tab==='brigade'}><BrigadeTab /></CTabPane>
      </CTabContent>
    </div>
  )
}

// ── Individual employee schedule (AG Grid server-side) ──────────────
function IndividualTab() {
  const gridRef  = useRef()
  const gridTheme = useGridTheme()
  const [emps,    setEmps]    = useState([])
  const [dateFrom, setDateFrom] = useState(dayjs().format('YYYY-MM-DD'))
  const [dateTo,   setDateTo]   = useState(dayjs().add(7,'day').format('YYYY-MM-DD'))
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
  }, [])

  const currentProjectId = useSelector(s => s.currentProjectId)
  const refreshDS = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit, sort_by, sort_dir }) =>
      api.getSchedules({ page, limit, date_from: dateFrom, date_to: dateTo, project_id: currentProjectId || undefined, sort_by, sort_dir })
    )
    gridRef.current?.api?.setGridOption('datasource', ds)
  }, [dateFrom, dateTo, currentProjectId])
  useEffect(() => { refreshDS() }, [refreshDS])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit   = (r) => {
    setEditing(r.id)
    setForm({
      employee_id: r.employee_id, work_date: r.work_date?.slice(0,10),
      shift: r.shift, start_time: r.start_time || '', end_time: r.end_time || '',
      task_description: r.task_description || '', site_zone: r.site_zone || '',
    })
    setModal(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      editing ? await api.updateSchedule(editing, form) : await api.createSchedule(form)
      setModal(false); refreshDS()
    } finally { setSaving(false) }
  }
  const remove = async (id) => {
    if (!window.confirm('Устгах уу?')) return
    await api.deleteSchedule(id); refreshDS()
  }

  const cols = [
    { field: 'work_date',   headerName: 'Огноо',   width: 110, valueFormatter: p => p.value?.slice(0,10) },
    { field: 'emp_code',    headerName: 'Код',     width: 80 },
    { field: 'full_name',   headerName: 'Нэр',     flex: 1 },
    { field: 'department',  headerName: 'Хэлтэс',  width: 130 },
    { field: 'shift', headerName: 'Ээлж', width: 90,
      cellRenderer: p => <CBadge color={SHIFT_COLOR[p.value]||'secondary'}>{SHIFT_LABEL[p.value]||p.value}</CBadge> },
    { field: 'start_time', headerName: 'Эхлэх',  width: 90 },
    { field: 'end_time',   headerName: 'Дуусах', width: 90 },
    { field: 'site_zone',  headerName: 'Бүс',    width: 100 },
    { field: 'task_description', headerName: 'Даалгавар', flex: 1 },
    { headerName: 'Үйлдэл', width: 130, pinned: 'right', sortable: false,
      cellRenderer: p => (<>
        <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={() => openEdit(p.data)}>Засах</CButton>
        <CButton size="sm" color="danger" variant="outline" onClick={() => remove(p.data.id)}>X</CButton>
      </>) },
  ]

  return (
    <>
      <div className="d-flex justify-content-end mb-2">
        <CButton color="primary" onClick={openCreate}>+ Хуваарь нэмэх</CButton>
      </div>
      <CCard>
        <CCardHeader>
          <CRow className="g-2 align-items-end">
            <CCol sm={3}><CFormLabel className="mb-1">Эхний огноо</CFormLabel>
              <CFormInput type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></CCol>
            <CCol sm={3}><CFormLabel className="mb-1">Эцсийн огноо</CFormLabel>
              <CFormInput type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></CCol>
            <CCol sm={2}><CButton color="primary" onClick={refreshDS}>Хайх</CButton></CCol>
          </CRow>
        </CCardHeader>
        <CCardBody className="p-0">
          <div style={{ height: 600, width: '100%' }}>
            <AgGridReact ref={gridRef} theme={gridTheme} rowModelType="infinite"
              columnDefs={cols} defaultColDef={defaultColDef} cacheBlockSize={25}
              onGridReady={refreshDS} />
          </div>
        </CCardBody>
      </CCard>

      <CModal visible={modal} onClose={() => setModal(false)}>
        <CModalHeader><CModalTitle>{editing ? 'Хуваарь засах' : 'Хуваарь нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}>
              <CFormLabel>Ажилтан *</CFormLabel>
              <CFormSelect value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.map(e=><option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Огноо *</CFormLabel>
              <CFormInput type="date" value={form.work_date} onChange={e=>setForm(f=>({...f,work_date:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Ээлж</CFormLabel>
              <CFormSelect value={form.shift} onChange={e=>setForm(f=>({...f,shift:e.target.value}))}>
                <option value="day">Өдөр</option><option value="night">Шөнө</option><option value="rotating">Ротаци</option>
              </CFormSelect></CCol>
            <CCol sm={6}><CFormLabel>Эхлэх цаг</CFormLabel>
              <CFormInput type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Дуусах цаг</CFormLabel>
              <CFormInput type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Бүс</CFormLabel>
              <CFormInput value={form.site_zone} onChange={e=>setForm(f=>({...f,site_zone:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Даалгавар</CFormLabel>
              <CFormInput value={form.task_description} onChange={e=>setForm(f=>({...f,task_description:e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

// ── Brigade task assignments ────────────────────────────────────────
function BrigadeTab() {
  const [tasks,    setTasks]    = useState([])
  const [stats,    setStats]    = useState(null)
  const [brigades, setBrigades] = useState([])
  const [contracts,setContracts]= useState([])
  const [loading,  setLoading]  = useState(true)
  const [statusF,  setStatusF]  = useState('')
  const [brigadeF, setBrigadeF] = useState('')
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const currentProjectId = useSelector(s => s.currentProjectId)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getBrigadeTasks({ status: statusF || undefined, brigade_id: brigadeF || undefined, project_id: currentProjectId || undefined, limit: 200 }),
      api.getBrigadeTaskStats(),
    ]).then(([l, s]) => { setTasks(l.data || []); setStats(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getBrigades({ active:'true' }).then(r => setBrigades(r.data || []))
    api.getBrigadeContracts({ limit: 100 }).then(r => setContracts(r.data || []))
  }, [])
  useEffect(load, [statusF, brigadeF, currentProjectId])

  const openCreate = () => { setEditing(null); setModal(true) }
  const openEdit   = (t) => { setEditing(t); setModal(true) }
  const remove = async (id) => {
    if (!window.confirm('Даалгаврыг устгах уу?')) return
    await api.deleteBrigadeTask(id); load()
  }
  const setStatus = async (id, status) => {
    await api.updateBrigadeTask(id, { status, ...(status==='completed' ? {progress_percent:100} : {}) })
    load()
  }
  const setProgress = async (id, pct) => {
    await api.updateBrigadeTask(id, { progress_percent: pct })
    load()
  }

  return (
    <>
      {stats && (
        <CRow className="g-2 mb-3">
          {[['Төлөвлөсөн', stats.planned,'secondary'],
            ['Гүйцэтгэж буй', stats.active,'primary'],
            ['Дууссан', stats.completed,'success'],
            ['Хугацаа хэтэрсэн', stats.overdue,'danger']].map(([l,v,c]) => (
            <CCol key={l} xs={6} sm={3}>
              <CCard><CCardBody className="py-2 text-center">
                <div className="small text-medium-emphasis">{l}</div>
                <div className={`fw-bold fs-4 text-${c}`}>{v ?? 0}</div>
              </CCardBody></CCard>
            </CCol>
          ))}
        </CRow>
      )}

      <div className="d-flex justify-content-end mb-2">
        <CButton color="primary" onClick={openCreate} disabled={brigades.length===0}>+ Даалгавар нэмэх</CButton>
      </div>

      <CCard>
        <CCardHeader>
          <CRow className="g-2 align-items-end">
            <CCol sm={3}>
              <CFormLabel className="mb-1">Бригад</CFormLabel>
              <CFormSelect value={brigadeF} onChange={e=>setBrigadeF(e.target.value)}>
                <option value="">Бүгд</option>
                {brigades.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={3}>
              <CFormLabel className="mb-1">Төлөв</CFormLabel>
              <CFormSelect value={statusF} onChange={e=>setStatusF(e.target.value)}>
                <option value="">Бүгд</option>
                {Object.entries(TSTATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody className="p-0">
          {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Даалгавар</CTableHeaderCell>
                  <CTableHeaderCell>Бригад</CTableHeaderCell>
                  <CTableHeaderCell>Хугацаа</CTableHeaderCell>
                  <CTableHeaderCell>Бүс</CTableHeaderCell>
                  <CTableHeaderCell>Гэрээ</CTableHeaderCell>
                  <CTableHeaderCell>Чухал</CTableHeaderCell>
                  <CTableHeaderCell>Биелэлт</CTableHeaderCell>
                  <CTableHeaderCell>Төлөв</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {tasks.map(t => {
                  const overdue = t.status === 'active' && t.end_date < dayjs().format('YYYY-MM-DD')
                  return (
                    <CTableRow key={t.id}>
                      <CTableDataCell>
                        <div className="fw-semibold">{t.title}</div>
                        {t.description && <small className="text-medium-emphasis">{t.description.slice(0,80)}</small>}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{t.brigade_name}</div>
                        <small className="text-medium-emphasis">{t.specialty} · {t.leader_name}</small>
                      </CTableDataCell>
                      <CTableDataCell className="small">
                        <div>{dayjs(t.start_date).format('MM-DD')} → {dayjs(t.end_date).format('MM-DD')}</div>
                        {overdue && <CBadge color="danger" className="mt-1">Хугацаа хэтэрсэн</CBadge>}
                      </CTableDataCell>
                      <CTableDataCell>{t.site_zone||'—'}</CTableDataCell>
                      <CTableDataCell className="small">
                        {t.contract_number ? <code>{t.contract_number}</code> : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell style={{minWidth:140}}>
                        <CProgress value={t.progress_percent} height={6}
                          color={t.progress_percent >= 100 ? 'success' : 'primary'} />
                        <small className="text-medium-emphasis">{t.progress_percent}%</small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={TSTATUS_COLOR[t.status]}>{TSTATUS_LABEL[t.status]}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {t.status === 'planned' && (
                          <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={()=>setStatus(t.id,'active')}>Эхлүүлэх</CButton>
                        )}
                        {t.status === 'active' && (
                          <CButton size="sm" color="success" variant="outline" className="me-1" onClick={()=>setStatus(t.id,'completed')}>Дуусгах</CButton>
                        )}
                        <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={()=>openEdit(t)}>Засах</CButton>
                        <CButton size="sm" color="danger" variant="outline" onClick={()=>remove(t.id)}>X</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
                {tasks.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-medium-emphasis py-4">Даалгавар алга</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {modal && <TaskForm editing={editing} brigades={brigades} contracts={contracts}
        onClose={()=>setModal(false)} onSaved={()=>{ setModal(false); load() }}
        onProgress={setProgress} />}
    </>
  )
}

// ── Task create/edit form ───────────────────────────────────────────
function TaskForm({ editing, brigades, contracts, onClose, onSaved }) {
  const [form, setForm] = useState(editing ? {
    brigade_id: editing.brigade_id,
    contract_id: editing.contract_id || '',
    title: editing.title,
    description: editing.description || '',
    site_zone: editing.site_zone || '',
    start_date: editing.start_date?.slice(0,10),
    end_date: editing.end_date?.slice(0,10),
    priority: editing.priority,
    progress_percent: editing.progress_percent,
    notes: editing.notes || '',
  } : {
    brigade_id:'', contract_id:'', title:'', description:'', site_zone:'',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date:   dayjs().add(14,'day').format('YYYY-MM-DD'),
    priority:'normal', progress_percent: 0, notes:'',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const relevantContracts = contracts.filter(c =>
    !form.brigade_id || c.brigade_id === Number(form.brigade_id)
  )

  const save = async () => {
    setError('')
    if (!form.brigade_id) return setError('Бригад сонгоно уу')
    if (!form.title)      return setError('Даалгаврын нэр оруулна уу')
    if (!form.start_date || !form.end_date) return setError('Огноо шаардлагатай')
    setSaving(true)
    try {
      const payload = {
        ...form,
        contract_id: form.contract_id || null,
        progress_percent: Number(form.progress_percent) || 0,
      }
      editing ? await api.updateBrigadeTask(editing.id, payload) : await api.createBrigadeTask(payload)
      onSaved()
    } catch (e) { setError(e.response?.data?.message || 'Алдаа гарлаа') }
    finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} size="lg" backdrop="static">
      <CModalHeader><CModalTitle>{editing?'Даалгавар засах':'Бригадын даалгавар нэмэх'}</CModalTitle></CModalHeader>
      <CModalBody>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <CForm><CRow className="g-3">
          <CCol sm={12}><CFormLabel>Бригад *</CFormLabel>
            <CFormSelect value={form.brigade_id} onChange={e=>setForm(f=>({...f,brigade_id:e.target.value,contract_id:''}))}>
              <option value="">-- Сонгох --</option>
              {brigades.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.specialty||'—'}) — {b.leader_name||'?'}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol sm={12}><CFormLabel>Даалгаврын нэр *</CFormLabel>
            <CFormInput value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              placeholder="1-р давхрын мужаанийн ажил" />
          </CCol>
          <CCol sm={12}><CFormLabel>Тайлбар</CFormLabel>
            <CFormTextarea rows={2} value={form.description}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Эхлэх *</CFormLabel>
            <CFormInput type="date" value={form.start_date}
              onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Дуусах *</CFormLabel>
            <CFormInput type="date" value={form.end_date}
              onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></CCol>
          <CCol sm={4}><CFormLabel>Бүс</CFormLabel>
            <CFormInput value={form.site_zone}
              onChange={e=>setForm(f=>({...f,site_zone:e.target.value}))}
              placeholder="1-р давхар..." /></CCol>
          <CCol sm={4}><CFormLabel>Чухал зэрэг</CFormLabel>
            <CFormSelect value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
              {Object.entries(PRIORITY_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
            </CFormSelect></CCol>
          <CCol sm={4}><CFormLabel>Биелэлт %</CFormLabel>
            <CFormInput type="number" min="0" max="100" value={form.progress_percent}
              onChange={e=>setForm(f=>({...f,progress_percent:e.target.value}))} /></CCol>
          <CCol sm={12}><CFormLabel>Холбоотой гэрээ</CFormLabel>
            <CFormSelect value={form.contract_id} onChange={e=>setForm(f=>({...f,contract_id:e.target.value}))}>
              <option value="">— Холбоогүй —</option>
              {relevantContracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.contract_number} — {c.work_description?.slice(0,50)} ({Number(c.contract_amount).toLocaleString()}₮)
                </option>
              ))}
            </CFormSelect></CCol>
          <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
            <CFormTextarea rows={2} value={form.notes}
              onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></CCol>
        </CRow></CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Болих</CButton>
        <CButton color="primary" onClick={save} disabled={saving}>
          {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
