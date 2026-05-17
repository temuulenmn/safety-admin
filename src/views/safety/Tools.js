import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CNav, CNavItem, CNavLink,
  CTabContent, CTabPane,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = { available:'success', checked_out:'warning', lost:'danger', damaged:'secondary' }
const STATUS_LABEL = { available:'Бэлэн', checked_out:'Авагдсан', lost:'Алдсан', damaged:'Эвдрэлтэй' }

export default function Tools() {
  const gridTheme = useGridTheme()
  const [tab,      setTab]     = useState('inventory')
  const [stats,    setStats]   = useState(null)
  const [emps,     setEmps]    = useState([])
  const toolsRef = useRef(), coRef = useRef()

  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [coStatus, setCoStatus] = useState('open')

  // Modal: create/edit tool
  const [tModal,   setTModal]   = useState(false)
  const [tForm,    setTForm]    = useState({ code:'', name:'', rfid_tag:'', category:'', storekeeper_id:'' })
  const [tEditing, setTEditing] = useState(null)
  const [tSaving,  setTSaving]  = useState(false)

  // Modal: checkout
  const [coModal,  setCoModal]  = useState(false)
  const [coForm,   setCoForm]   = useState({ tool_id:'', employee_id:'', storekeeper_id:'' })
  const [coSaving, setCoSaving] = useState(false)

  useEffect(() => {
    api.getToolStats().then(r => setStats(r.data))
    api.getEmployees({ status:'active', limit:500 }).then(r => setEmps(r.data || []))
  }, [])

  const refreshTools = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit }) =>
      api.getTools({ page, limit, search: search || undefined, status: statusF || undefined }))
    toolsRef.current?.api?.setGridOption('datasource', ds)
  }, [search, statusF])
  const refreshCheckouts = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit }) =>
      api.getCheckouts({ page, limit, status: coStatus || undefined }))
    coRef.current?.api?.setGridOption('datasource', ds)
  }, [coStatus])
  useEffect(() => { if (tab==='inventory') refreshTools() }, [tab, refreshTools])
  useEffect(() => { if (tab==='checkouts') refreshCheckouts() }, [tab, refreshCheckouts])

  const openCreate = () => { setTEditing(null); setTForm({ code:'', name:'', rfid_tag:'', category:'', storekeeper_id:'' }); setTModal(true) }
  const openEdit   = (r) => {
    setTEditing(r.id)
    setTForm({ code:r.code, name:r.name, rfid_tag:r.rfid_tag, category:r.category||'', storekeeper_id:r.storekeeper_id||'' })
    setTModal(true)
  }
  const saveTool = async () => {
    setTSaving(true)
    try {
      const payload = { ...tForm, storekeeper_id: tForm.storekeeper_id || null }
      tEditing ? await api.updateTool(tEditing, payload) : await api.createTool(payload)
      setTModal(false); refreshTools(); api.getToolStats().then(r=>setStats(r.data))
    } finally { setTSaving(false) }
  }

  const openCheckout = () => { setCoForm({ tool_id:'', employee_id:'', storekeeper_id:'' }); setCoModal(true) }
  const saveCheckout = async () => {
    setCoSaving(true)
    try {
      await api.checkoutTool({ ...coForm, storekeeper_id: coForm.storekeeper_id || null })
      setCoModal(false); refreshCheckouts(); refreshTools()
      api.getToolStats().then(r=>setStats(r.data))
    } finally { setCoSaving(false) }
  }
  const returnTool = async (id) => {
    if (!window.confirm('Багажийг буцаасан гэж тэмдэглэх үү?')) return
    await api.returnTool(id, {})
    refreshCheckouts(); refreshTools(); api.getToolStats().then(r=>setStats(r.data))
  }

  const toolCols = [
    { field:'code', headerName:'Код', width:120 },
    { field:'name', headerName:'Нэр', flex:1 },
    { field:'category', headerName:'Ангилал', width:130 },
    { field:'rfid_tag', headerName:'RFID', width:160, cellRenderer: p => <code>{p.value}</code> },
    { field:'storekeeper_name', headerName:'Нярав', width:160 },
    { field:'status', headerName:'Төлөв', width:130,
      cellRenderer: p => <CBadge color={STATUS_COLOR[p.value]||'secondary'}>{STATUS_LABEL[p.value]||p.value}</CBadge> },
    { field:'current_holder', headerName:'Авсан хүн', flex:1,
      valueGetter: p => p.data?.current_holder?.employee_name || '—' },
    { headerName:'Үйлдэл', width:100, sortable:false,
      cellRenderer: p => <CButton size="sm" color="primary" variant="outline" onClick={()=>openEdit(p.data)}>Засах</CButton> },
  ]

  const coCols = [
    { field:'checked_out_at', headerName:'Авсан', width:150,
      valueFormatter: p => p.value ? dayjs(p.value).format('MM-DD HH:mm') : '' },
    { field:'tool_code', headerName:'Багаж', width:120 },
    { field:'tool_name', headerName:'', flex:1 },
    { field:'emp_code', headerName:'Код', width:90 },
    { field:'full_name', headerName:'Авсан хүн', flex:1 },
    { field:'storekeeper_name', headerName:'Нярав', width:140 },
    { field:'returned_at', headerName:'Буцаасан', width:150,
      valueFormatter: p => p.value ? dayjs(p.value).format('MM-DD HH:mm') : '—' },
    { headerName:'Үйлдэл', width:100, sortable:false,
      cellRenderer: p => p.data?.returned_at
        ? <CBadge color="success">Буцаагдсан</CBadge>
        : <CButton size="sm" color="success" variant="outline" onClick={()=>returnTool(p.data.id)}>Буцаах</CButton> },
  ]

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Багаж хэрэгсэл</h4>
        <div>
          <CButton color="success" className="me-2" onClick={openCheckout}>+ Багаж олгох</CButton>
          <CButton color="primary" onClick={openCreate}>+ Багаж нэмэх</CButton>
        </div>
      </div>

      {stats && (
        <CRow className="g-2 mb-3">
          {[['Нийт', stats.total,'primary'],['Бэлэн', stats.available,'success'],
            ['Авагдсан', stats.checked_out,'warning'],['Алдсан', stats.lost,'danger'],
            ['Эвдрэлтэй', stats.damaged,'secondary']].map(([l,v,c]) => (
            <CCol key={l} xs={6} sm={2}>
              <CCard><CCardBody className="py-2 text-center">
                <div className="small text-medium-emphasis">{l}</div>
                <div className={`fw-bold fs-4 text-${c}`}>{v ?? 0}</div>
              </CCardBody></CCard>
            </CCol>
          ))}
        </CRow>
      )}

      <CNav variant="tabs" className="mb-3">
        {[['inventory','Багажийн жагсаалт'],['checkouts','Олголт/Буцаалт']].map(([k,l]) => (
          <CNavItem key={k}>
            <CNavLink active={tab===k} onClick={()=>setTab(k)} style={{cursor:'pointer'}}>{l}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CTabContent>
        <CTabPane visible={tab==='inventory'}>
          <CCard>
            <CCardHeader>
              <CRow className="g-2">
                <CCol sm={4}><CFormInput placeholder="Хайх..." value={search}
                  onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&refreshTools()} /></CCol>
                <CCol sm={3}>
                  <CFormSelect value={statusF} onChange={e=>setStatusF(e.target.value)}>
                    <option value="">Бүх төлөв</option>
                    {Object.entries(STATUS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
                  </CFormSelect>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody className="p-0">
              <div style={{ height: 540, width:'100%' }}>
                <AgGridReact ref={toolsRef} theme={gridTheme} rowModelType="infinite"
                  columnDefs={toolCols} defaultColDef={defaultColDef} cacheBlockSize={25}
                  onGridReady={refreshTools} />
              </div>
            </CCardBody>
          </CCard>
        </CTabPane>

        <CTabPane visible={tab==='checkouts'}>
          <CCard>
            <CCardHeader>
              <CRow className="g-2">
                <CCol sm={3}>
                  <CFormSelect value={coStatus} onChange={e=>setCoStatus(e.target.value)}>
                    <option value="open">Идэвхтэй</option>
                    <option value="closed">Буцаагдсан</option>
                    <option value="">Бүгд</option>
                  </CFormSelect>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody className="p-0">
              <div style={{ height: 540, width:'100%' }}>
                <AgGridReact ref={coRef} theme={gridTheme} rowModelType="infinite"
                  columnDefs={coCols} defaultColDef={defaultColDef} cacheBlockSize={25}
                  onGridReady={refreshCheckouts} />
              </div>
            </CCardBody>
          </CCard>
        </CTabPane>
      </CTabContent>

      {/* Tool create/edit modal */}
      <CModal visible={tModal} onClose={()=>setTModal(false)}>
        <CModalHeader><CModalTitle>{tEditing?'Багаж засах':'Багаж нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={6}><CFormLabel>Код *</CFormLabel>
              <CFormInput value={tForm.code} onChange={e=>setTForm(f=>({...f,code:e.target.value}))} /></CCol>
            <CCol sm={6}><CFormLabel>Ангилал</CFormLabel>
              <CFormInput value={tForm.category} onChange={e=>setTForm(f=>({...f,category:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Нэр *</CFormLabel>
              <CFormInput value={tForm.name} onChange={e=>setTForm(f=>({...f,name:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>RFID tag *</CFormLabel>
              <CFormInput value={tForm.rfid_tag} onChange={e=>setTForm(f=>({...f,rfid_tag:e.target.value}))} /></CCol>
            <CCol sm={12}><CFormLabel>Нярав</CFormLabel>
              <CFormSelect value={tForm.storekeeper_id} onChange={e=>setTForm(f=>({...f,storekeeper_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.filter(e=>e.position==='Нярав').map(e =>
                  <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setTModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={saveTool} disabled={tSaving || !tForm.code || !tForm.name || !tForm.rfid_tag}>
            {tSaving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Checkout modal */}
      <CModal visible={coModal} onClose={()=>setCoModal(false)}>
        <CModalHeader><CModalTitle>Багаж олгох</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            <CCol sm={12}><CFormLabel>Багаж (ID эсвэл код)</CFormLabel>
              <CFormInput value={coForm.tool_id} onChange={e=>setCoForm(f=>({...f,tool_id:e.target.value}))} placeholder="Багаж ID" /></CCol>
            <CCol sm={12}><CFormLabel>Авах хүн *</CFormLabel>
              <CFormSelect value={coForm.employee_id} onChange={e=>setCoForm(f=>({...f,employee_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={12}><CFormLabel>Нярав</CFormLabel>
              <CFormSelect value={coForm.storekeeper_id} onChange={e=>setCoForm(f=>({...f,storekeeper_id:e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {emps.filter(e=>e.position==='Нярав').map(e =>
                  <option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
              </CFormSelect>
            </CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setCoModal(false)}>Болих</CButton>
          <CButton color="success" onClick={saveCheckout} disabled={coSaving || !coForm.tool_id || !coForm.employee_id}>
            {coSaving ? <CSpinner size="sm" /> : 'Олгох'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
