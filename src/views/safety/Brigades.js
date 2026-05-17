import React, { useEffect, useState, useMemo } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormTextarea, CFormCheck,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CAlert,
} from '@coreui/react'
import api from 'src/services/api'
import dayjs from 'dayjs'

const SPECIALTIES = ['Мужаан','Арматурчин','Цутгалт','Гагнуурчин','Цахилгаанчин','Сантехникч','Тоосго','Шавардлага','Будаг','Хучилт','Бусад']
const fmt = n => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function Brigades() {
  const [stats,    setStats]    = useState(null)
  const [list,     setList]     = useState([])
  const [emps,     setEmps]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [specF,    setSpecF]    = useState('')
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [detail,   setDetail]   = useState(null)
  const load = () => {
    setLoading(true)
    Promise.all([
      api.getBrigades({ search: search || undefined, specialty: specF || undefined }),
      api.getBrigadeStats(),
    ]).then(([l, s]) => { setList(l.data || []); setStats(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data || []))
    load()
  }, [])
  useEffect(load, [specF])

  const openCreate = () => { setEditing(null); setModal(true) }
  const openEdit   = (b) => { setEditing(b); setModal(true) }
  const remove = async (id) => {
    if (!window.confirm('Бригадыг устгах уу? (бүх гэрээ хамт устгагдана)')) return
    await api.deleteBrigade(id); load()
  }
  const openDetail = (id) => api.getBrigade(id).then(r => setDetail(r.data))

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Бригадууд</h4>
        <CButton color="primary" onClick={openCreate}>+ Бригад нэмэх</CButton>
      </div>

      {stats && (
        <CRow className="g-2 mb-3">
          {[['Идэвхтэй бригад', stats.active_brigades, 'primary'],
            ['Гадны бригад', stats.external_brigades, 'info'],
            ['Идэвхтэй гэрээ', stats.open_contracts, 'warning'],
            ['Үлдсэн өглөг', fmt(stats.outstanding), 'danger'],
            ['Сүүлийн 30 хоног төлсөн', fmt(stats.paid_30d), 'success']].map(([l,v,c]) => (
            <CCol key={l} xs={6} sm={2}>
              <CCard><CCardBody className="py-2 text-center">
                <div className="small text-medium-emphasis">{l}</div>
                <div className={`fw-bold fs-5 text-${c}`}>{v ?? 0}</div>
              </CCardBody></CCard>
            </CCol>
          ))}
        </CRow>
      )}

      <CCard>
        <CCardHeader>
          <CRow className="g-2">
            <CCol sm={4}>
              <CFormInput placeholder="Хайх..." value={search}
                onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} />
            </CCol>
            <CCol sm={3}>
              <CFormSelect value={specF} onChange={e=>setSpecF(e.target.value)}>
                <option value="">Бүх мэргэжил</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={2}><CButton color="secondary" variant="outline" onClick={load}>Хайх</CButton></CCol>
          </CRow>
        </CCardHeader>
        <CCardBody className="p-0">
          {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Нэр</CTableHeaderCell>
                  <CTableHeaderCell>Мэргэжил</CTableHeaderCell>
                  <CTableHeaderCell>Төрөл</CTableHeaderCell>
                  <CTableHeaderCell>Ахлагч</CTableHeaderCell>
                  <CTableHeaderCell>Гишүүд</CTableHeaderCell>
                  <CTableHeaderCell>Гэрээ</CTableHeaderCell>
                  <CTableHeaderCell>Нийт дүн</CTableHeaderCell>
                  <CTableHeaderCell>Төлсөн</CTableHeaderCell>
                  <CTableHeaderCell>Статус</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {list.map(b => (
                  <CTableRow key={b.id} style={{cursor:'pointer'}} onClick={() => openDetail(b.id)}>
                    <CTableDataCell className="fw-semibold">{b.name}</CTableDataCell>
                    <CTableDataCell>{b.specialty || '—'}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={b.is_external ? 'info' : 'primary'}>
                        {b.is_external ? 'Гадны' : 'Дотоод'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div>{b.leader_name || '—'}</div>
                      {b.leader_code && <small className="text-medium-emphasis">{b.leader_code}</small>}
                    </CTableDataCell>
                    <CTableDataCell>{b.is_external ? '—' : b.member_count}</CTableDataCell>
                    <CTableDataCell>{b.contract_count}</CTableDataCell>
                    <CTableDataCell>{fmt(b.total_value)}</CTableDataCell>
                    <CTableDataCell>
                      <span className="text-success">{fmt(b.total_paid)}</span>
                      {Number(b.total_value)-Number(b.total_paid) > 0 && (
                        <div className="small text-danger">үлд {fmt(Number(b.total_value)-Number(b.total_paid))}</div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={b.is_active?'success':'secondary'}>{b.is_active?'Идэвхтэй':'Хаагдсан'}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell onClick={e=>e.stopPropagation()}>
                      <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={()=>openEdit(b)}>Засах</CButton>
                      <CButton size="sm" color="danger" variant="outline" onClick={()=>remove(b.id)}>X</CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {list.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center text-medium-emphasis py-4">Бригад алга</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {modal && <BrigadeForm editing={editing} emps={emps}
        onClose={()=>setModal(false)} onSaved={()=>{ setModal(false); load() }} />}

      {detail && <BrigadeDetailModal brigade={detail} emps={emps}
        onClose={()=>setDetail(null)} onRefresh={()=>openDetail(detail.id)} onListRefresh={load} />}
    </div>
  )
}

// ── Create/edit form ─────────────────────────────────────────────────
function BrigadeForm({ editing, emps, onClose, onSaved }) {
  const [form, setForm] = useState(editing ? {
    name: editing.name, specialty: editing.specialty || '',
    is_external: editing.is_external, leader_id: editing.leader_id || '',
    external_leader_name: editing.external_leader_name || '',
    external_phone: editing.external_phone || '',
    notes: editing.notes || '', is_active: editing.is_active,
  } : {
    name:'', specialty:'', is_external:false, leader_id:'',
    external_leader_name:'', external_phone:'', notes:'', is_active:true,
  })
  const [memberIds, setMemberIds] = useState(new Set())
  const [memberSearch, setMemberSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const filtered = emps.filter(e =>
    !memberSearch || `${e.last_name} ${e.first_name} ${e.emp_code}`.toLowerCase().includes(memberSearch.toLowerCase())
  )
  const toggleMember = (id) => setMemberIds(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })

  const save = async () => {
    setError('')
    if (!form.name) return setError('Нэр шаардлагатай')
    if (form.is_external && !form.external_leader_name) return setError('Ахлагчийн нэр шаардлагатай')
    if (!form.is_external && !form.leader_id) return setError('Ахлагч сонгоно уу')

    setSaving(true)
    try {
      if (editing) {
        await api.updateBrigade(editing.id, form)
      } else {
        await api.createBrigade({ ...form, member_ids: Array.from(memberIds) })
      }
      onSaved()
    } catch (e) { setError(e.response?.data?.message || 'Алдаа гарлаа') }
    finally { setSaving(false) }
  }

  return (
    <CModal visible={true} onClose={onClose} size="lg" backdrop="static">
      <CModalHeader><CModalTitle>{editing?'Бригад засах':'Бригад нэмэх'}</CModalTitle></CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger" className="py-2 small">{error}</CAlert>}
        <CForm><CRow className="g-3">
          <CCol sm={6}><CFormLabel>Нэр *</CFormLabel>
            <CFormInput value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></CCol>
          <CCol sm={6}><CFormLabel>Мэргэжил</CFormLabel>
            <CFormSelect value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))}>
              <option value="">-- Сонгох --</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </CFormSelect></CCol>
          <CCol sm={12}>
            <CFormCheck label="Гадны (хөлсний) бригад" checked={form.is_external}
              onChange={e=>setForm(f=>({...f,is_external:e.target.checked,leader_id:''}))} />
          </CCol>

          {form.is_external ? (<>
            <CCol sm={6}><CFormLabel>Ахлагчийн нэр *</CFormLabel>
              <CFormInput value={form.external_leader_name}
                onChange={e=>setForm(f=>({...f,external_leader_name:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Утас</CFormLabel>
              <CFormInput value={form.external_phone}
                onChange={e=>setForm(f=>({...f,external_phone:e.target.value}))} /></CCol>
          </>) : (
            <CCol sm={12}><CFormLabel>Бригадын ахлагч *</CFormLabel>
              <CFormSelect value={form.leader_id} onChange={e=>setForm(f=>({...f,leader_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name} ({e.position||'—'})</option>)}
              </CFormSelect>
            </CCol>
          )}

          <CCol sm={12}><CFormLabel>Тэмдэглэл</CFormLabel>
            <CFormTextarea rows={2} value={form.notes}
              onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></CCol>

          {editing && (
            <CCol sm={12}>
              <CFormCheck label="Идэвхтэй" checked={form.is_active}
                onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} />
            </CCol>
          )}

          {!editing && !form.is_external && (
            <CCol sm={12}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Гишүүн сонгох</strong> <CBadge color="primary" className="ms-2">{memberIds.size}</CBadge>
                  </div>
                  <CFormInput size="sm" placeholder="Хайх..." value={memberSearch}
                    onChange={e=>setMemberSearch(e.target.value)} style={{maxWidth:200}} />
                </CCardHeader>
                <div style={{maxHeight:240, overflowY:'auto'}}>
                  <CTable small hover className="mb-0">
                    <CTableBody>
                      {filtered.slice(0, 100).map(e => (
                        <CTableRow key={e.id} active={memberIds.has(e.id)} onClick={()=>toggleMember(e.id)} style={{cursor:'pointer'}}>
                          <CTableDataCell style={{width:40}}><CFormCheck checked={memberIds.has(e.id)} onChange={()=>toggleMember(e.id)} /></CTableDataCell>
                          <CTableDataCell>{e.emp_code}</CTableDataCell>
                          <CTableDataCell>{e.last_name} {e.first_name}</CTableDataCell>
                          <CTableDataCell className="text-medium-emphasis">{e.position||'—'}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              </CCard>
            </CCol>
          )}
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

// ── Brigade detail with members ──────────────────────────────────────
function BrigadeDetailModal({ brigade, emps, onClose, onRefresh, onListRefresh }) {
  const [addMode, setAddMode] = useState(false)
  const [pick,    setPick]    = useState(new Set())
  const [search,  setSearch]  = useState('')
  const [adding,  setAdding]  = useState(false)

  const existingIds = new Set((brigade.members||[]).filter(m=>!m.left_at).map(m => m.employee_id))
  const candidates = emps.filter(e => !existingIds.has(e.id))
    .filter(e => !search || `${e.last_name} ${e.first_name} ${e.emp_code}`.toLowerCase().includes(search.toLowerCase()))

  const toggle = (id) => setPick(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const doAdd = async () => {
    setAdding(true)
    try {
      await api.addBrigadeMembers(brigade.id, { employee_ids: Array.from(pick) })
      setAddMode(false); setPick(new Set()); onRefresh(); onListRefresh()
    } finally { setAdding(false) }
  }
  const removeMember = async (mid) => {
    if (!window.confirm('Бригадаас хасах уу?')) return
    await api.removeBrigadeMember(mid); onRefresh(); onListRefresh()
  }

  const activeMembers = (brigade.members||[]).filter(m => !m.left_at)

  return (
    <CModal visible={true} onClose={onClose} size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>{brigade.name} {brigade.is_external && <CBadge color="info" className="ms-2">Гадны</CBadge>}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow className="g-2 mb-3">
          <CCol sm={4}><div className="small text-medium-emphasis">Мэргэжил</div><div>{brigade.specialty||'—'}</div></CCol>
          <CCol sm={4}><div className="small text-medium-emphasis">Ахлагч</div><div className="fw-semibold">{brigade.leader_name||'—'}</div></CCol>
          <CCol sm={4}><div className="small text-medium-emphasis">{brigade.is_external?'Утас':'Ахлагчийн код'}</div>
            <div>{brigade.is_external ? brigade.external_phone : brigade.leader_code}</div></CCol>
        </CRow>
        {brigade.notes && <div className="alert alert-secondary py-2 mb-3 small">{brigade.notes}</div>}

        {!brigade.is_external && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Гишүүд ({activeMembers.length})</strong>
              {!addMode && <CButton size="sm" color="primary" onClick={()=>setAddMode(true)}>+ Гишүүн нэмэх</CButton>}
            </CCardHeader>
            <div style={{maxHeight:360, overflowY:'auto'}}>
              {addMode ? (<>
                <div className="p-2 d-flex gap-2 align-items-center bg-body-tertiary">
                  <CFormInput size="sm" placeholder="Хайх..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:240}} />
                  <CBadge color="primary">{pick.size}</CBadge>
                  <div className="ms-auto">
                    <CButton size="sm" color="secondary" variant="outline" className="me-2" onClick={()=>{setAddMode(false); setPick(new Set())}}>Болих</CButton>
                    <CButton size="sm" color="primary" onClick={doAdd} disabled={pick.size===0||adding}>
                      {adding?<CSpinner size="sm"/>:`Нэмэх (${pick.size})`}
                    </CButton>
                  </div>
                </div>
                <CTable small hover className="mb-0">
                  <CTableBody>
                    {candidates.map(e => (
                      <CTableRow key={e.id} onClick={()=>toggle(e.id)} style={{cursor:'pointer'}} active={pick.has(e.id)}>
                        <CTableDataCell style={{width:40}}><CFormCheck checked={pick.has(e.id)} onChange={()=>toggle(e.id)} /></CTableDataCell>
                        <CTableDataCell>{e.emp_code}</CTableDataCell>
                        <CTableDataCell>{e.last_name} {e.first_name}</CTableDataCell>
                        <CTableDataCell className="text-medium-emphasis">{e.position||'—'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>) : (
                <CTable small hover className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Код</CTableHeaderCell>
                      <CTableHeaderCell>Нэр</CTableHeaderCell>
                      <CTableHeaderCell>Хэлтэс</CTableHeaderCell>
                      <CTableHeaderCell>Албан тушаал</CTableHeaderCell>
                      <CTableHeaderCell>Орсон</CTableHeaderCell>
                      <CTableHeaderCell></CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {activeMembers.map(m => (
                      <CTableRow key={m.id}>
                        <CTableDataCell>{m.emp_code}</CTableDataCell>
                        <CTableDataCell className="fw-semibold">{m.full_name}</CTableDataCell>
                        <CTableDataCell>{m.department||'—'}</CTableDataCell>
                        <CTableDataCell>{m.position||'—'}</CTableDataCell>
                        <CTableDataCell className="small">{m.joined_at ? dayjs(m.joined_at).format('YYYY-MM-DD') : '—'}</CTableDataCell>
                        <CTableDataCell><CButton size="sm" color="danger" variant="outline" onClick={()=>removeMember(m.id)}>X</CButton></CTableDataCell>
                      </CTableRow>
                    ))}
                    {activeMembers.length===0 && (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center text-medium-emphasis py-3">Гишүүн алга</CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              )}
            </div>
          </CCard>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Хаах</CButton>
      </CModalFooter>
    </CModal>
  )
}
