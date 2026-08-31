import React, { useEffect, useState, useCallback } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Space,
  Radio, message, Row, Col,
} from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, GiftOutlined } from '@ant-design/icons'
import { Alert } from 'antd'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_LABEL = {
  pending: 'Хүлээгдэж буй', approved: 'Батлагдсан',
  rejected: 'Татгалзсан', issued: 'Олгосон',
}
const STATUS_COLOR = { pending: 'orange', approved: 'blue', rejected: 'red', issued: 'success' }
const SIZES = ['XS','S','M','L','XL','XXL','XXXL']

export default function Clothing() {
  const [rows,     setRows]    = useState([])
  const [emps,     setEmps]    = useState([])
  const [loading,  setLoading] = useState(false)
  const [filter,   setFilter]  = useState('all')
  const [modal,    setModal]   = useState(false)
  const [form]     = Form.useForm()
  const [saving,   setSaving]  = useState(false)
  const [actioning,setActioning]= useState(null)
  const [issueFor, setIssueFor] = useState(null)   // олгох гэж буй захиалга
  const [issueForm] = Form.useForm()
  const [issuing,  setIssuing]  = useState(false)

  useEffect(() => { api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || [])) }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = filter !== 'all' ? { status: filter, limit: 500 } : { limit: 500 }
    api.getClothing(params).then(r => setRows(r.data || [])).finally(() => setLoading(false))
  }, [filter])
  useEffect(() => { load() }, [load])

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({ quantity: 1 })
    setModal(true)
  }
  const create = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createClothing({ ...v, quantity: Number(v.quantity) })
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const action = async (id, fn, ok) => {
    setActioning(id)
    try { await fn(id); load(); message.success(ok) } finally { setActioning(null) }
  }

  const counts = {
    all:      rows.length,
    pending:  rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    issued:   rows.filter(r => r.status === 'issued').length,
  }

  const cols = [
    { title: 'Огноо', dataIndex: 'created_at', width: 90,
      render: v => v ? dayjs(v).format('MM-DD') : '—' },
    { title: 'Ажилтан', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Хувцасны төрөл', dataIndex: 'item_type',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Хэмжээ', dataIndex: 'size', width: 80, render: v => v || '—' },
    { title: 'Тоо', dataIndex: 'quantity', width: 70, align: 'right' },
    { title: 'Статус', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v] || v}</Tag> },
    { title: 'Тэмдэглэл', dataIndex: 'notes', render: v => v || '—' },
    { title: 'Үйлдэл', width: 200, render: (_, r) => (
      <Space size="small">
        {r.status === 'pending' && (
          <>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              loading={actioning === r.id} onClick={() => action(r.id, api.approveClothing, 'Батлагдлаа')}>
              Батлах
            </Button>
            <Button size="small" danger icon={<CloseOutlined />}
              loading={actioning === r.id} onClick={() => action(r.id, api.rejectClothing, 'Татгалзагдлаа')}>
              Татгалзах
            </Button>
          </>
        )}
        {r.status === 'approved' && (
          <Button size="small" type="primary" icon={<GiftOutlined />}
            onClick={() => { setIssueFor(r); issueForm.resetFields() }}>
            Олгох
          </Button>
        )}
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Хувцас хэрэглэл</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Хүсэлт нэмэх</Button>
      </div>

      <Card>
        <Radio.Group value={filter} onChange={e => setFilter(e.target.value)}
          style={{ marginBottom: 12 }} buttonStyle="solid">
          {[
            ['all', 'Бүгд'],
            ['pending', 'Хүлээгдэж буй'],
            ['approved', 'Батлагдсан'],
            ['issued', 'Олгосон'],
          ].map(([k, l]) => (
            <Radio.Button key={k} value={k}>{l} ({counts[k] ?? 0})</Radio.Button>
          ))}
        </Radio.Group>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{ emptyText: 'Хүсэлт алга' }} />
      </Card>

      <Modal
        title="Хувцасны хүсэлт нэмэх"
        open={modal} onOk={create} onCancel={() => setModal(false)}
        okText="Хадгалах" cancelText="Болих" confirmLoading={saving} destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
          <Form.Item name="item_type" label="Хувцасны төрөл" rules={[{ required: true }]}>
            <Input placeholder="Каска, Жилет, Гутал..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="size" label="Хэмжээ">
                <Select allowClear placeholder="-- Сонгох --" options={SIZES.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="Тоо ширхэг">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Тэмдэглэл"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* Олгохдоо RFID таг уншуулна. Таггүй олгосон хэрэгсэл хаалганд
          илрэхгүй тул ажилтан «дутуу» гэж бүртгэгдэнэ. */}
      <Modal
        open={!!issueFor}
        title={`Хувцас олгох — ${issueFor?.full_name || ''}`}
        okText="Олгох" cancelText="Болих" confirmLoading={issuing}
        onCancel={() => setIssueFor(null)}
        onOk={async () => {
          try {
            const v = await issueForm.validateFields()
            setIssuing(true)
            const r = await api.issueClothing(issueFor.id, v.rfid_tag ? { rfid_tag: v.rfid_tag } : {})
            if (r.data?.rfid?.created) message.success('Олгогдож, RFID таг бүртгэгдлээ')
            else message.warning('Олгогдлоо — RFID таг бүртгээгүй тул хаалганд илрэхгүй')
            setIssueFor(null); load()
          } catch (e) {
            if (e?.errorFields) return
            message.error(e?.response?.data?.message || 'Олгоход алдаа гарлаа')
          } finally { setIssuing(false) }
        }}>
        <div style={{ marginBottom: 12 }}>
          <b>{issueFor?.item_name}</b>
          {issueFor?.size ? ` · ${issueFor.size}` : ''}
          {issueFor?.quantity > 1 ? ` · ${issueFor.quantity} ш` : ''}
        </div>
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="RFID таг заавал уншуулна уу"
          description="Таггүй олгосон хэрэгслийг хаалганы уншигч таньдаггүй тул ажилтан «хамгаалах хэрэгсэл дутуу» гэж бүртгэгдэж, сануулга эсвэл торгууль хүртэнэ." />
        <Form form={issueForm} layout="vertical">
          <Form.Item name="rfid_tag" label="RFID таг (EPC)"
            extra="Ширээний уншигч дээр тагийг уншуулаад буусан утгыг энд буулгана. Дараа нь «Хувцасны RFID» цэснээс ч бүртгэж болно."
            rules={[{ pattern: /^[A-Za-z0-9_-]{6,64}$/, message: '6–64 тэмдэгт, зөвхөн үсэг/тоо' }]}>
            <Input placeholder="жишээ: E2806894000050350BB478E6" style={{ fontFamily: 'monospace' }} autoComplete="off" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
