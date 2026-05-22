import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCardHeader, CBadge, CSpinner, CRow, CCol, CProgress,
} from '@coreui/react'
import api from 'src/services/api'
import { downloadCSV, printReport } from 'src/utils/exporters'

const money = (n) => Number(n || 0).toLocaleString() + '₮'
const STATUS = { planned:'info', active:'success', suspended:'warning', completed:'secondary' }
const STATUS_LABEL = { planned:'Төлөвлөсөн', active:'Идэвхтэй', suspended:'Түр зогссон', completed:'Дууссан' }
const scoreColor = (s) => s == null ? 'secondary' : s >= 90 ? 'success' : s >= 70 ? 'info' : s >= 50 ? 'warning' : 'danger'
const fmtVal = (v, u) => v == null ? '—' : `${v}${u || ''}`

export default function ProjectOverview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [kpi, setKpi] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.getProject(id), api.getProjectKpi(id)])
      .then(([p, k]) => { setProject(p.data); setKpi(k.data) })
      .finally(() => setLoading(false))
  }, [id])
  useEffect(() => { load() }, [load])

  const exportExcel = () => {
    if (!project || !kpi) return
    const r = project.rollup
    downloadCSV(`${project.name}-tailan`,
      ['Үзүүлэлт', 'Утга'],
      [
        ['Төсөл', project.name],
        ['Код', project.code || ''],
        ['Төлөв', STATUS_LABEL[project.status] || project.status],
        ['Аюулгүйн оноо', kpi.safety_score ?? ''],
        ...kpi.metrics.map(m => [m.label, `${fmtVal(m.value, m.unit)} / зорилт ${fmtVal(m.target, m.unit)}`]),
        ['Өнөөдөр ирсэн', r.present_today],
        ['Гэрээ (тоо)', r.contracts.count],
        ['Гэрээ (дүн)', r.contracts.total_value],
        ['Гэрээ (төлсөн)', r.contracts.total_paid],
        ['Зөрчил (30 хоног)', r.safety.violations_30d],
        ['Аюултай бүс', r.safety.danger_zones],
        ['Даалгавар: төлөвлөсөн', r.tasks.planned],
        ['Даалгавар: идэвхтэй', r.tasks.active],
        ['Даалгавар: дууссан', r.tasks.completed],
        ['Даалгавар: хугацаа хэтэрсэн', r.tasks.overdue],
      ])
  }

  const exportPDF = () => {
    if (!project || !kpi) return
    const r = project.rollup
    const card = (l, v) => `<div class="card"><div class="l">${l}</div><div class="v">${v}</div></div>`
    const html = `
      <h1>${project.name}</h1>
      <div class="muted">${project.code ? 'Код: ' + project.code + ' · ' : ''}${project.location || ''} ·
        Төлөв: ${STATUS_LABEL[project.status] || project.status} ·
        Хугацаа: ${kpi.period.from} → ${kpi.period.to}</div>
      <h2>Аюулгүйн оноо: ${kpi.safety_score ?? '—'}</h2>
      <div class="cards">
        ${card('Өнөөдөр ирсэн', r.present_today)}
        ${card('Гэрээ', r.contracts.count + ' · ' + money(r.contracts.total_value))}
        ${card('Зөрчил (30х)', r.safety.violations_30d)}
        ${card('Аюултай бүс', r.safety.danger_zones)}
      </div>
      <h2>KPI үзүүлэлт</h2>
      <table><thead><tr><th>Үзүүлэлт</th><th class="r">Утга</th><th class="r">Зорилт</th><th class="r">Оноо</th></tr></thead>
        <tbody>${kpi.metrics.map(m => `<tr><td>${m.label}</td><td class="r">${fmtVal(m.value, m.unit)}</td>
          <td class="r">${fmtVal(m.target, m.unit)}</td><td class="r">${m.score == null ? '—' : m.score + '%'}</td></tr>`).join('')}</tbody>
      </table>
      <h2>Даалгавар</h2>
      <table><thead><tr><th>Төлөвлөсөн</th><th>Идэвхтэй</th><th>Дууссан</th><th>Хугацаа хэтэрсэн</th></tr></thead>
        <tbody><tr><td>${r.tasks.planned}</td><td>${r.tasks.active}</td><td>${r.tasks.completed}</td><td>${r.tasks.overdue}</td></tr></tbody>
      </table>
      <div class="muted" style="margin-top:18px">Гарсан: ${new Date().toLocaleString()}</div>`
    printReport(`${project.name} — тайлан`, html)
  }

  if (loading) return <div className="p-5 text-center"><CSpinner /></div>
  if (!project) return <div className="p-3">Төсөл олдсонгүй. <CButton color="link" onClick={()=>navigate('/projects')}>Буцах</CButton></div>

  const r = project.rollup
  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <CButton color="link" className="p-0 mb-1" onClick={()=>navigate('/projects')}>← Төслүүд</CButton>
          <h4 className="fw-bold mb-1">{project.name} <CBadge color={STATUS[project.status]||'secondary'}>{STATUS_LABEL[project.status]||project.status}</CBadge></h4>
          <div className="small text-medium-emphasis">
            {project.code && <>Код: <b>{project.code}</b> · </>}
            {project.location || '—'}
            {project.client_name && <> · Захиалагч: {project.client_name}</>}
            {project.manager_name && <> · Менежер: {project.manager_name}</>}
          </div>
        </div>
        <div>
          <CButton color="secondary" variant="outline" className="me-2" onClick={exportPDF}>🖨 PDF</CButton>
          <CButton color="secondary" variant="outline" onClick={exportExcel}>⬇ Excel</CButton>
        </div>
      </div>

      <CRow className="g-3 mb-3">
        <CCol md={4}>
          <CCard className="h-100">
            <CCardBody className="text-center">
              <div className="text-medium-emphasis small">Аюулгүйн оноо</div>
              <div className={`fw-bold text-${scoreColor(kpi?.safety_score)}`} style={{fontSize:'3rem',lineHeight:1.1}}>
                {kpi?.safety_score ?? '—'}
              </div>
              <CProgress className="mt-2" value={kpi?.safety_score || 0} color={scoreColor(kpi?.safety_score)} />
              <div className="small text-medium-emphasis mt-2">{kpi?.workers ?? 0} ажилтан · {kpi?.period.from} → {kpi?.period.to}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={8}>
          <CRow className="g-3">
            {(kpi?.metrics || []).map(m => (
              <CCol sm={6} key={m.key}>
                <CCard className="h-100"><CCardBody className="py-2">
                  <div className="d-flex justify-content-between">
                    <span className="small text-medium-emphasis">{m.label}</span>
                    {m.met != null && <CBadge color={m.met?'success':'danger'}>{m.met?'Хүрсэн':'Хүрээгүй'}</CBadge>}
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className={`fw-bold fs-4 text-${scoreColor(m.score)}`}>{fmtVal(m.value,m.unit)}</span>
                    <span className="small text-medium-emphasis">/ зорилт {fmtVal(m.target,m.unit)}</span>
                  </div>
                  <CProgress thin value={m.score||0} color={scoreColor(m.score)} />
                </CCardBody></CCard>
              </CCol>
            ))}
          </CRow>
        </CCol>
      </CRow>

      <CRow className="g-3">
        {[['Өнөөдөр ирсэн', r.present_today, 'success'],
          ['Гэрээ', `${r.contracts.count}`, 'primary'],
          ['Гэрээний дүн', money(r.contracts.total_value), 'primary'],
          ['Төлсөн', money(r.contracts.total_paid), 'info'],
          ['Зөрчил (30 хоног)', r.safety.violations_30d, 'warning'],
          ['Аюултай бүс', r.safety.danger_zones, 'danger']].map(([l,v,c]) => (
          <CCol key={l} xs={6} md={2}>
            <CCard><CCardBody className="py-2 text-center">
              <div className="small text-medium-emphasis">{l}</div>
              <div className={`fw-bold fs-5 text-${c}`}>{v}</div>
            </CCardBody></CCard>
          </CCol>
        ))}
      </CRow>

      <CCard className="mt-3">
        <CCardHeader className="fw-semibold">Даалгаврын төлөв</CCardHeader>
        <CCardBody>
          Төлөвлөсөн <b>{r.tasks.planned}</b> · Идэвхтэй <b>{r.tasks.active}</b> ·
          Дууссан <b>{r.tasks.completed}</b> ·
          <span className="text-danger"> Хугацаа хэтэрсэн <b>{r.tasks.overdue}</b></span>
          {project.budget_amount != null && <span> · Төсөв <b>{money(project.budget_amount)}</b></span>}
          {project.area_m2 ? <span> · Талбай <b>{project.area_m2} м²</b></span> : null}
        </CCardBody>
      </CCard>
    </div>
  )
}
