import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CNav, CNavItem, CNavLink,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import api from 'src/services/api'

const CATEGORIES = [
  { key:'', label:'Бүгд' },
  { key:'norm', label:'Норм' },
  { key:'regulation', label:'Дүрэм/Хууль' },
  { key:'instruction', label:'Зааварчилгаа' },
]
const CAT_COLOR = { norm:'primary', regulation:'warning', instruction:'info' }
const CAT_LABEL = { norm:'Норм', regulation:'Дүрэм', instruction:'Зааварчилгаа' }

export default function Documents() {
  const [docs,     setDocs]     = useState([])
  const [workTypes,setWorkTypes]= useState([])
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState('')
  const [workType, setWorkType] = useState('')
  const [search,   setSearch]   = useState('')
  const [detail,   setDetail]   = useState(null)

  const load = () => {
    setLoading(true)
    api.getDocuments({ category: category || undefined, work_type: workType || undefined, search: search || undefined, limit: 200 })
      .then(r => setDocs(r.data || [])).finally(()=>setLoading(false))
  }
  useEffect(()=>{ load() }, [category, workType])
  useEffect(()=>{ api.getDocWorkTypes().then(r => setWorkTypes(r.data || [])) }, [])

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3">Норм дүрэм ба зааварчилгааны сан</h4>

      <CNav variant="pills" className="mb-3">
        {CATEGORIES.map(c => (
          <CNavItem key={c.key}>
            <CNavLink active={category===c.key} onClick={()=>setCategory(c.key)} style={{cursor:'pointer'}}>{c.label}</CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <CCard className="mb-3">
        <CCardBody>
          <CRow className="g-2">
            <CCol sm={4}>
              <CFormInput placeholder="Хайх — нэр, дугаар..." value={search}
                onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} />
            </CCol>
            <CCol sm={3}>
              <CFormSelect value={workType} onChange={e=>setWorkType(e.target.value)}>
                <option value="">Бүх ажлын төрөл</option>
                {workTypes.map(w => <option key={w} value={w}>{w}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={2}><CButton color="secondary" variant="outline" onClick={load}>Хайх</CButton></CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? <div className="text-center py-4"><CSpinner /></div> : (
        <CRow className="g-3">
          {docs.map(d => (
            <CCol key={d.id} sm={6} lg={4}>
              <CCard className="h-100" style={{cursor:'pointer'}} onClick={()=>setDetail(d)}>
                <CCardBody className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <CBadge color={CAT_COLOR[d.category]}>{CAT_LABEL[d.category]}</CBadge>
                    {d.work_type && <CBadge color="light" className="text-dark">{d.work_type}</CBadge>}
                  </div>
                  <h6 className="fw-semibold">{d.title}</h6>
                  {d.doc_number && <div className="small text-medium-emphasis mb-1">📋 {d.doc_number}</div>}
                  <p className="small text-medium-emphasis mb-2" style={{
                    display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'
                  }}>{d.description}</p>
                  <div className="mt-auto">
                    <CButton size="sm" color="primary" variant="outline">Дэлгэрэнгүй →</CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
          {docs.length === 0 && (
            <CCol xs={12} className="text-center text-medium-emphasis py-5">Баримт олдсонгүй</CCol>
          )}
        </CRow>
      )}

      <CModal visible={!!detail} onClose={()=>setDetail(null)} size="lg" scrollable>
        <CModalHeader>
          <CModalTitle>{detail?.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {detail && (
            <>
              <div className="mb-3 d-flex gap-2 flex-wrap">
                <CBadge color={CAT_COLOR[detail.category]}>{CAT_LABEL[detail.category]}</CBadge>
                {detail.work_type && <CBadge color="secondary">{detail.work_type}</CBadge>}
                {detail.doc_number && <CBadge color="light" className="text-dark">{detail.doc_number}</CBadge>}
              </div>
              {detail.description && <p className="text-medium-emphasis">{detail.description}</p>}
              {detail.content && (
                <div className="border rounded p-3 bg-body-tertiary" style={{whiteSpace:'pre-wrap'}}>
                  {detail.content}
                </div>
              )}
              {detail.file_url && (
                <div className="mt-3">
                  <CButton color="primary" href={detail.file_url} target="_blank" rel="noopener">
                    📄 Файл нээх / татах
                  </CButton>
                </div>
              )}
              {!detail.content && !detail.file_url && (
                <div className="text-medium-emphasis">Дэлгэрэнгүй агуулга оруулаагүй байна.</div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setDetail(null)}>Хаах</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
