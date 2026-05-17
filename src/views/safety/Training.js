import React, { useEffect, useState, useMemo } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane,
  CFormInput, CFormSelect, CFormLabel, CFormTextarea, CFormCheck,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = { pending:'warning', scheduled:'info', in_progress:'primary', completed:'success', cancelled:'secondary' }
const STATUS_LABEL = { pending:'Хүлээгдэж буй', scheduled:'Товлогдсон', in_progress:'Үргэлжилж буй', completed:'Дууссан', cancelled:'Цуцлагдсан' }
const PSTATUS_COLOR = { registered:'secondary', attended:'info', passed:'success', failed:'danger', absent:'warning' }
const PSTATUS_LABEL = { registered:'Бүртгэгдсэн', attended:'Ирсэн', passed:'Тэнцсэн', failed:'Тэнцээгүй', absent:'Ирээгүй' }
const fmt = n => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function Training() {
  const [tab, setTab] = useState('catalog')

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">Аюулгүйн сургалт</h4>
      <CNav variant="tabs" className="mb-3">
        {[['catalog','Сургалтын каталог'],['orders','Миний захиалга']].map(([k,l]) => (
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        <CTabPane visible={tab==='catalog'}><CatalogTab onOrdered={()=>setTab('orders')} /></CTabPane>
        <CTabPane visible={tab==='orders'}><OrdersTab /></CTabPane>
      </CTabContent>
    </div>
  )
}

// ── Catalog browsing ─────────────────────────────────────────────────
function CatalogTab({ onOrdered }) {
  const [items,    setItems]    = useState([])
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('')
  const [picking,  setPicking]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getTrainingCatalog({ search: search || undefined, category: category || undefined, limit: 200 })
      .then(r => setItems(r.data || [])).finally(()=>setLoading(false))
  }
  useEffect(()=>{ load() }, [category])
  useEffect(()=>{ api.getTrainingCategories().then(r => setCats(r.data || [])) }, [])

  return (
    <>
      <CCard className="mb-3">
        <CCardBody>
          <CRow className="g-2">
            <CCol sm={4}>
              <CFormInput placeholder="Сургалт хайх..." value={search}
                onChange={e=>setSearch(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&load()} />
            </CCol>
            <CCol sm={3}>
              <CFormSelect value={category} onChange={e=>setCategory(e.target.value)}>
                <option value="">Бүх ангилал</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={2}><CButton color="secondary" variant="outline" onClick={load}>Хайх</CButton></CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? <div className="text-center py-4"><CSpinner /></div> : (
        <CRow className="g-3">
          {items.map(it => (
            <CCol key={it.id} sm={6} lg={4}>
              <CCard className="h-100">
                <CCardBody className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <CBadge color="info">{it.category||'—'}</CBadge>
                    {it.is_mandatory && <CBadge color="danger">Заавал</CBadge>}
                  </div>
                  <h5 className="mb-2">{it.title}</h5>
                  <p className="text-medium-emphasis small mb-3" style={{
                    display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'
                  }}>{it.description}</p>
                  <div className="small mb-2">
                    <div>⏱ {it.duration_hours} цаг · хүчинтэй {it.validity_months} сар</div>
                    <div>📍 {it.mode || '—'}</div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <span className="fw-bold fs-5 text-primary">{fmt(it.price_per_person)}<small className="text-medium-emphasis"> /хүн</small></span>
                    <CButton size="sm" color="primary" onClick={()=>setPicking(it)}>Захиалах →</CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
          {items.length === 0 && (
            <CCol xs={12} className="text-center text-medium-emphasis py-5">Сургалт алга</CCol>
          )}
        </CRow>
      )}

      {picking && <EnrollModal catalog={picking} onClose={()=>setPicking(null)} onSuccess={() => { setPicking(null); onOrdered() }} />}
    </>
  )
}

// ── Enrollment modal (pick employees) ───────────────────────────────
function EnrollModal({ catalog, onClose, onSuccess }) {
  const [emps,      setEmps]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [deptF,     setDeptF]     = useState('')
  const [selected,  setSelected]  = useState(new Set())
  const [reqDate,   setReqDate]   = useState(dayjs().add(7,'day').format('YYYY-MM-DD'))
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    setLoading(true)
    api.getEmployees({ status:'active', limit: 500 })
      .then(r => setEmps(r.data || [])).finally(()=>setLoading(false))
  }, [])

  const departments = useMemo(() => [...new Set(emps.map(e => e.department_name).filter(Boolean))].sort(), [emps])

  const filtered = useMemo(() => emps.filter(e => {
    if (deptF && e.department_name !== deptF) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${e.first_name} ${e.last_name} ${e.emp_code} ${e.position||''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [emps, search, deptF])

  const toggleOne = (id) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const toggleVisible = () => {
    const visible = filtered.map(e => e.id)
    const allSelected = visible.length > 0 && visible.every(id => selected.has(id))
    setSelected(s => {
      const n = new Set(s)
      visible.forEach(id => allSelected ? n.delete(id) : n.add(id))
      return n
    })
  }
  const clearAll = () => setSelected(new Set())

  const total = selected.size * Number(catalog.price_per_person || 0)

  const submit = async () => {
    setError('')
    if (selected.size === 0) return setError('Хамгийн багадаа 1 ажилтан сонгоно уу')
    setSaving(true)
    try {
      await api.createTrainingOrder({
        catalog_id: catalog.id,
        requested_date: reqDate,
        employee_ids: Array.from(selected),
        note: note || null,
      })
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} size="xl" backdrop="static">
      <CModalHeader>
        <CModalTitle>Сургалтад хамруулах — {catalog.title}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow className="g-3 mb-3">
          <CCol sm={3}>
            <div className="small text-medium-emphasis">Үргэлжлэх</div>
            <div className="fw-semibold">{catalog.duration_hours} цаг</div>
          </CCol>
          <CCol sm={3}>
            <div className="small text-medium-emphasis">Хүчинтэй</div>
            <div className="fw-semibold">{catalog.validity_months} сар</div>
          </CCol>
          <CCol sm={3}>
            <div className="small text-medium-emphasis">Нэг хүнд</div>
            <div className="fw-semibold text-primary">{fmt(catalog.price_per_person)}</div>
          </CCol>
          <CCol sm={3}>
            <CFormLabel className="mb-0 small text-medium-emphasis">Хүсэлтийн огноо</CFormLabel>
            <CFormInput type="date" size="sm" value={reqDate} onChange={e=>setReqDate(e.target.value)} />
          </CCol>
        </CRow>

        {error && <CAlert color="danger" className="py-2 small">{error}</CAlert>}

        <CCard className="mb-2">
          <CCardHeader className="d-flex flex-wrap gap-2 align-items-center">
            <strong className="me-2">Ажилтан сонгох</strong>
            <CBadge color="primary">{selected.size}</CBadge>
            <span className="text-medium-emphasis small ms-2">сонгогдсон</span>
            <div className="ms-auto d-flex gap-2 flex-wrap" style={{maxWidth:'70%'}}>
              <CFormInput size="sm" placeholder="Хайх..." value={search}
                onChange={e=>setSearch(e.target.value)} style={{width:180}} />
              <CFormSelect size="sm" value={deptF} onChange={e=>setDeptF(e.target.value)} style={{width:160}}>
                <option value="">Бүх хэлтэс</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </CFormSelect>
              <CButton size="sm" color="info" variant="outline" onClick={toggleVisible}>
                {filtered.length > 0 && filtered.every(e => selected.has(e.id)) ? 'Хасах' : 'Бүгдийг сонгох'}
              </CButton>
              <CButton size="sm" color="secondary" variant="outline" onClick={clearAll}>Цэвэрлэх</CButton>
            </div>
          </CCardHeader>
          <div style={{maxHeight: 420, overflowY: 'auto'}}>
            {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
              <CTable hover small className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{width:40}}></CTableHeaderCell>
                    <CTableHeaderCell>Код</CTableHeaderCell>
                    <CTableHeaderCell>Нэр</CTableHeaderCell>
                    <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
                    <CTableHeaderCell>Албан тушаал</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filtered.map(e => (
                    <CTableRow key={e.id} onClick={()=>toggleOne(e.id)} style={{cursor:'pointer'}}
                      active={selected.has(e.id)}>
                      <CTableDataCell><CFormCheck checked={selected.has(e.id)} onChange={()=>toggleOne(e.id)} /></CTableDataCell>
                      <CTableDataCell>{e.emp_code}</CTableDataCell>
                      <CTableDataCell className="fw-semibold">{e.last_name} {e.first_name}</CTableDataCell>
                      <CTableDataCell>{e.department_name || '—'}</CTableDataCell>
                      <CTableDataCell>{e.position || '—'}</CTableDataCell>
                    </CTableRow>
                  ))}
                  {filtered.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-medium-emphasis py-3">Ажилтан олдсонгүй</CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            )}
          </div>
        </CCard>

        <div className="mt-3">
          <CFormLabel>Нэмэлт тэмдэглэл</CFormLabel>
          <CFormTextarea rows={2} value={note} onChange={e=>setNote(e.target.value)} />
        </div>
      </CModalBody>
      <CModalFooter className="d-flex justify-content-between align-items-center">
        <div className="fw-semibold fs-5">
          Нийт: <span className="text-primary">{fmt(total)}</span>
          <span className="text-medium-emphasis small ms-2">({selected.size} хүн × {fmt(catalog.price_per_person)})</span>
        </div>
        <div>
          <CButton color="secondary" className="me-2" onClick={onClose}>Болих</CButton>
          <CButton color="primary" onClick={submit} disabled={saving || selected.size === 0}>
            {saving ? <CSpinner size="sm" /> : 'Захиалга илгээх'}
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  )
}

// ── Orders tab ──────────────────────────────────────────────────────
function OrdersTab() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const [detail,  setDetail]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getTrainingOrders({ status: status || undefined, limit: 200 })
      .then(r => setOrders(r.data || [])).finally(()=>setLoading(false))
  }
  useEffect(load, [status])

  const open = (id) => api.getTrainingOrder(id).then(r => setDetail(r.data))
  const cancel = async (id) => {
    if (!window.confirm('Захиалга цуцлах уу?')) return
    await api.cancelTrainingOrder(id); load()
    if (detail?.id === id) open(id)
  }

  return (
    <>
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
                  <CTableHeaderCell>Сургалт</CTableHeaderCell>
                  <CTableHeaderCell>Захиалсан</CTableHeaderCell>
                  <CTableHeaderCell>Товлогдсон</CTableHeaderCell>
                  <CTableHeaderCell>Хамрагдах</CTableHeaderCell>
                  <CTableHeaderCell>Тэнцсэн</CTableHeaderCell>
                  <CTableHeaderCell>Дүн</CTableHeaderCell>
                  <CTableHeaderCell>Төлөв</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {orders.map(o => (
                  <CTableRow key={o.id} style={{cursor:'pointer'}} onClick={()=>open(o.id)}>
                    <CTableDataCell><code>{o.order_number}</code></CTableDataCell>
                    <CTableDataCell className="fw-semibold">{o.title}</CTableDataCell>
                    <CTableDataCell className="small">{dayjs(o.ordered_at).format('YYYY-MM-DD')}</CTableDataCell>
                    <CTableDataCell className="small">{o.scheduled_date ? dayjs(o.scheduled_date).format('YYYY-MM-DD') : '—'}</CTableDataCell>
                    <CTableDataCell>{o.participant_count}</CTableDataCell>
                    <CTableDataCell><CBadge color="success">{o.passed_count}</CBadge></CTableDataCell>
                    <CTableDataCell className="fw-semibold">{fmt(o.total_amount)}</CTableDataCell>
                    <CTableDataCell><CBadge color={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</CBadge></CTableDataCell>
                    <CTableDataCell onClick={e=>e.stopPropagation()}>
                      {(o.status==='pending'||o.status==='scheduled') && (
                        <CButton size="sm" color="danger" variant="outline" onClick={()=>cancel(o.id)}>Цуцлах</CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {orders.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-medium-emphasis py-4">Захиалга алга</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {detail && <OrderDetailModal order={detail} onClose={()=>{ setDetail(null); load() }} onRefresh={()=>open(detail.id)} />}
    </>
  )
}

// ── Order detail with participants management ───────────────────────
function OrderDetailModal({ order, onClose, onRefresh }) {
  const [emps,     setEmps]     = useState([])
  const [addMode,  setAddMode]  = useState(false)
  const [search,   setSearch]   = useState('')
  const [picking,  setPicking]  = useState(new Set())
  const [adding,   setAdding]   = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [bulkSt,   setBulkSt]   = useState('passed')

  useEffect(() => {
    if (addMode) api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data || []))
  }, [addMode])

  const existingIds = new Set(order.participants?.map(p => p.employee_id) || [])
  const candidates = emps.filter(e => !existingIds.has(e.id))
    .filter(e => !search || `${e.last_name} ${e.first_name} ${e.emp_code}`.toLowerCase().includes(search.toLowerCase()))

  const togglePick = (id) => setPicking(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const doAdd = async () => {
    if (picking.size === 0) return
    setAdding(true)
    try {
      await api.addTrainingParticipants(order.id, { employee_ids: Array.from(picking) })
      setAddMode(false); setPicking(new Set()); onRefresh()
    } finally { setAdding(false) }
  }

  const toggleSel = (pid) => setSelected(s => { const n=new Set(s); n.has(pid)?n.delete(pid):n.add(pid); return n })
  const selectAll = () => {
    const ids = order.participants.map(p => p.id)
    const all = ids.length > 0 && ids.every(id => selected.has(id))
    setSelected(all ? new Set() : new Set(ids))
  }
  const bulkUpdate = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`${selected.size} оролцогчийг "${PSTATUS_LABEL[bulkSt]}" болгох уу?`)) return
    await api.bulkUpdateParticipants(order.id, {
      participant_ids: Array.from(selected),
      status: bulkSt,
      completion_date: dayjs().format('YYYY-MM-DD'),
    })
    setSelected(new Set()); onRefresh()
  }

  const removeOne = async (pid) => {
    if (!window.confirm('Хасах уу?')) return
    await api.removeTrainingParticipant(order.id, pid); onRefresh()
  }

  const canManage = order.status !== 'cancelled' && order.status !== 'completed'

  return (
    <CModal visible={true} onClose={onClose} size="xl" backdrop="static">
      <CModalHeader>
        <CModalTitle>{order.order_number} — {order.title}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow className="g-2 mb-3">
          <CCol sm={3}><div className="small text-medium-emphasis">Төлөв</div>
            <CBadge color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</CBadge></CCol>
          <CCol sm={3}><div className="small text-medium-emphasis">Товлогдсон</div>
            <div>{order.scheduled_date ? dayjs(order.scheduled_date).format('YYYY-MM-DD') : '—'}</div></CCol>
          <CCol sm={3}><div className="small text-medium-emphasis">Багш</div>
            <div>{order.trainer_name || '—'}</div></CCol>
          <CCol sm={3}><div className="small text-medium-emphasis">Нийт</div>
            <div className="fw-bold text-primary">{fmt(order.total_amount)}</div></CCol>
        </CRow>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <strong>Оролцогчид ({order.participants?.length || 0})</strong>
            {canManage && !addMode && (
              <div className="d-flex gap-2 align-items-center">
                {selected.size > 0 && (
                  <>
                    <CFormSelect size="sm" value={bulkSt} onChange={e=>setBulkSt(e.target.value)} style={{width:160}}>
                      {Object.entries(PSTATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                    </CFormSelect>
                    <CButton size="sm" color="success" onClick={bulkUpdate}>Бөөнөөр өөрчлөх ({selected.size})</CButton>
                  </>
                )}
                <CButton size="sm" color="primary" onClick={()=>setAddMode(true)}>+ Ажилтан нэмэх</CButton>
              </div>
            )}
          </CCardHeader>
          <div style={{maxHeight: 400, overflowY:'auto'}}>
            {addMode ? (
              <>
                <div className="p-2 d-flex gap-2 align-items-center bg-body-tertiary">
                  <CFormInput size="sm" placeholder="Хайх..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:300}} />
                  <CBadge color="primary">{picking.size}</CBadge> сонгогдсон
                  <div className="ms-auto">
                    <CButton size="sm" color="secondary" variant="outline" className="me-2" onClick={()=>{ setAddMode(false); setPicking(new Set()) }}>Болих</CButton>
                    <CButton size="sm" color="primary" onClick={doAdd} disabled={picking.size===0||adding}>
                      {adding ? <CSpinner size="sm" /> : `Нэмэх (${picking.size})`}
                    </CButton>
                  </div>
                </div>
                <CTable hover small className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{width:40}}></CTableHeaderCell>
                      <CTableHeaderCell>Код</CTableHeaderCell>
                      <CTableHeaderCell>Нэр</CTableHeaderCell>
                      <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {candidates.map(e => (
                      <CTableRow key={e.id} onClick={()=>togglePick(e.id)} style={{cursor:'pointer'}} active={picking.has(e.id)}>
                        <CTableDataCell><CFormCheck checked={picking.has(e.id)} onChange={()=>togglePick(e.id)} /></CTableDataCell>
                        <CTableDataCell>{e.emp_code}</CTableDataCell>
                        <CTableDataCell>{e.last_name} {e.first_name}</CTableDataCell>
                        <CTableDataCell>{e.department_name || '—'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            ) : (
              <CTable hover small className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{width:40}}>
                      {canManage && <CFormCheck checked={(order.participants?.length || 0) > 0 && order.participants.every(p => selected.has(p.id))} onChange={selectAll} />}
                    </CTableHeaderCell>
                    <CTableHeaderCell>Код</CTableHeaderCell>
                    <CTableHeaderCell>Нэр</CTableHeaderCell>
                    <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
                    <CTableHeaderCell>Албан тушаал</CTableHeaderCell>
                    <CTableHeaderCell>Төлөв</CTableHeaderCell>
                    <CTableHeaderCell>Хүчинтэй</CTableHeaderCell>
                    <CTableHeaderCell></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {order.participants?.map(p => (
                    <CTableRow key={p.id} active={selected.has(p.id)}>
                      <CTableDataCell>
                        {canManage && <CFormCheck checked={selected.has(p.id)} onChange={()=>toggleSel(p.id)} />}
                      </CTableDataCell>
                      <CTableDataCell>{p.emp_code}</CTableDataCell>
                      <CTableDataCell className="fw-semibold">{p.full_name}</CTableDataCell>
                      <CTableDataCell>{p.department || '—'}</CTableDataCell>
                      <CTableDataCell>{p.position || '—'}</CTableDataCell>
                      <CTableDataCell><CBadge color={PSTATUS_COLOR[p.status]}>{PSTATUS_LABEL[p.status]}</CBadge></CTableDataCell>
                      <CTableDataCell className="small">{p.expiry_date ? dayjs(p.expiry_date).format('YYYY-MM-DD') : '—'}</CTableDataCell>
                      <CTableDataCell>
                        {canManage && order.status === 'pending' && (
                          <CButton size="sm" color="danger" variant="outline" onClick={()=>removeOne(p.id)}>X</CButton>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  {(!order.participants || order.participants.length===0) && (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center text-medium-emphasis py-4">Оролцогч алга</CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            )}
          </div>
        </CCard>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Хаах</CButton>
      </CModalFooter>
    </CModal>
  )
}
