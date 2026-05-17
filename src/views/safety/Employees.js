import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CFormInput, CFormSelect,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CRow, CCol, CFormLabel, CSpinner,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import api from 'src/services/api'
import dayjs from 'dayjs'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'

const STATUS_COLOR = { active:'success', inactive:'secondary', on_leave:'warning', terminated:'danger' }
const STATUS_LABEL = { active:'Идэвхтэй', inactive:'Идэвхгүй', on_leave:'Чөлөөт', terminated:'Чөлөөлөгдсөн' }
const EMPTY = {
  emp_code:'', first_name:'', last_name:'', gender:'', birth_date:'',
  register_number:'', phone:'', email:'', address:'', position:'',
  department_id:'', hire_date:'', base_salary:'', status:'active',
}

export default function Employees() {
  const gridRef  = useRef()
  const gridTheme = useGridTheme()
  const [depts,   setDepts]   = useState([])
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    api.getDepartments().then(r => setDepts(r.data || []))
  }, [])

  const refreshDS = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit, sort_by, sort_dir }) =>
      api.getEmployees({ page, limit, search, status: statusF || undefined, sort_by, sort_dir })
    )
    gridRef.current?.api?.setGridOption('datasource', ds)
  }, [search, statusF])

  useEffect(() => { refreshDS() }, [refreshDS])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit   = (row) => {
    setEditing(row.id)
    setForm({
      emp_code: row.emp_code, first_name: row.first_name, last_name: row.last_name,
      gender: row.gender||'', birth_date: row.birth_date?.slice(0,10)||'',
      register_number: row.register_number||'', phone: row.phone||'',
      email: row.email||'', address: row.address||'', position: row.position||'',
      department_id: row.department_id||'', hire_date: row.hire_date?.slice(0,10)||'',
      base_salary: row.base_salary||'', status: row.status,
    })
    setModal(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      editing ? await api.updateEmployee(editing, form) : await api.createEmployee(form)
      setModal(false); refreshDS()
    } finally { setSaving(false) }
  }

  const columnDefs = [
    { field: 'emp_code',        headerName: 'Код',          width: 90 },
    { field: 'last_name',       headerName: 'Овог',         width: 110 },
    { field: 'first_name',      headerName: 'Нэр',          width: 110 },
    { field: 'department_name', headerName: 'Хэлтэс',       width: 140 },
    { field: 'position',        headerName: 'Албан тушаал', flex: 1 },
    { field: 'phone',           headerName: 'Утас',         width: 120 },
    { field: 'hire_date',       headerName: 'Ажилд орсон',  width: 120,
      valueFormatter: p => p.value ? dayjs(p.value).format('YYYY-MM-DD') : '' },
    { field: 'status', headerName: 'Төлөв', width: 120,
      cellRenderer: p => <CBadge color={STATUS_COLOR[p.value]||'secondary'}>{STATUS_LABEL[p.value]||p.value}</CBadge> },
    { headerName: 'Үйлдэл', width: 90, sortable: false,
      cellRenderer: p => <CButton size="sm" color="primary" variant="outline" onClick={() => openEdit(p.data)}>Засах</CButton> },
  ]

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Ажилтнууд</h4>
        <CButton color="primary" onClick={openCreate}>+ Нэмэх</CButton>
      </div>
      <CCard>
        <CCardHeader>
          <CRow className="g-2">
            <CCol sm={4}>
              <CFormInput placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)} />
            </CCol>
            <CCol sm={3}>
              <CFormSelect value={statusF} onChange={e => setStatusF(e.target.value)}>
                <option value="">Бүх төлөв</option>
                <option value="active">Идэвхтэй</option>
                <option value="inactive">Идэвхгүй</option>
                <option value="on_leave">Чөлөөт</option>
                <option value="terminated">Чөлөөлөгдсөн</option>
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody className="p-0">
          <div style={{ height: 600, width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              theme={gridTheme}
              rowModelType="infinite"
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              cacheBlockSize={25}
              onGridReady={refreshDS}
            />
          </div>
        </CCardBody>
      </CCard>

      <CModal visible={modal} onClose={() => setModal(false)} size="lg">
        <CModalHeader><CModalTitle>{editing ? 'Ажилтан засах' : 'Ажилтан нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm><CRow className="g-3">
            {[
              ['emp_code','Ажилтны код','text',true],
              ['last_name','Овог','text',true],
              ['first_name','Нэр','text',true],
              ['position','Албан тушаал','text',false],
              ['phone','Утас','text',false],
              ['email','Имэйл','email',false],
              ['register_number','Регистр','text',false],
              ['birth_date','Төрсөн огноо','date',false],
              ['hire_date','Ажилд орсон','date',true],
              ['base_salary','Үндсэн цалин','number',false],
            ].map(([k, label, type, req]) => (
              <CCol sm={6} key={k}>
                <CFormLabel>{label}{req && <span className="text-danger"> *</span>}</CFormLabel>
                <CFormInput type={type} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} />
              </CCol>
            ))}
            <CCol sm={6}>
              <CFormLabel>Хэлтэс</CFormLabel>
              <CFormSelect value={form.department_id} onChange={e => setForm(f => ({...f, department_id: e.target.value}))}>
                <option value="">-- Сонгох --</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={6}>
              <CFormLabel>Хүйс</CFormLabel>
              <CFormSelect value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                <option value="">-- Сонгох --</option>
                <option value="male">Эрэгтэй</option>
                <option value="female">Эмэгтэй</option>
              </CFormSelect>
            </CCol>
            <CCol sm={6}>
              <CFormLabel>Төлөв</CFormLabel>
              <CFormSelect value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                <option value="active">Идэвхтэй</option>
                <option value="inactive">Идэвхгүй</option>
                <option value="on_leave">Чөлөөт</option>
                <option value="terminated">Чөлөөлөгдсөн</option>
              </CFormSelect>
            </CCol>
          </CRow></CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>{saving ? <CSpinner size="sm" /> : 'Хадгалах'}</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
