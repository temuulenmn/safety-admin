import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Space, Statistic, Alert, Popconfirm, Descriptions, message,
} from 'antd'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const CAT_LABEL = {
  physical: 'Физик', chemical: 'Химийн', biological: 'Биологи',
  ergonomic: 'Эргономик', psycho: 'Сэтгэл зүй',
}
const STATUS_COLOR = { draft: 'default', active: 'processing', under_review: 'warning', closed: 'success' }
const STATUS_LABEL = { draft: 'Ноорог', active: 'Идэвхтэй', under_review: 'Хянаж буй', closed: 'Хаагдсан' }
const scoreColor = (s) => s == null ? '#8c8c8c' : s >= 15 ? '#cf1322' : s >= 8 ? '#faad14' : '#52c41a'
const scoreLabel = (s) => s == null ? '—' : s >= 15 ? 'Өндөр' : s >= 8 ? 'Дунд' : 'Бага'

export default function RiskAssessments() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [rows,    setRows]    = useState([])
  const [zones,   setZones]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState()
  const [minScore,setMinScore]= useState()

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [detail,  setDetail]  = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getRiskAssessments({ status: statusF, min_score: minScore, project_id: currentProjectId }),
      api.getRiskStats(),
    ]).then(([r, s]) => { setRows(r.data || []); setStats(s.data) })
      .finally(() => setLoading(false))
  }, [statusF, minScore, currentProjectId])
  useEffect(() => { api.getDangerZones().then(r => setZones(r.data || [])) }, [])
  useEffect(load, [load])

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ likelihood: 3, severity: 3, status: 'active', assessed_at: dayjs() })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      zone_id: r.zone_id || undefined, title: r.title,
      hazard_category: r.hazard_category || undefined, hazard_description: r.hazard_description,
      affected_workers: r.affected_workers || 0,
      likelihood: r.likelihood, severity: r.severity,
      current_controls: r.current_controls || '', additional_controls: r.additional_controls || '',
      responsible_person: r.responsible_person || '',
      target_date: r.target_date ? dayjs(r.target_date) : null,
      assessed_by: r.assessed_by || '',
      assessed_at: r.assessed_at ? dayjs(r.assessed_at) : dayjs(),
      next_review_date: r.next_review_date ? dayjs(r.next_review_date) : null,
      status: r.status, notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        target_date: v.target_date ? v.target_date.format('YYYY-MM-DD') : null,
        assessed_at: v.assessed_at.format('YYYY-MM-DD'),
        next_review_date: v.next_review_date ? v.next_review_date.format('YYYY-MM-DD') : null,
      }
      editing ? await api.updateRiskAssessment(editing, payload) : await api.createRiskAssessment(payload)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteRiskAssessment(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: '№', dataIndex: 'assessment_number', width: 130, render: v => <code>{v}</code> },
    { title: 'Гарчиг', dataIndex: 'title', render: v => <strong>{v}</strong> },
    { title: 'Ангилал', dataIndex: 'hazard_category', width: 120,
      render: v => v ? <Tag>{CAT_LABEL[v] || v}</Tag> : '—' },
    { title: 'Бүс', dataIndex: 'zone_name', width: 140, render: v => v || '—' },
    { title: 'M×S', width: 100, align: 'center',
      render: (_, r) => `${r.likelihood} × ${r.severity}` },
    { title: 'Оноо', dataIndex: 'risk_score', width: 100, align: 'center',
      render: v => <Tag color={scoreColor(v) === '#cf1322' ? 'red' : scoreColor(v) === '#faad14' ? 'orange' : 'green'}>
        {v} — {scoreLabel(v)}
      </Tag> },
    { title: 'Хариуцагч', dataIndex: 'responsible_person', render: v => v || '—' },
    { title: 'Дараагийн хяналт', dataIndex: 'next_review_date', width: 130,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: '', width: 150, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => setDetail(r)}>Үзэх</Button>
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Эрсдэлийн үнэлгээ</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Үнэлгээ нэмэх</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль — ажлын байрны эрсдэлийн үнэлгээ"
        description="Ажлын байр бүр эрсдэлийн үнэлгээ хийж, нөхцөл өөрчлөгдөх бүрд шинэчилнэ. Оноо = магадлал × хүндрэл (1-25)." />

      {stats?.overdue_review > 0 && (
        <Alert type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message={`⚠ ${stats.overdue_review} үнэлгээний хяналтын хугацаа хэтэрсэн`} />
      )}

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Нийт" value={stats.total ?? 0} valueStyle={{ fontWeight: 700 }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Идэвхтэй" value={stats.active ?? 0} valueStyle={{ color: '#1890ff' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Өндөр" value={stats.high ?? 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Дунд" value={stats.medium ?? 0} valueStyle={{ color: '#faad14' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Бага" value={stats.low ?? 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Хяналт хэтэрсэн" value={stats.overdue_review ?? 0} valueStyle={{ color: '#eb2f96' }} /></Card></Col>
        </Row>
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Select value={statusF} onChange={setStatusF} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Select value={minScore} onChange={setMinScore} allowClear
              placeholder="Оноо ≥" style={{ width: '100%' }}
              options={[
                { value: 15, label: 'Зөвхөн өндөр (15+)' },
                { value: 8,  label: 'Дунд + өндөр (8+)' },
              ]} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Үнэлгээ алга' }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Үнэлгээ засах' : 'Эрсдэлийн үнэлгээ нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" width={800} destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={24}><Form.Item name="title" label="Гарчиг" rules={[{ required: true }]}><Input placeholder="Өндрөөс унах эрсдэл — 3-р давхар" /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="zone_id" label="Аюултай бүс">
                <Select allowClear placeholder="-- Сонгох --"
                  options={zones.map(z => ({ value: z.id, label: z.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hazard_category" label="Аюулын ангилал">
                <Select allowClear
                  options={Object.entries(CAT_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="hazard_description" label="Аюулын тайлбар" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="likelihood" label="Магадлал (1-5)" rules={[{ required: true }]}
                help="1=маш ховор, 5=байнга">
                <InputNumber style={{ width: '100%' }} min={1} max={5} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="severity" label="Хүндрэл (1-5)" rules={[{ required: true }]}
                help="1=жижиг гэмтэл, 5=нас барах">
                <InputNumber style={{ width: '100%' }} min={1} max={5} />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="affected_workers" label="Хамрагдах ажилтан"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={24}><Form.Item name="current_controls" label="Одоо байгаа хяналтын арга хэмжээ"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={24}><Form.Item name="additional_controls" label="Нэмэлт арга хэмжээ"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="responsible_person" label="Хариуцагч"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="target_date" label="Гүйцэтгэх хугацаа"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="assessed_by" label="Үнэлсэн"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="assessed_at" label="Огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="next_review_date" label="Дараагийн хяналт"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="status" label="Төлөв">
                <Select options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={!!detail} onCancel={() => setDetail(null)}
        title={detail?.assessment_number} width={720}
        footer={<Button onClick={() => setDetail(null)}>Хаах</Button>}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Гарчиг" span={2}>{detail.title}</Descriptions.Item>
            <Descriptions.Item label="Бүс">{detail.zone_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ангилал">{CAT_LABEL[detail.hazard_category] || detail.hazard_category || '—'}</Descriptions.Item>
            <Descriptions.Item label="Аюул" span={2}>{detail.hazard_description}</Descriptions.Item>
            <Descriptions.Item label="Магадлал × Хүндрэл">{detail.likelihood} × {detail.severity}</Descriptions.Item>
            <Descriptions.Item label="Оноо">
              <Tag color={scoreColor(detail.risk_score) === '#cf1322' ? 'red' : scoreColor(detail.risk_score) === '#faad14' ? 'orange' : 'green'}>
                {detail.risk_score} — {scoreLabel(detail.risk_score)}
              </Tag>
            </Descriptions.Item>
            {detail.current_controls && <Descriptions.Item label="Одоо байгаа хяналт" span={2}>{detail.current_controls}</Descriptions.Item>}
            {detail.additional_controls && <Descriptions.Item label="Нэмэлт арга хэмжээ" span={2}>{detail.additional_controls}</Descriptions.Item>}
            <Descriptions.Item label="Хариуцагч">{detail.responsible_person || '—'}</Descriptions.Item>
            <Descriptions.Item label="Гүйцэтгэх хугацаа">{detail.target_date ? dayjs(detail.target_date).format('YYYY-MM-DD') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Үнэлсэн">{detail.assessed_by || '—'}</Descriptions.Item>
            <Descriptions.Item label="Огноо">{dayjs(detail.assessed_at).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="Дараагийн хяналт" span={2}>{detail.next_review_date ? dayjs(detail.next_review_date).format('YYYY-MM-DD') : '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
