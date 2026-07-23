import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space,
  Popconfirm, Alert, Tabs, Checkbox, Dropdown, message,
} from 'antd'
import {
  PlusOutlined, SendOutlined, MailOutlined, MessageOutlined,
  PlayCircleOutlined, SettingOutlined,
} from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const ROLE_LABEL = {
  director: 'Захирал', manager: 'Менежер', engineer: 'Инженер',
  safety_officer: 'Аюулгүйн ажилтан', other: 'Бусад',
}
const ROLE_COLOR = { director: 'red', manager: 'blue', engineer: 'green', safety_officer: 'orange', other: 'default' }
const STATUS_COLOR = { queued: 'default', sent: 'success', failed: 'error', skipped: 'warning' }
const STATUS_LABEL = { queued: 'Дараалалд', sent: 'Илгээгдсэн', failed: 'Амжилтгүй', skipped: 'Алгассан' }

export default function Notifications() {
  const [tab, setTab] = useState('recipients')
  const [events, setEvents] = useState({})
  const [recipients, setRecipients] = useState([])
  const [log, setLog] = useState([])
  const [logPage, setLogPage] = useState({ current: 1, pageSize: 50, total: 0 })
  const [loading, setLoading] = useState(true)
  const [logLoading, setLogLoading] = useState(false)

  const [modal, setModal] = useState(false)
  const [form]  = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const [subModal, setSubModal] = useState(null)  // recipient obj
  const [subForm]  = Form.useForm()
  const [subSaving,setSubSaving]= useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([api.getNotificationEvents(), api.getRecipients()])
      .then(([ev, rc]) => { setEvents(ev.data || {}); setRecipients(rc.data || []) })
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const loadLog = useCallback((p = 1, l = 50) => {
    setLogLoading(true)
    api.getNotificationLog({ page: p, limit: l })
      .then(r => {
        setLog(r.data || [])
        setLogPage({ current: p, pageSize: l, total: r.total || (r.data || []).length })
      }).finally(() => setLogLoading(false))
  }, [])
  useEffect(() => { if (tab === 'log') loadLog(1, logPage.pageSize) /* eslint-disable-next-line */ }, [tab])

  // ── Recipient CRUD ──
  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ role: 'manager' })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      full_name: r.full_name, role: r.role,
      email: r.email || '', phone: r.phone || '',
      is_active: r.is_active, notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      editing ? await api.updateRecipient(editing, v) : await api.createRecipient(v)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.removeRecipient(id); load(); message.success('Устгагдлаа') }

  // ── Subscriptions ──
  const openSubs = (r) => {
    const chosen = {}
    Object.keys(events).forEach(ev => {
      chosen[ev] = { email: false, sms: false }
    })
    ;(r.subscriptions || []).forEach(s => {
      if (chosen[s.event_type]) chosen[s.event_type][s.channel] = !!s.enabled
    })
    subForm.setFieldsValue(chosen)
    setSubModal(r)
  }
  const saveSubs = async () => {
    try {
      const v = await subForm.getFieldsValue()
      const subs = []
      Object.entries(v).forEach(([event_type, ch]) => {
        if (ch?.email) subs.push({ event_type, channel: 'email' })
        if (ch?.sms)   subs.push({ event_type, channel: 'sms' })
      })
      setSubSaving(true)
      await api.setRecipientSubs(subModal.id, { subscriptions: subs })
      setSubModal(null); load(); message.success('Захиалга шинэчлэгдлээ')
    } finally { setSubSaving(false) }
  }

  // ── Test send ──
  const testSend = async (r, channel) => {
    try {
      await api.testSendNotification({ recipient_id: r.id, channel })
      message.success(`Тест ${channel === 'email' ? 'email' : 'SMS'} илгээгдлээ`)
      if (tab === 'log') loadLog(logPage.current, logPage.pageSize)
    } catch (e) { message.error('Илгээхэд алдаа гарлаа') }
  }

  // ── Manual report trigger ──
  const runReport = async (kind) => {
    try {
      const r = await api.runReportManually(kind)
      message.success(`${kind} тайлан илгээгдлээ (${r.data?.sent || 0} recipient)`)
      if (tab === 'log') loadLog(logPage.current, logPage.pageSize)
    } catch (e) { message.error('Илгээхэд алдаа гарлаа') }
  }

  const rCols = [
    { title: 'Нэр', dataIndex: 'full_name',
      render: v => <strong>{v}</strong> },
    { title: 'Албан тушаал', dataIndex: 'role', width: 140,
      render: v => <Tag color={ROLE_COLOR[v]}>{ROLE_LABEL[v] || v}</Tag> },
    { title: 'Email', dataIndex: 'email', render: v => v ? <code>{v}</code> : '—' },
    { title: 'Утас', dataIndex: 'phone', width: 130, render: v => v || '—' },
    { title: 'Захиалсан', dataIndex: 'subscriptions', width: 100, align: 'center',
      render: v => (v || []).length > 0 ? <Tag color="cyan">{v.length}</Tag> : <Tag>—</Tag> },
    { title: 'Идэвх', dataIndex: 'is_active', width: 80,
      render: v => v ? <Tag color="success">✓</Tag> : <Tag>Хаагдсан</Tag> },
    { title: 'Үйлдэл', width: 280, render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<SettingOutlined />} onClick={() => openSubs(r)}>Захиалга</Button>
        <Dropdown menu={{ items: [
          { key: 'email', label: 'Email тест', icon: <MailOutlined />, disabled: !r.email,
            onClick: () => testSend(r, 'email') },
          { key: 'sms', label: 'SMS тест', icon: <MessageOutlined />, disabled: !r.phone,
            onClick: () => testSend(r, 'sms') },
        ] }}>
          <Button size="small" icon={<SendOutlined />}>Тест</Button>
        </Dropdown>
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const logCols = [
    { title: 'Огноо', dataIndex: 'created_at', width: 150,
      render: v => dayjs(v).format('MM-DD HH:mm:ss') },
    { title: 'Event', dataIndex: 'event_type', width: 180,
      render: v => <><Tag>{v}</Tag><div style={{ fontSize: 11, color: '#8c8c8c' }}>{events[v] || ''}</div></> },
    { title: 'Суваг', dataIndex: 'channel', width: 80,
      render: v => v === 'email' ? <MailOutlined /> : <MessageOutlined /> },
    { title: 'Хүлээн авагч', width: 200,
      render: (_, r) => r.recipient_email || r.recipient_phone || '—' },
    { title: 'Гарчиг', dataIndex: 'subject', render: v => v || '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 120,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: 'Алдаа', dataIndex: 'error_message', width: 200,
      render: v => v ? <span style={{ color: '#cf1322', fontSize: 11 }}>{v}</span> : '—' },
  ]

  const tabItems = [
    { key: 'recipients', label: `Хүлээн авагч (${recipients.length})`, children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Button.Group>
                <Button icon={<PlayCircleOutlined />} onClick={() => runReport('daily')}>Өдрийн тайлан</Button>
                <Button icon={<PlayCircleOutlined />} onClick={() => runReport('weekly')}>Долоо хоногийн</Button>
                <Button icon={<PlayCircleOutlined />} onClick={() => runReport('monthly')}>Сарын</Button>
              </Button.Group>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Хүлээн авагч нэмэх</Button>
          </div>
        </Card>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={rCols} dataSource={recipients}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Хүлээн авагч алга' }} />
        </Card>
      </>
    ) },
    { key: 'log', label: 'Илгээсэн түүх', children: (
      <Card>
        <Table rowKey="id" size="small" loading={logLoading}
          columns={logCols} dataSource={log}
          pagination={{ ...logPage, onChange: (p, s) => loadLog(p, s) }}
          locale={{ emptyText: 'Мэдэгдэл алга' }} />
      </Card>
    ) },
  ]

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Мэдэгдэл (Email / SMS)</h4>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Автомат тайлан ба мэдэгдэл"
        description={<>
          Хүлээн авагч бүрд ямар event-т захиалах, аль сувгаар (email/SMS) хүлээн авахыг тохируулна.
          <br />
          <strong>Хуваарь:</strong> Өдөр тутам 08:00, Даваа 08:15, сарын 1-нд 08:30 (Улаанбаатарын цагаар).
          Хүнд/нас барсан осол гарсан үед даруй илгээгдэнэ.
        </>} />

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Хүлээн авагч засах' : 'Хүлээн авагч нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={16}><Form.Item name="full_name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="role" label="Албан тушаал">
                <Select options={Object.entries(ROLE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input placeholder="director@..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Утас"><Input placeholder="99887766" /></Form.Item></Col>
            {editing && (
              <Col span={24}>
                <Form.Item name="is_active" valuePropName="checked">
                  <Checkbox>Идэвхтэй</Checkbox>
                </Form.Item>
              </Col>
            )}
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={!!subModal} onOk={saveSubs} onCancel={() => setSubModal(null)}
        title={subModal ? `Захиалга — ${subModal.full_name}` : ''} confirmLoading={subSaving}
        okText="Хадгалах" cancelText="Болих" width={720} destroyOnClose>
        {subModal && (
          <>
            <Alert type="info" showIcon style={{ marginBottom: 12 }}
              message="Event тус бүр Email эсвэл SMS сонгож болно"
              description={<>
                {!subModal.email && <div>⚠ Email хаяг оруулаагүй тул email checkbox идэвхгүй</div>}
                {!subModal.phone && <div>⚠ Утасны дугаар оруулаагүй тул SMS checkbox идэвхгүй</div>}
              </>} />
            <Form form={subForm} layout="vertical">
              <Table size="small" rowKey={(_, i) => i} pagination={false}
                columns={[
                  { title: 'Event', dataIndex: 'ev', render: (v, _, i) => (
                    <><Tag>{v}</Tag><div style={{ fontSize: 11, color: '#8c8c8c' }}>{events[v]}</div></>
                  ) },
                  { title: <MailOutlined />, dataIndex: 'ev', width: 60, align: 'center', render: (v) => (
                    <Form.Item name={[v, 'email']} valuePropName="checked" noStyle>
                      <Checkbox disabled={!subModal.email} />
                    </Form.Item>
                  ) },
                  { title: <MessageOutlined />, dataIndex: 'ev', width: 60, align: 'center', render: (v) => (
                    <Form.Item name={[v, 'sms']} valuePropName="checked" noStyle>
                      <Checkbox disabled={!subModal.phone} />
                    </Form.Item>
                  ) },
                ]}
                dataSource={Object.keys(events).filter(k => k !== 'test').map(ev => ({ ev }))} />
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}
