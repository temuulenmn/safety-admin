import React, { useEffect, useState, useCallback } from 'react'
import { Row, Col, Card, Table, Tag, Statistic, Progress, Alert, Input, InputNumber, Space } from 'antd'
import api from 'src/services/api'
import dayjs from 'dayjs'

export default function TrainingCompliance() {
  const [year, setYear] = useState(dayjs().year())
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getTrainingMatrix({ year }),
      api.getTrainingComplianceSummary({ year }),
    ]).then(([r, s]) => { setRows(r.data || []); setSummary(s.data) })
      .finally(() => setLoading(false))
  }, [year])
  useEffect(load, [load])

  const filtered = rows.filter(r =>
    !search || `${r.emp_code} ${r.full_name} ${r.position || ''} ${r.department_name || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
    { title: 'Заавал сургалт', width: 200,
      render: (_, r) => {
        const pct = r.mandatory_count > 0
          ? Math.round(r.covered_count / r.mandatory_count * 100) : 100
        return <>
          <div style={{ fontSize: 12 }}>{r.covered_count} / {r.mandatory_count}</div>
          <Progress percent={pct} size="small" strokeColor={pct >= 100 ? '#52c41a' : pct >= 50 ? '#faad14' : '#cf1322'} />
        </>
      } },
    { title: 'Энэ жил', dataIndex: 'completed_this_year', width: 100, align: 'right',
      render: v => v >= 2
        ? <Tag color="success">{v} ✓</Tag>
        : <Tag color="orange">{v}/2</Tag> },
    { title: 'Төлөв', width: 140,
      render: (_, r) => {
        if (r.mandatory_count === 0) return <Tag>Заавал сургалтгүй</Tag>
        return r.covered_count >= r.mandatory_count
          ? <Tag color="success">Бүрэн</Tag>
          : <Tag color="error">Дутуу</Tag>
      } },
  ]

  const complyPct = summary?.total_employees > 0
    ? Math.round(summary.fully_compliant / summary.total_employees * 100) : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Заавал сургалтын нийцэл</h4>
        <Space>
          <InputNumber value={year} onChange={setYear} min={2020} max={2100} />
        </Space>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 17.1 дугаар зүйл"
        description="Ажил олгогч нь хөдөлмөрийн аюулгүй байдал, эрүүл ахуйн талаархи сургалтыг жилд хоёроос доошгүй удаа явуулах ба ажилтныг заавал хамруулна." />

      {summary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Нийт ажилтан" value={summary.total_employees ?? 0} valueStyle={{ fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Бүрэн нийцэл" value={summary.fully_compliant ?? 0}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                suffix={<span style={{ fontSize: 13, color: '#8c8c8c' }}>({complyPct}%)</span>} />
              <Progress percent={complyPct} size="small" strokeColor="#52c41a" showInfo={false} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Дутуу" value={summary.non_compliant ?? 0}
                valueStyle={{ color: '#cf1322', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Заавал сургалт (курс)" value={summary.mandatory_courses ?? 0}
                valueStyle={{ color: '#1890ff', fontWeight: 700 }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Хайх..." value={search}
              onChange={e => setSearch(e.target.value)} allowClear />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={filtered}
          pagination={{ pageSize: 25 }} locale={{ emptyText: 'Ажилтан алга' }} />
      </Card>
    </div>
  )
}
