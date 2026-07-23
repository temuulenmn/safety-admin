import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Button, Tag, Table, Progress, Modal, Form, DatePicker,
  InputNumber, Space, Spin, message,
} from 'antd'
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const scoreColor = (s) => s == null ? '#8c8c8c' : s >= 90 ? '#52c41a' : s >= 70 ? '#1890ff' : s >= 50 ? '#faad14' : '#cf1322'
const fmt = (v, u) => v == null ? '—' : `${v}${u || ''}`

export default function Kpi() {
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs()])
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(false)

  const [tModal,  setTModal]  = useState(false)
  const [targets, setTargets] = useState([])
  const [savingKey, setSavingKey] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.getKpiOverview({
      date_from: range[0].format('YYYY-MM-DD'),
      date_to:   range[1].format('YYYY-MM-DD'),
    }).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [range])
  useEffect(() => { load() }, [load])

  const openTargets = async () => {
    const r = await api.getKpiTargets()
    setTargets((r.data || []).map(t => ({ ...t, target_value: Number(t.target_value), weight: Number(t.weight) })))
    setTModal(true)
  }
  const saveTarget = async (t) => {
    setSavingKey(t.metric_key)
    try {
      await api.updateKpiTarget({ metric_key: t.metric_key, target_value: Number(t.target_value), weight: Number(t.weight) })
      load(); message.success('Хадгалагдлаа')
    } finally { setSavingKey(null) }
  }

  const detailCols = [
    { title: 'Үзүүлэлт', dataIndex: 'label' },
    { title: 'Утга', dataIndex: 'value', width: 120, align: 'right',
      render: (v, m) => <span style={{ fontWeight: 600 }}>{fmt(v, m.unit)}</span> },
    { title: 'Зорилт', dataIndex: 'target', width: 120, align: 'right',
      render: (v, m) => fmt(v, m.unit) },
    { title: 'Чиглэл', dataIndex: 'direction', width: 130,
      render: v => v === 'up' ? 'Их нь сайн' : 'Бага нь сайн' },
    { title: 'Жин', dataIndex: 'weight', width: 80, align: 'right' },
    { title: 'Оноо', dataIndex: 'score', width: 90, align: 'right',
      render: v => v == null ? '—' : `${v}%` },
    { title: 'Төлөв', dataIndex: 'met', width: 130,
      render: v => v == null ? <Tag>Өгөгдөлгүй</Tag>
        : <Tag color={v ? 'success' : 'error'}>{v ? 'Хүрсэн' : 'Хүрээгүй'}</Tag> },
  ]

  const targetCols = [
    { title: 'Үзүүлэлт', dataIndex: 'label' },
    { title: 'Зорилт', dataIndex: 'target_value', width: 140,
      render: (v, r, i) => (
        <InputNumber value={v} step={0.01} style={{ width: '100%' }}
          onChange={(val) => setTargets(ts => ts.map((x, j) => j === i ? { ...x, target_value: val } : x))} />
      ) },
    { title: 'Жин', dataIndex: 'weight', width: 120,
      render: (v, r, i) => (
        <InputNumber value={v} step={0.1} style={{ width: '100%' }}
          onChange={(val) => setTargets(ts => ts.map((x, j) => j === i ? { ...x, weight: val } : x))} />
      ) },
    { title: '', width: 110, render: (_, t) => (
      <Button size="small" type="primary" loading={savingKey === t.metric_key}
        onClick={() => saveTarget(t)}>Хадгалах</Button>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>KPI / Гүйцэтгэлийн үзүүлэлт</h4>
        <Button icon={<SettingOutlined />} onClick={openTargets}>Зорилт тохируулах</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)}
            format="YYYY-MM-DD" allowClear={false} />
          <Button type="primary" icon={<ReloadOutlined />} onClick={load} loading={loading}>Шинэчлэх</Button>
        </Space>
      </Card>

      {loading && !data ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> : data && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col md={8}>
              <Card style={{ textAlign: 'center', height: '100%' }}>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>Нэгдсэн аюулгүйн оноо</div>
                <div style={{ fontWeight: 700, color: scoreColor(data.safety_score), fontSize: 48, lineHeight: 1.1 }}>
                  {data.safety_score ?? '—'}
                </div>
                <Progress percent={data.safety_score || 0} strokeColor={scoreColor(data.safety_score)}
                  showInfo={false} style={{ marginTop: 8 }} />
                <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
                  {data.active_employees} идэвхтэй ажилтан · {data.period.from} → {data.period.to}
                </div>
              </Card>
            </Col>
            <Col md={16}>
              <Row gutter={[12, 12]}>
                {data.metrics.map(m => (
                  <Col sm={12} key={m.key}>
                    <Card size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{m.label}</span>
                        {m.met != null && (
                          <Tag color={m.met ? 'success' : 'error'}>{m.met ? 'Хүрсэн' : 'Хүрээгүй'}</Tag>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 20, color: scoreColor(m.score) }}>
                          {fmt(m.value, m.unit)}
                        </span>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>/ зорилт {fmt(m.target, m.unit)}</span>
                      </div>
                      <Progress size="small" percent={m.score || 0}
                        strokeColor={scoreColor(m.score)} showInfo={false} />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>

          <Card title="Дэлгэрэнгүй">
            <Table rowKey="key" size="middle" columns={detailCols}
              dataSource={data.metrics} pagination={false} />
          </Card>
        </>
      )}

      <Modal
        title="KPI зорилт тохируулах"
        open={tModal} onCancel={() => setTModal(false)} footer={null} width={720}
      >
        <Table rowKey="metric_key" size="middle" columns={targetCols}
          dataSource={targets} pagination={false} />
      </Modal>
    </div>
  )
}
