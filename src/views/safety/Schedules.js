import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CRow, CCol, CFormInput, CFormSelect,
  CFormLabel, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CBadge,
} from '@coreui/react'
import { AgGridReact } from 'ag-grid-react'
import { useGridTheme, defaultColDef, makeServerDatasource } from 'src/utils/agGrid'
import api from 'src/services/api'
import dayjs from 'dayjs'

const SHIFT_COLOR = { day: 'success', night: 'dark', rotating: 'warning' }
const SHIFT_LABEL = { day: 'Өдөр', night: 'Шөнө', rotating: 'Ротаци' }
const EMPTY = { employee_id: '', work_date: dayjs().format('YYYY-MM-DD'), shift: 'day', start_time: '', end_time: '', task_description: '', site_zone: '' }

export default function Schedules() {
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

  const refreshDS = useCallback(() => {
    const ds = makeServerDatasource(({ page, limit, sort_by, sort_dir }) =>
      api.getSchedules({ page, limit, date_from: dateFrom, date_to: dateTo, sort_by, sort_dir })
    )
    gridRef.current?.api?.setGridOption('datasource', ds)
  }, [dateFrom, dateTo])

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
    { field: 'work_date',   headerName: 'Огноо',    width: 110, valueFormatter: p => p.value?.slice(0,10) },
    { field: 'emp_code',    headerName: 'Код',      width: 80 },
    { field: 'full_name',   headerName: 'Нэр',      flex: 1 },
    { field: 'department',  headerName: 'Хэлтэс',  width: 130 },
    { field: 'shift',       headerName: 'Ээлж',    width: 90,
      cellRenderer: p => <CBadge color={SHIFT_COLOR[p.value]||'secondary'}>{SHIFT_LABEL[p.value]||p.value}</CBadge> },
    { field: 'start_time',  headerName: 'Эхлэх',   width: 90 },
    { field: 'end_time',    headerName: 'Дуусах',  width: 90 },
    { field: 'site_zone',   headerName: 'Бүс',     width: 100 },
    { field: 'task_description', headerName: 'Даалгавар', flex: 1 },
    { headerName: 'Үйлдэл', width: 130, pinned: 'right', sortable: false,
      cellRenderer: p => (<>
        <CButton size="sm" color="primary" variant="outline" className="me-1" onClick={() => openEdit(p.data)}>Засах</CButton>
        <CButton size="sm" color="danger" variant="outline" onClick={() => remove(p.data.id)}>X</CButton>
      </>) },
  ]

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Ажлын хуваарь</h4>
        <CButton color="primary" onClick={openCreate}>+ Нэмэх</CButton>
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
            <AgGridReact
              ref={gridRef}
              theme={gridTheme}
              rowModelType="infinite"
              columnDefs={cols}
              defaultColDef={defaultColDef}
              cacheBlockSize={25}
              onGridReady={refreshDS}
            />
          </div>
        </CCardBody>
      </CCard>

      <CModal visible={modal} onClose={() => setModal(false)}>
        <CModalHeader><CModalTitle>{editing ? 'Хуваарь засах' : 'Хуваарь нэмэх'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol sm={12}>
                <CFormLabel>Ажилтан <span className="text-danger">*</span></CFormLabel>
                <CFormSelect value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))}>
                  <option value="">-- Сонгох --</option>
                  {emps.map(e=><option key={e.id} value={e.id}>{e.emp_code} — {e.last_name} {e.first_name}</option>)}
                </CFormSelect>
              </CCol>
              <CCol sm={6}><CFormLabel>Огноо <span className="text-danger">*</span></CFormLabel>
                <CFormInput type="date" value={form.work_date} onChange={e=>setForm(f=>({...f,work_date:e.target.value}))} /></CCol>
              <CCol sm={6}><CFormLabel>Ээлж</CFormLabel>
                <CFormSelect value={form.shift} onChange={e=>setForm(f=>({...f,shift:e.target.value}))}>
                  <option value="day">Өдөр</option><option value="night">Шөнө</option><option value="rotating">Ротаци</option>
                </CFormSelect>
              </CCol>
              <CCol sm={6}><CFormLabel>Эхлэх цаг</CFormLabel>
                <CFormInput type="time" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} /></CCol>
              <CCol sm={6}><CFormLabel>Дуусах цаг</CFormLabel>
                <CFormInput type="time" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} /></CCol>
              <CCol sm={6}><CFormLabel>Бүс</CFormLabel>
                <CFormInput value={form.site_zone} onChange={e=>setForm(f=>({...f,site_zone:e.target.value}))} /></CCol>
              <CCol sm={12}><CFormLabel>Даалгавар</CFormLabel>
                <CFormInput value={form.task_description} onChange={e=>setForm(f=>({...f,task_description:e.target.value}))} /></CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal(false)}>Болих</CButton>
          <CButton color="primary" onClick={save} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Хадгалах'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
