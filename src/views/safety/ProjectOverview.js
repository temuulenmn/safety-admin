import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Card, Tag, Button, Progress, Spin, Space, Statistic } from 'antd'
import { ArrowLeftOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { downloadCSV, printReport } from 'src/utils/exporters'

const money = (n) => Number(n || 0).toLocaleString() + '₮'
const STATUS = { planned: 'blue', active: 'green', suspended: 'orange', completed: 'default' }
const STATUS_LABEL = { planned: 'Төлөвлөсөн', active: 'Идэвхтэй', suspended: 'Түр зогссон', completed: 'Дууссан' }
const scoreColor = (s) => s == null ? '#8c8c8c' : s >= 90 ? '#52c41a' : s >= 70 ? '#1890ff' : s >= 50 ? '#faad14' : '#cf1322'
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

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
  if (!project) return (
    <div><Button type="link" onClick={() => navigate('/projects')}>← Буцах</Button> Төсөл олдсонгүй.</div>
  )

  const r = project.rollup
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Button type="link" style={{ padding: 0, marginBottom: 4 }}
            icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>Төслүүд</Button>
          <h4 style={{ margin: 0, fontWeight: 700 }}>
            {project.name} <Tag color={STATUS[project.status] || 'default'}>{STATUS_LABEL[project.status] || project.status}</Tag>
          </h4>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            {project.code && <>Код: <b>{project.code}</b> · </>}
            {project.location || '—'}
            {project.client_name && <> · Захиалагч: {project.client_name}</>}
            {project.manager_name && <> · Менежер: {project.manager_name}</>}
          </div>
        </div>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={exportPDF}>PDF</Button>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>Excel</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col md={8} xs={24}>
          <Card style={{ textAlign: 'center', height: '100%' }}>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>Аюулгүйн оноо</div>
            <div style={{ fontWeight: 700, color: scoreColor(kpi?.safety_score), fontSize: 48, lineHeight: 1.1 }}>
              {kpi?.safety_score ?? '—'}
            </div>
            <Progress percent={kpi?.safety_score || 0} strokeColor={scoreColor(kpi?.safety_score)}
              showInfo={false} style={{ marginTop: 8 }} />
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
              {kpi?.workers ?? 0} ажилтан · {kpi?.period.from} → {kpi?.period.to}
            </div>
          </Card>
        </Col>
        <Col md={16} xs={24}>
          <Row gutter={[12, 12]}>
            {(kpi?.metrics || []).map(m => (
              <Col sm={12} key={m.key}>
                <Card size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>{m.label}</span>
                    {m.met != null && <Tag color={m.met ? 'success' : 'error'}>{m.met ? 'Хүрсэн' : 'Хүрээгүй'}</Tag>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 20, color: scoreColor(m.score) }}>{fmtVal(m.value, m.unit)}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>/ зорилт {fmtVal(m.target, m.unit)}</span>
                  </div>
                  <Progress size="small" percent={m.score || 0} strokeColor={scoreColor(m.score)} showInfo={false} />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          ['Өнөөдөр ирсэн',   r.present_today,               '#52c41a'],
          ['Гэрээ',            r.contracts.count,             '#1890ff'],
          ['Гэрээний дүн',     money(r.contracts.total_value),'#1890ff'],
          ['Төлсөн',           money(r.contracts.total_paid), '#13c2c2'],
          ['Зөрчил (30 хоног)', r.safety.violations_30d,      '#faad14'],
          ['Аюултай бүс',      r.safety.danger_zones,         '#cf1322'],
        ].map(([l, v, c]) => (
          <Col key={l} xs={12} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title={l} value={v} valueStyle={{ color: c, fontWeight: 700, fontSize: 18 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Даалгаврын төлөв">
        Төлөвлөсөн <b>{r.tasks.planned}</b> · Идэвхтэй <b>{r.tasks.active}</b> ·
        Дууссан <b>{r.tasks.completed}</b> ·
        <span style={{ color: '#cf1322' }}> Хугацаа хэтэрсэн <b>{r.tasks.overdue}</b></span>
        {project.budget_amount != null && <span> · Төсөв <b>{money(project.budget_amount)}</b></span>}
        {project.area_m2 ? <span> · Талбай <b>{project.area_m2} м²</b></span> : null}
      </Card>
    </div>
  )
}
