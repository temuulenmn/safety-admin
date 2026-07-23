import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Space, Statistic, Alert, Popconfirm, Checkbox, message,
} from 'antd'
import { PlusOutlined, FileTextOutlined, WarningOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const HAZARD_LABEL = {
  none: 'Хортой бус', flammable: 'Шатамхай', toxic: 'Хортой', corrosive: 'Идэмхий',
  explosive: 'Дэлбэрэх', oxidizer: 'Исэлдүүлэгч', radioactive: 'Цацраг идэвхт', other: 'Бусад',
}
const HAZARD_COLOR = {
  none: 'default', flammable: 'orange', toxic: 'red', corrosive: 'volcano',
  explosive: 'magenta', oxidizer: 'gold', radioactive: 'purple', other: 'blue',
}

export default function Chemicals() {
  const [rows,    setRows]    = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [hazF,    setHazF]    = useState()
  const [lowStock,setLowStock]= useState(false)

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getChemicals({ hazard_class: hazF, low_stock: lowStock ? 'true' : undefined }),
      api.getChemicalStats(),
    ]).then(([r, s]) => { setRows(r.data || []); setStats(s.data) })
      .finally(() => setLoading(false))
  }, [hazF, lowStock])
  useEffect(load, [load])

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ hazard_class: 'other', unit: 'литр', quantity: 0 })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      name: r.name, cas_number: r.cas_number || '', category: r.category || '',
      hazard_class: r.hazard_class, storage_location: r.storage_location || '',
      unit: r.unit || 'литр', quantity: Number(r.quantity || 0),
      reorder_level: r.reorder_level ? Number(r.reorder_level) : null,
      msds_url: r.msds_url || '', supplier: r.supplier || '',
      purchased_at: r.purchased_at ? dayjs(r.purchased_at) : null,
      expiry_date:  r.expiry_date  ? dayjs(r.expiry_date)  : null,
      reported_to_auth: !!r.reported_to_auth,
      reported_at: r.reported_at ? dayjs(r.reported_at) : null,
      notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        purchased_at: v.purchased_at ? v.purchased_at.format('YYYY-MM-DD') : null,
        expiry_date:  v.expiry_date  ? v.expiry_date.format('YYYY-MM-DD')  : null,
        reported_at:  v.reported_at  ? v.reported_at.format('YYYY-MM-DD')  : null,
      }
      editing ? await api.updateChemical(editing, payload) : await api.createChemical(payload)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteChemical(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Нэр', dataIndex: 'name', render: v => <strong>{v}</strong> },
    { title: 'CAS №', dataIndex: 'cas_number', width: 120, render: v => v ? <code>{v}</code> : '—' },
    { title: 'Ангилал', dataIndex: 'category', width: 130, render: v => v || '—' },
    { title: 'Аюулын зэрэг', dataIndex: 'hazard_class', width: 130,
      render: v => <Tag color={HAZARD_COLOR[v]}>{HAZARD_LABEL[v] || v}</Tag> },
    { title: 'Хадгалалт', dataIndex: 'storage_location', render: v => v || '—' },
    { title: 'Үлдэгдэл', width: 130, align: 'right',
      render: (_, r) => {
        const low = r.reorder_level && Number(r.quantity) <= Number(r.reorder_level)
        return <span style={{ color: low ? '#cf1322' : undefined, fontWeight: low ? 600 : 400 }}>
          {Number(r.quantity)} {r.unit}{low && ' ⚠'}
        </span>
      } },
    { title: 'MSDS', dataIndex: 'msds_url', width: 70, align: 'center',
      render: v => v ? <a href={v} target="_blank" rel="noopener"><FileTextOutlined /></a> : '—' },
    { title: 'Мэдээлсэн', dataIndex: 'reported_to_auth', width: 100, align: 'center',
      render: (v, r) => v ? <Tag color="success">✓</Tag> :
        (['toxic','explosive','radioactive'].includes(r.hazard_class)
          ? <Tag color="red">Дутуу</Tag> : '—') },
    { title: 'Дуусах', dataIndex: 'expiry_date', width: 110,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: '', width: 120, render: (_, r) => (
      <Space size="small">
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
        <h4 style={{ margin: 0, fontWeight: 700 }}>Химийн бодис</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Бодис нэмэх</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 12 дугаар зүйл"
        description="Ажил олгогч нь үйлдвэрлэлийн явцад хэрэглэж байгаа химийн хорт ба аюултай бодисын тэмдэглэл хөтөлж, холбогдох мэргэжлийн байгууллагад мэдээлнэ." />

      {stats?.unreported_hazardous > 0 && (
        <Alert type="error" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message={`⚠ ${stats.unreported_hazardous} хортой/цацраг идэвхт бодис мэдээлээгүй байна`} />
      )}

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Нийт бодис" value={stats.total ?? 0} valueStyle={{ fontWeight: 700 }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Хортой" value={stats.hazardous ?? 0} valueStyle={{ color: '#cf1322', fontWeight: 700 }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Нөөц бага" value={stats.low_stock ?? 0} valueStyle={{ color: '#faad14', fontWeight: 700 }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small"><Statistic title="Хугацаа хэтэрсэн" value={stats.expired ?? 0} valueStyle={{ color: '#eb2f96', fontWeight: 700 }} /></Card></Col>
        </Row>
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Select value={hazF} onChange={setHazF} allowClear
              placeholder="Бүх ангилал" style={{ width: '100%' }}
              options={Object.entries(HAZARD_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Checkbox checked={lowStock} onChange={e => setLowStock(e.target.checked)}>Зөвхөн нөөц бага</Checkbox>
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Бодис алга' }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Бодис засах' : 'Бодис нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" width={720} destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={16}><Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="cas_number" label="CAS №"><Input placeholder="7732-18-5" /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="Ангилал"><Input placeholder="уусмал, түлш, хүчил..." /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="hazard_class" label="Аюулын зэрэг">
                <Select options={Object.entries(HAZARD_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="storage_location" label="Хадгалах байршил"><Input /></Form.Item></Col>
            <Col span={6}><Form.Item name="unit" label="Нэгж"><Input /></Form.Item></Col>
            <Col span={6}><Form.Item name="quantity" label="Үлдэгдэл"><InputNumber style={{ width: '100%' }} min={0} step={0.01} /></Form.Item></Col>
            <Col span={12}><Form.Item name="reorder_level" label="Нөөцийн доод хязгаар"><InputNumber style={{ width: '100%' }} min={0} step={0.01} /></Form.Item></Col>
            <Col span={12}><Form.Item name="supplier" label="Нийлүүлэгч"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="purchased_at" label="Худалдан авсан огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="expiry_date" label="Дуусах огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="msds_url" label="MSDS (Material Safety Data Sheet) URL"><Input placeholder="https://..." /></Form.Item></Col>

            <Col span={24}>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginBottom: 8, color: '#8c8c8c', fontWeight: 600 }}>
                🏛 Мэргэжлийн байгууллагад мэдээлсэн эсэх
              </div>
            </Col>
            <Col span={12}>
              <Form.Item name="reported_to_auth" valuePropName="checked">
                <Checkbox>Мэдээлсэн</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="reported_at" label="Мэдэгдсэн огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>

            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
