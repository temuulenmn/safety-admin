import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space,
  Tabs, Popconfirm, Statistic, message, Alert,
} from 'antd'
import { PlusOutlined, RollbackOutlined, ScanOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
import dayjs from 'dayjs'

const STATUS_COLOR = { available: 'success', checked_out: 'orange', lost: 'red', damaged: 'default' }
const STATUS_LABEL = { available: 'Бэлэн', checked_out: 'Авагдсан', lost: 'Алдсан', damaged: 'Эвдрэлтэй' }

export default function Tools() {
  const [tab,    setTab]   = useState('inventory')

  // Ширээний UHF уншигчийн горим — багаж + карт хоёрыг дараалан уншуулна
  const [tagF, setTagF] = useState()              // pending | tagged
  const [scanModal, setScanModal] = useState(false)
  const [scanForm]  = Form.useForm()
  const [scanning,  setScanning]  = useState(false)
  const [scanLog,   setScanLog]   = useState([])
  const [stats,  setStats] = useState(null)
  const [emps,   setEmps]  = useState([])

  const [tools,       setTools]       = useState([])
  const [toolLoading, setToolLoading] = useState(false)
  const [toolPage,    setToolPage]    = useState({ current: 1, pageSize: 25, total: 0 })
  const [search,      setSearch]      = useState('')
  const [statusF,     setStatusF]     = useState()

  const [cos,       setCos]       = useState([])
  const [coLoading, setCoLoading] = useState(false)
  const [coPage,    setCoPage]    = useState({ current: 1, pageSize: 25, total: 0 })
  const [coStatus,  setCoStatus]  = useState('open')

  const [tModal,   setTModal]   = useState(false)
  const [tForm]    = Form.useForm()
  const [tEditing, setTEditing] = useState(null)
  const [tSaving,  setTSaving]  = useState(false)

  const [coModal,  setCoModal]  = useState(false)
  const [coForm]   = Form.useForm()
  const [coSaving, setCoSaving] = useState(false)

  const refreshStats = () => api.getToolStats().then(r => setStats(r.data))
  useEffect(() => {
    refreshStats()
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
  }, [])

  const loadTools = useCallback((page = 1, limit = 25) => {
    setToolLoading(true)
    api.getTools({ page, limit, search: search || undefined, status: statusF || undefined })
      .then(r => {
        setTools(r.data || [])
        setToolPage(pageInfo(r, page, limit))
      }).finally(() => setToolLoading(false))
  }, [search, statusF])

  const loadCos = useCallback((page = 1, limit = 25) => {
    setCoLoading(true)
    api.getCheckouts({ page, limit, status: coStatus || undefined })
      .then(r => {
        setCos(r.data || [])
        setCoPage(pageInfo(r, page, limit))
      }).finally(() => setCoLoading(false))
  }, [coStatus])

  useEffect(() => { if (tab === 'inventory') loadTools(1, toolPage.pageSize) /* eslint-disable-next-line */}, [tab, statusF, tagF])
  useEffect(() => { if (tab === 'checkouts') loadCos(1, coPage.pageSize) /* eslint-disable-next-line */}, [tab, coStatus])

  const openToolCreate = () => { setTEditing(null); tForm.resetFields(); setTModal(true) }
  const openToolEdit = (r) => {
    setTEditing(r.id)
    tForm.setFieldsValue({
      code: r.code, name: r.name, rfid_tag: r.rfid_tag,
      category: r.category || '', storekeeper_id: r.storekeeper_id || undefined,
    })
    setTModal(true)
  }
  const saveTool = async () => {
    try {
      const v = await tForm.validateFields()
      setTSaving(true)
      const payload = { ...v, storekeeper_id: v.storekeeper_id || null }
      tEditing ? await api.updateTool(tEditing, payload) : await api.createTool(payload)
      setTModal(false); loadTools(toolPage.current, toolPage.pageSize); refreshStats()
      message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setTSaving(false) }
  }

  const openCheckout = () => { coForm.resetFields(); setCoModal(true) }
  const saveCheckout = async () => {
    try {
      const v = await coForm.validateFields()
      setCoSaving(true)
      await api.checkoutTool({ ...v, storekeeper_id: v.storekeeper_id || null })
      setCoModal(false)
      loadTools(toolPage.current, toolPage.pageSize); loadCos(coPage.current, coPage.pageSize); refreshStats()
      message.success('Олголт бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setCoSaving(false) }
  }
  const returnTool = async (id) => {
    await api.returnTool(id, {})
    loadCos(coPage.current, coPage.pageSize); loadTools(toolPage.current, toolPage.pageSize); refreshStats()
    message.success('Буцаагдлаа')
  }

  const toolCols = [
    { title: 'Код', dataIndex: 'code', width: 110 },
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Ангилал', dataIndex: 'category', width: 130, render: v => v || '—' },
    { title: 'RFID', dataIndex: 'rfid_tag', width: 210,
      render: (v, r) => v
        ? <code style={{ fontSize: 12 }}>{v}</code>
        : <Tag color="warning" style={{ cursor: 'pointer' }}
            onClick={() => openToolEdit(r)}>таг хүлээгдэж буй</Tag> },
    { title: 'Нярав', dataIndex: 'storekeeper_name', width: 140, render: v => v || '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 120,
      render: v => <Tag color={STATUS_COLOR[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag> },
    { title: 'Авсан хүн', width: 160,
      render: (_, r) => r.current_holder?.employee_name || '—' },
    { title: '', width: 90, render: (_, r) => (
      <Button size="small" onClick={() => openToolEdit(r)}>Засах</Button>
    ) },
  ]

  const coCols = [
    { title: 'Авсан', dataIndex: 'checked_out_at', width: 130,
      render: v => v ? dayjs(v).format('MM-DD HH:mm') : '—' },
    { title: 'Код', dataIndex: 'tool_code', width: 100 },
    { title: 'Багаж', dataIndex: 'tool_name' },
    { title: 'Ажилтан', dataIndex: 'full_name',
      render: (v, r) => `${r.emp_code || ''} ${v || ''}` },
    { title: 'Нярав', dataIndex: 'storekeeper_name', width: 140, render: v => v || '—' },
    { title: 'Буцаасан', dataIndex: 'returned_at', width: 130,
      render: v => v ? dayjs(v).format('MM-DD HH:mm') : '—' },
    { title: '', width: 110, render: (_, r) => r.returned_at
      ? <Tag color="success">Буцаагдсан</Tag>
      : <Popconfirm title="Багажийг буцаагдсан гэж тэмдэглэх үү?" onConfirm={() => returnTool(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" type="primary" ghost icon={<RollbackOutlined />}>Буцаах</Button>
        </Popconfirm> },
  ]

  const items = [
    { key: 'inventory', label: 'Багажийн жагсаалт', children: (
      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Хайх..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={() => loadTools(1, toolPage.pageSize)}
              allowClear enterButton />
          </Col>
          <Col xs={24} sm={6}>
            <Select value={statusF} onChange={setStatusF} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Select value={tagF} onChange={setTagF} allowClear
              placeholder="RFID таг" style={{ width: '100%' }}
              options={[
                { value: 'pending', label: 'Таг хүлээгдэж буй' },
                { value: 'tagged',  label: 'Тагтай' },
              ]} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={toolLoading}
          columns={toolCols} dataSource={tools}
          pagination={{ ...toolPage, onChange: (p, s) => loadTools(p, s) }} />
      </Card>
    ) },
    { key: 'checkouts', label: 'Олголт / Буцаалт', children: (
      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={6}>
            <Select value={coStatus} onChange={setCoStatus} style={{ width: '100%' }}
              options={[
                { value: 'open',   label: 'Идэвхтэй' },
                { value: 'closed', label: 'Буцаагдсан' },
                { value: '',       label: 'Бүгд' },
              ]} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={coLoading}
          columns={coCols} dataSource={cos}
          pagination={{ ...coPage, onChange: (p, s) => loadCos(p, s) }} />
      </Card>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Багаж хэрэгсэл</h4>
        <Space>
          <Button icon={<ScanOutlined />} onClick={() => { setScanModal(true); setScanLog([]); scanForm.resetFields() }}>
            RFID уншуулах
          </Button>
          <Button icon={<PlusOutlined />} onClick={openCheckout}>Багаж олгох</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openToolCreate}>Багаж нэмэх</Button>
        </Space>
      </div>

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            ['Нийт',      stats.total,       '#1890ff'],
            ['Бэлэн',     stats.available,   '#52c41a'],
            ['Авагдсан',  stats.checked_out, '#faad14'],
            ['Алдсан',    stats.lost,        '#cf1322'],
            ['Эвдрэлтэй', stats.damaged,     '#8c8c8c'],
            ['Таггүй',    stats.tag_pending, '#fa8c16'],
          ].map(([l, v, c]) => (
            <Col key={l} xs={12} sm={4} md={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title={l} value={v ?? 0} valueStyle={{ color: c, fontWeight: 700 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {stats?.tag_pending > 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message={`${stats.tag_pending} багаж физик RFID тагтай биш`}
          description="Эдгээр багаж хаалганы уншигчид хэзээ ч илрэхгүй. Таг наасны дараа «RFID таг» баганын шар тэмдэглэгээ дээр дарж EPC-г оруулна уу."
          action={<Button size="small" onClick={() => { setTab('inventory'); setTagF('pending') }}>Харах</Button>} />
      )}

      <Tabs activeKey={tab} onChange={setTab} items={items} />

      <Modal open={tModal} onOk={saveTool} onCancel={() => setTModal(false)}
        title={tEditing ? 'Багаж засах' : 'Багаж нэмэх'} confirmLoading={tSaving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={tForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="code" label="Код" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="Ангилал"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={24}>
              <Form.Item name="rfid_tag" label="RFID таг (EPC)"
                extra="Хоосон үлдээвэл «таг хүлээгдэж буй» болно. Уншигч дээр уншуулаад буусан утгыг буулгана."
                rules={[{ pattern: /^([0-9A-Fa-f]{24}|[0-9A-Fa-f]{32})$/, message: '24 (EPC-96) эсвэл 32 (EPC-128) hex тэмдэгт' }]}>
                <Input placeholder="E2806894000050350BB478E6" style={{ fontFamily: 'monospace' }} allowClear />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="storekeeper_id" label="Нярав">
                <Select allowClear showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.filter(e => e.position === 'Нярав').map(e => ({
                    value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={coModal} onOk={saveCheckout} onCancel={() => setCoModal(false)}
        title="Багаж олгох" confirmLoading={coSaving}
        okText="Олгох" cancelText="Болих" destroyOnClose>
        <Form form={coForm} layout="vertical" requiredMark={false}>
          <Form.Item name="tool_id" label="Багаж (ID)" rules={[{ required: true }]}>
            <Input placeholder="Багаж ID" />
          </Form.Item>
          <Form.Item name="employee_id" label="Авах хүн" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
          <Form.Item name="storekeeper_id" label="Нярав">
            <Select allowClear showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.filter(e => e.position === 'Нярав').map(e => ({
                value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Ширээний UHF уншигчийн горим. Багаж + ажилтны картыг дараалан
          уншуулахад сервер олголт/буцаалтыг автоматаар шийднэ. */}
      <Modal open={scanModal} onCancel={() => setScanModal(false)} width={560}
        title="RFID уншуулж олгох / буцаах" footer={null} destroyOnClose>
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="Хоёр тагийг дараалан уншуулна"
          description="Багажны таг ба ажилтны картыг ширээний уншигч дээр уншуулаад «Гүйцэтгэх» дарна. Багаж чөлөөтэй бол олгогдоно, хэн нэгний гарт байвал буцаагдана." />
        <Form form={scanForm} layout="vertical"
          onFinish={async (v) => {
            setScanning(true)
            try {
              const r = await api.scanCheckoutTool({ tool_uid: v.tool_uid.trim(), card_uid: v.card_uid.trim() })
              const d = r.data || {}
              const line = {
                at: new Date().toLocaleTimeString('mn-MN'),
                action: d.action, tool: d.tool?.code || v.tool_uid,
                name: d.tool?.name || '', who: d.employee?.full_name || '',
              }
              setScanLog(l => [line, ...l].slice(0, 8))
              message.success(d.action === 'returned' ? `${line.tool} буцаагдлаа` : `${line.tool} → ${line.who}`)
              scanForm.resetFields()
              document.getElementById('scan-tool-uid')?.focus()
              loadTools(1, toolPage.pageSize); loadCos(1, coPage.pageSize); refreshStats()
            } catch (e) {
              message.error(e?.response?.data?.message || 'Скан амжилтгүй')
            } finally { setScanning(false) }
          }}>
          <Form.Item name="tool_uid" label="Багажны RFID таг" rules={[{ required: true, message: 'Багажны тагийг уншуулна уу' }]}>
            <Input id="scan-tool-uid" autoFocus placeholder="уншигч дээр багажийг тавина" style={{ fontFamily: 'monospace' }} autoComplete="off" />
          </Form.Item>
          <Form.Item name="card_uid" label="Ажилтны картын UID" rules={[{ required: true, message: 'Ажилтны картыг уншуулна уу' }]}>
            <Input placeholder="дараа нь ажилтны картыг тавина" style={{ fontFamily: 'monospace' }} autoComplete="off" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={scanning} block>Гүйцэтгэх</Button>
        </Form>

        {scanLog.length > 0 && (
          <>
            <div style={{ margin: '18px 0 8px', fontWeight: 500 }}>Сүүлийн уншилтууд</div>
            <Table size="small" rowKey={(_, i) => i} pagination={false} dataSource={scanLog}
              columns={[
                { title: 'Цаг', dataIndex: 'at', width: 80 },
                { title: 'Багаж', dataIndex: 'tool', width: 110,
                  render: (v, r) => <span>{v} <span style={{ color: '#8c8c8c' }}>{r.name}</span></span> },
                { title: 'Үйлдэл', dataIndex: 'action', width: 100,
                  render: v => <Tag color={v === 'returned' ? 'blue' : 'green'}>{v === 'returned' ? 'Буцаав' : 'Олгов'}</Tag> },
                { title: 'Ажилтан', dataIndex: 'who' },
              ]} />
          </>
        )}
      </Modal>
    </div>
  )
}
