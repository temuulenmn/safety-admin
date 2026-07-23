import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  Space, Alert, Popconfirm, Tabs, Checkbox, message,
} from 'antd'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const TYPE_LABEL = { internal: 'Дотоод', state: 'Улсын байцаагч', third_party: 'Гадны шинжээч' }
const TYPE_COLOR = { internal: 'blue', state: 'red', third_party: 'orange' }

export default function ToolInspections() {
  const [tab, setTab] = useState('inspections')
  const [rows,     setRows]     = useState([])
  const [tools,    setTools]    = useState([])
  const [expiring, setExpiring] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [typeF,    setTypeF]    = useState()

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [saving,  setSaving]  = useState(false)
  const [inspFor, setInspFor] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getToolInspections({ inspector_type: typeF }),
      api.getExpiringCerts(),
    ]).then(([r, e]) => { setRows(r.data || []); setExpiring(e.data || []) })
      .finally(() => setLoading(false))
  }, [typeF])
  useEffect(() => {
    api.getTools({ limit: 500 }).then(r => setTools(r.data || []))
  }, [])
  useEffect(load, [load])

  const openInspect = (tool) => {
    setInspFor(tool); form.resetFields()
    form.setFieldsValue({
      tool_id: tool?.id,
      inspected_at: dayjs(), passed: true, inspector_type: 'internal',
      next_due_date: dayjs().add(1, 'year'),
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createToolInspection({
        ...v,
        inspected_at: v.inspected_at.format('YYYY-MM-DD'),
        next_due_date: v.next_due_date ? v.next_due_date.format('YYYY-MM-DD') : null,
      })
      setModal(false); load(); message.success('Шалгалт бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteToolInspection(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Огноо', dataIndex: 'inspected_at', width: 120,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Багаж', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.tool_code} — {r.tool_name}</div>
      </>
    ) },
    { title: 'Байцаагч', dataIndex: 'inspector_type', width: 140,
      render: v => <Tag color={TYPE_COLOR[v]}>{TYPE_LABEL[v]}</Tag> },
    { title: 'Нэр', dataIndex: 'inspector_name', render: v => v || '—' },
    { title: 'Гэрчилгээ №', dataIndex: 'cert_number', width: 130,
      render: v => v ? <code>{v}</code> : '—' },
    { title: 'Үр дүн', dataIndex: 'passed', width: 100,
      render: v => <Tag color={v ? 'success' : 'error'}>{v ? 'Тэнцсэн' : 'Тэнцээгүй'}</Tag> },
    { title: 'Дараагийн', dataIndex: 'next_due_date', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: '', width: 60, render: (_, r) => (
      <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" danger>×</Button>
      </Popconfirm>
    ) },
  ]

  const expCols = [
    { title: 'Багаж', render: (_, r) => `${r.code} — ${r.name}` },
    { title: 'Ангилал', dataIndex: 'category', render: v => v || '—' },
    { title: 'Гэрчилгээ №', dataIndex: 'cert_number', render: v => v ? <code>{v}</code> : '—' },
    { title: 'Гэрчилгээ дуусах', dataIndex: 'cert_expiry_at', width: 140,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Дараагийн шалгалт', dataIndex: 'next_inspection_at', width: 140,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : <Tag color="magenta">Шалгаагүй</Tag> },
    { title: 'Статус', dataIndex: 'urgency', width: 130,
      render: v => (
        v === 'expired' ? <Tag color="red">Хугацаа хэтэрсэн</Tag>
        : v === 'never' ? <Tag color="magenta">Шалгаагүй</Tag>
        : <Tag color="orange">Удахгүй</Tag>
      ) },
    { title: '', width: 130, render: (_, t) => (
      <Button size="small" type="primary" onClick={() => openInspect(t)}>Шалгах</Button>
    ) },
  ]

  const tabItems = [
    { key: 'inspections', label: `Шалгалтын түүх (${rows.length})`, children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Select value={typeF} onChange={setTypeF} allowClear
            placeholder="Бүх байцаагч" style={{ width: 220 }}
            options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
        </Card>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={cols} dataSource={rows}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Шалгалт алга' }} />
        </Card>
      </>
    ) },
    { key: 'expiring', label: (
      <span><WarningOutlined style={{ color: expiring.length ? '#faad14' : undefined }} /> Гэрчилгээ дуусах ({expiring.length})</span>
    ), children: (
      <Card>
        <Table rowKey="id" size="middle" columns={expCols} dataSource={expiring}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'Бүгд хүчинтэй ✓' }} />
      </Card>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Багажийн шалгалт / Гэрчилгээ</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openInspect()}>Шалгалт нэмэх</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 9.1.3 дугаар зүйл"
        description="Машин, механизм, тоног төхөөрөмжийг улсын байцаагчаар туршилтад оруулж, техникийн паспорт болон ашиглалтын журам хөтөлнө." />

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={inspFor ? `Шалгалт: ${inspFor.code} — ${inspFor.name}` : 'Шалгалт нэмэх'}
        confirmLoading={saving} width={640}
        okText="Бүртгэх" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          {!inspFor && (
            <Form.Item name="tool_id" label="Багаж" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                options={tools.map(t => ({ value: t.id, label: `${t.code} — ${t.name}` }))} />
            </Form.Item>
          )}
          <Row gutter={12}>
            <Col span={12}><Form.Item name="inspected_at" label="Огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="inspector_type" label="Байцаагчийн төрөл">
                <Select options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="inspector_name" label="Байцаагчийн нэр"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="cert_number" label="Гэрчилгээ №"><Input /></Form.Item></Col>
            <Col span={24}>
              <Form.Item name="passed" valuePropName="checked">
                <Checkbox>Шалгалтад тэнцсэн</Checkbox>
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="findings" label="Илэрсэн зөрчил"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={24}><Form.Item name="action_taken" label="Авсан арга хэмжээ"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="next_due_date" label="Дараагийн шалгалт"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="attachment_url" label="Хавсралт URL"><Input placeholder="https://..." /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
