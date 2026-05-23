import React, { useEffect, useState, useCallback } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CNav, CNavItem, CNavLink,
  CTabContent, CTabPane, CRow, CCol, CFormInput, CFormSelect, CFormLabel,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CForm,
} from '@coreui/react'
import { useSelector } from 'react-redux'
import api from 'src/services/api'
import dayjs from 'dayjs'

export default function Ppe() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tab,        setTab]        = useState('items')
  const [categories, setCategories] = useState([])
  const [items,      setItems]      = useState([])
  const [checks,     setChecks]     = useState([])
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [modal,      setModal]      = useState(null) // 'category'|'item'
  const [form,       setForm]       = useState({})
  const [editing,    setEditing]    = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const [dateFrom,   setDateFrom]   = useState(dayjs().subtract(7,'day').format('YYYY-MM-DD'))
  const [dateTo,     setDateTo]     = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    loadCategories()
    loadItems()
  }, [])

  useEffect(() => { if (tab === 'checks') loadChecks() }, [tab, dateFrom, dateTo, currentProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = () => api.getPpeCategories().then(r => setCategories(r.data || []))
  const loadItems      = () => api.getPpeItems().then(r => setItems(r.data || []))
  const loadChecks     = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getPpeChecks({ date_from: dateFrom, date_to: dateTo, project_id: currentProjectId || undefined, limit: 500 }),
      api.getPpeCheckStats({ date_from: dateFrom, date_to: dateTo }),
    ]).then(([c, s]) => { setChecks(c.data || []); setStats(s.data) }).finally(() => setLoading(false))
  }, [dateFrom, dateTo, currentProjectId])

  const openCategory = (r) => {
    setEditing(r?.id || null)
    setForm(r ? { name: r.name, description: r.description || '' } : { name: '', description: '' })
    setModal('category')
  }
  const openItem = (r) => {
    setEditing(r?.id || null)
    setForm(r
      ? { name: r.name, category_id: r.category_id || '', unit: r.unit || '', reorder_level: r.reorder_level || '' }
      : { name: '', category_id: '', unit: '', reorder_level: '' })
    setModal('item')
  }
  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'category') {
        editing ? await api.updatePpeCategory(editing, form) : await api.createPpeCategory(form)
        loadCategories()
      } else {
        editing ? await api.updatePpeItem(editing, form) : await api.createPpeItem(form)
        loadItems()
      }
      setModal(null)
    } finally { setSaving(false) }
  }
  const removeCategory = async (id) => {
    if (!window.confirm('Устгах уу?')) return
    setDeleting(id)
    try { await api.deletePpeCategory(id); loadCategories() } finally { setDeleting(null) }
  }

  const statusColor = (qty, reorder) => {
    if (!reorder) return 'secondary'
    return qty <= 0 ? 'danger' : qty <= reorder ? 'warning' : 'success'
  }
  const statusLabel = (qty, reorder) => {
    if (!reorder) return 'Тодорхойгүй'
    return qty <= 0 ? 'Дуссан' : qty <= reorder ? 'Бага' : 'Хангалттай'
  }

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">PPE — Хувийн хамгаалах хэрэгсэл</h4>
      <CNav variant="tabs" className="mb-3">
        {[['items','Хэрэгслүүд'],['categories','Ангилал'],['checks','Шалгалтын лог']].map(([k,l]) => (
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={() => setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        {/* Items */}
        <CTabPane visible={tab==='items'}>
          <div className="d-flex justify-content-end mb-2">
            <CButton color="primary" onClick={() => openItem(null)}>+ Хэрэгсэл нэмэх</CButton>
          </div>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Нэр</CTableHeaderCell>
                <CTableHeaderCell>Ангилал</CTableHeaderCell>
                <CTableHeaderCell>Нэгж</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Үлдэгдэл</CTableHeaderCell>
                <CTableHeaderCell>Нөөц</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {items.map(r => (
                <CTableRow key={r.id}>
                  <CTableDataCell className="fw-semibold">{r.name}</CTableDataCell>
                  <CTableDataCell>{r.category_name || '—'}</CTableDataCell>
                  <CTableDataCell>{r.unit || '—'}</CTableDataCell>
                  <CTableDataCell className="text-end fw-bold">{r.stock_quantity ?? 0}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={statusColor(r.stock_quantity, r.reorder_level)}>
                      {statusLabel(r.stock_quantity, r.reorder_level)}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" color="primary" variant="outline" onClick={() => openItem(r)}>Засах</CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CTabPane>

        {/* Categories */}
        <CTabPane visible={tab==='categories'}>
          <div className="d-flex justify-content-end mb-2">
            <CButton color="primary" onClick={() => openCategory(null)}>+ Ангилал нэмэх</CButton>
          </div>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Нэр</CTableHeaderCell>
                <CTableHeaderCell>Тайлбар</CTableHeaderCell>
                <CTableHeaderCell></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {categories.map((r, i) => (
                <CTableRow key={r.id}>
                  <CTableDataCell>{i + 1}</CTableDataCell>
                  <CTableDataCell className="fw-semibold">{r.name}</CTableDataCell>
                  <CTableDataCell>{r.description || '—'}</CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={() => openCategory(r)}>Засах</CButton>
                    <CButton size="sm" color="danger" variant="outline" onClick={() => removeCategory(r.id)}
                      disabled={deleting === r.id}>
                      {deleting === r.id ? <CSpinner size="sm" /> : 'Устгах'}
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CTabPane>

        {/* Checks */}
        <CTabPane visible={tab==='checks'}>
          <CRow className="g-2 mb-3 align-items-end">
            <CCol sm={3}><CFormLabel className="mb-1">Эхний огноо</CFormLabel>
              <CFormInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></CCol>
            <CCol sm={3}><CFormLabel className="mb-1">Эцсийн огноо</CFormLabel>
              <CFormInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></CCol>
            <CCol sm={2}><CButton color="primary" onClick={loadChecks}>Хайх</CButton></CCol>
          </CRow>

          {stats && (
            <CRow className="g-2 mb-3">
              {[
                ['Нийт шалгалт', stats.total_checks || 0],
                ['Тэнцсэн', stats.passed || 0],
                ['Тэнцээгүй', stats.failed || 0],
              ].map(([l, v]) => (
                <CCol key={l} xs={6} sm={3}>
                  <CCard><CCardBody className="py-2 text-center">
                    <div className="small text-medium-emphasis">{l}</div>
                    <div className="fw-bold fs-5">{v ?? 0}</div>
                  </CCardBody></CCard>
                </CCol>
              ))}
            </CRow>
          )}

          {loading ? <CSpinner /> : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Цаг</CTableHeaderCell>
                  <CTableHeaderCell>Ажилтан</CTableHeaderCell>
                  <CTableHeaderCell>Хэрэгсэл</CTableHeaderCell>
                  <CTableHeaderCell>Бүс</CTableHeaderCell>
                  <CTableHeaderCell>Үр дүн</CTableHeaderCell>
                  <CTableHeaderCell>Тайлбар</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {checks.map((r, i) => (
                  <CTableRow key={i}>
                    <CTableDataCell>{r.checked_at ? dayjs(r.checked_at).format('MM-DD HH:mm') : '—'}</CTableDataCell>
                    <CTableDataCell>{r.full_name || '—'}</CTableDataCell>
                    <CTableDataCell>{r.item_name || '—'}</CTableDataCell>
                    <CTableDataCell>{r.zone || '—'}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={r.result === 'pass' ? 'success' : 'danger'}>
                        {r.result === 'pass' ? 'Тэнцсэн' : 'Тэнцээгүй'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{r.notes || '—'}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CTabPane>
      </CTabContent>

      {/* Category modal */}
      <CModal visible={modal === 'category'} onClose={() => setModal(null)}>
        <CModalHeader><CModalTitle>{editing ? 'Ангилал засах' : 'Ангилал нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}><CFormLabel>Нэр <span className="text-danger">*</span></CFormLabel>
              <CFormInput value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Тайлбар</CFormLabel>
              <CFormInput value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(null)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>{saving ? <CSpinner size="sm" /> : 'Хадгалах'}</CButton>
        </CModalFooter>
      </CModal>

      {/* Item modal */}
      <CModal visible={modal === 'item'} onClose={() => setModal(null)}>
        <CModalHeader><CModalTitle>{editing ? 'Хэрэгсэл засах' : 'Хэрэгсэл нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}><CFormLabel>Нэр <span className="text-danger">*</span></CFormLabel>
              <CFormInput value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Ангилал</CFormLabel>
              <CFormSelect value={form.category_id || ''} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}><CFormLabel>Нэгж</CFormLabel>
              <CFormInput value={form.unit || ''} onChange={e => setForm(f => ({...f, unit: e.target.value}))} placeholder="ш, пар, иж..." /></CCol>
            <CCol sm={6}><CFormLabel>Нөөцийн хязгаар</CFormLabel>
              <CFormInput type="number" value={form.reorder_level || ''} onChange={e => setForm(f => ({...f, reorder_level: e.target.value}))} /></CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(null)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>{saving ? <CSpinner size="sm" /> : 'Хадгалах'}</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
