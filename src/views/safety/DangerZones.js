import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Tabs, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Checkbox, Empty, Spin, Popconfirm, InputNumber, message,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { useEventStream } from 'src/hooks/useEventStream'
import dayjs from 'dayjs'

const HAZARD_COLOR = { low: 'green', medium: 'orange', high: 'red', critical: 'magenta' }
const HAZARD_LABEL = { low: 'Бага', medium: 'Дунд', high: 'Өндөр', critical: 'Аюултай' }
const PPE_OPTS = ['helmet','vest','gloves','boots','glasses','harness','mask','earmuff']
const PPE_LABEL = { helmet: 'Каска', vest: 'Хантааз', gloves: 'Бээлий', boots: 'Гутал',
  glasses: 'Нүдний шил', harness: 'Уяа', mask: 'Маск', earmuff: 'Чихэвч' }

export default function DangerZones() {
  const [tab, setTab] = useState('live')
  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Аюултай бүсийн хяналт</h4>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'live',   label: 'Шууд хяналт',    children: <LiveTab /> },
        { key: 'manage', label: 'Бүс тохируулах', children: <ManageTab /> },
      ]} />
    </div>
  )
}

function LiveTab() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    api.getDangerZonesLive({ project_id: currentProjectId || undefined })
      .then(r => setZones(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [currentProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEventStream((ev) => {
    if (ev.type !== 'gate_scan') return
    if (currentProjectId && String(ev.project_id) !== String(currentProjectId)) return
    load()
  })

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button size="small" icon={<ReloadOutlined />} onClick={load}>Шинэчлэх</Button>
      </div>
      {zones.length === 0 ? (
        <Empty description="Аюултай бүс тодорхойлоогүй. 'Бүс тохируулах'-аас нэмнэ үү." style={{ padding: 60 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {zones.map(z => {
            const over = z.max_occupancy && z.current_count > z.max_occupancy
            return (
              <Col key={z.id} md={12} lg={8} xs={24}>
                <Card style={{ height: '100%', borderColor: HAZARD_COLOR[z.hazard_level] === 'green' ? '#52c41a'
                    : HAZARD_COLOR[z.hazard_level] === 'orange' ? '#faad14'
                    : HAZARD_COLOR[z.hazard_level] === 'red' ? '#cf1322' : '#eb2f96' }}
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{z.name}</strong>
                    <Tag color={HAZARD_COLOR[z.hazard_level]}>{HAZARD_LABEL[z.hazard_level]}</Tag>
                  </div>}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>Одоо бүсэд:</span>
                    <span style={{ fontWeight: 700, fontSize: 24, color: over ? '#cf1322' : undefined }}>
                      {z.current_count}{z.max_occupancy ? ` / ${z.max_occupancy}` : ''}
                    </span>
                  </div>
                  {over && <Tag color="red" style={{ marginBottom: 8 }}>⚠ Хүн хэтэрсэн!</Tag>}
                  <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {(z.occupants || []).length === 0
                      ? <div style={{ color: '#8c8c8c', fontSize: 12 }}>Хүн байхгүй</div>
                      : (z.occupants || []).map(o => (
                        <div key={o.employee_id} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 12, borderBottom: '1px solid #f0f0f0', padding: '4px 0',
                        }}>
                          <span>{o.emp_code} — {o.full_name}</span>
                          <span style={{ color: '#8c8c8c' }}>{dayjs(o.since).format('HH:mm')}</span>
                        </div>
                      ))}
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </>
  )
}

function ManageTab() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [zones,   setZones]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)

  const load = () => {
    setLoading(true)
    api.getDangerZones({ project_id: currentProjectId || undefined })
      .then(r => setZones(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [currentProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => { await api.deleteDangerZone(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Нэр', dataIndex: 'name', render: v => <strong>{v}</strong> },
    { title: 'Зоны код', dataIndex: 'zone_code', render: v => <code>{v || '—'}</code> },
    { title: 'Эрсдэл', dataIndex: 'hazard_level', width: 110,
      render: v => <Tag color={HAZARD_COLOR[v]}>{HAZARD_LABEL[v]}</Tag> },
    { title: 'Шаардлагатай ХХХ', dataIndex: 'required_ppe',
      render: (v) => (v || []).map(p => PPE_LABEL[p] || p).join(', ') || '—' },
    { title: 'Багтаамж', dataIndex: 'max_occupancy', width: 100, render: v => v || '—' },
    { title: 'Статус', dataIndex: 'is_active', width: 110,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Хаагдсан'}</Tag> },
    { title: '', width: 130, render: (_, z) => (
      <Space size="small">
        <Button size="small" onClick={() => { setEditing(z); setModal(true) }}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(z.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditing(null); setModal(true) }}>Аюултай бүс нэмэх</Button>
      </div>
      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={zones}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Бүс алга' }} />
      </Card>
      {modal && <ZoneForm editing={editing} onClose={() => setModal(false)}
        onSaved={() => { setModal(false); load() }} />}
    </>
  )
}

function ZoneForm({ editing, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    form.setFieldsValue(editing ? {
      name: editing.name, zone_code: editing.zone_code || '',
      hazard_level: editing.hazard_level, description: editing.description || '',
      required_ppe: editing.required_ppe || [],
      max_occupancy: editing.max_occupancy || null,
      is_active: editing.is_active,
    } : {
      hazard_level: 'medium', required_ppe: [], is_active: true,
    })
  }, [editing, form])

  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = { ...v, max_occupancy: v.max_occupancy ?? null }
      editing ? await api.updateDangerZone(editing.id, payload) : await api.createDangerZone(payload)
      message.success('Хадгалагдлаа'); onSaved()
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }

  return (
    <Modal open onOk={save} onCancel={onClose} confirmLoading={saving}
      title={editing ? 'Бүс засах' : 'Аюултай бүс нэмэх'} width={640}
      okText="Хадгалах" cancelText="Болих" destroyOnClose maskClosable={false}>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Row gutter={12}>
          <Col span={16}><Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={8}>
            <Form.Item name="hazard_level" label="Эрсдэл">
              <Select options={Object.entries(HAZARD_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="zone_code" label="Зоны код (RFID reader-тэй тааруулна)">
              <Input placeholder="steelwork, concrete..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="max_occupancy" label="Хүний багтаамж">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="required_ppe" label="Шаардлагатай хамгаалах хэрэгсэл">
              <Checkbox.Group>
                <Space wrap>{PPE_OPTS.map(p => <Checkbox key={p} value={p}>{PPE_LABEL[p]}</Checkbox>)}</Space>
              </Checkbox.Group>
            </Form.Item>
          </Col>
          <Col span={24}><Form.Item name="description" label="Тайлбар"><Input.TextArea rows={2} /></Form.Item></Col>
        </Row>
      </Form>
    </Modal>
  )
}
