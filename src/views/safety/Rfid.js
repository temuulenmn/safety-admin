import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  Space, Tabs, Statistic, message,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

export default function Rfid() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tab,     setTab]     = useState('readers')
  const [readers, setReaders] = useState([])
  const [cards,   setCards]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [emps,    setEmps]    = useState([])

  const [scans,      setScans]      = useState([])
  const [scanLoading,setScanLoading]= useState(false)
  const [scanPage,   setScanPage]   = useState({ current: 1, pageSize: 50, total: 0 })
  const [range,      setRange]      = useState([dayjs().subtract(7, 'day'), dayjs()])

  const [modal,   setModal]   = useState(null)  // 'reader' | 'card'
  const [rForm]   = Form.useForm()
  const [cForm]   = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const loadReaders = () => api.getRfidReaders().then(r => setReaders(r.data || []))
  const loadCards   = () => api.getRfidCards().then(r => setCards(r.data || []))

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    loadReaders(); loadCards()
  }, [])

  const loadScans = useCallback((page = 1, limit = 50) => {
    const date_from = range[0].format('YYYY-MM-DD')
    const date_to   = range[1].format('YYYY-MM-DD')
    api.getRfidScanStats({ date_from, date_to }).then(r => setStats(r.data))
    setScanLoading(true)
    api.getRfidScans({ page, limit, date_from, date_to, project_id: currentProjectId || undefined })
      .then(r => {
        setScans(r.data || [])
        setScanPage({ current: page, pageSize: limit, total: r.total || (r.data || []).length })
      }).finally(() => setScanLoading(false))
  }, [range, currentProjectId])
  useEffect(() => { if (tab === 'scans') loadScans(1, scanPage.pageSize) /* eslint-disable-next-line */ }, [tab, range, currentProjectId])

  const openReader = (r) => {
    setEditing(r?.id || null)
    rForm.setFieldsValue(r
      ? { reader_code: r.reader_code, location_name: r.location_name || '', zone: r.zone || '', ip_address: r.ip_address || '' }
      : { reader_code: '', location_name: '', zone: '', ip_address: '' })
    setModal('reader')
  }
  const openCard = () => {
    setEditing(null)
    cForm.resetFields()
    cForm.setFieldsValue({ card_type: 'UHF' })
    setModal('card')
  }
  const save = async () => {
    try {
      if (modal === 'reader') {
        const v = await rForm.validateFields()
        setSaving(true)
        editing ? await api.updateRfidReader(editing, v) : await api.createRfidReader(v)
        loadReaders()
      } else {
        const v = await cForm.validateFields()
        setSaving(true)
        await api.createRfidCard({ ...v, expiry_date: v.expiry_date ? v.expiry_date.format('YYYY-MM-DD') : null })
        loadCards()
      }
      setModal(null); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }

  const readerCols = [
    { title: 'Код', dataIndex: 'reader_code',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Байршил', dataIndex: 'location_name', render: v => v || '—' },
    { title: 'Бүс', dataIndex: 'zone', render: v => v || '—' },
    { title: 'IP', dataIndex: 'ip_address', render: v => v || '—' },
    { title: 'Төлөв', dataIndex: 'is_active', width: 110,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Идэвхгүй'}</Tag> },
    { title: 'Сүүлийн холболт', dataIndex: 'last_heartbeat', width: 150,
      render: v => v ? dayjs(v).format('MM-DD HH:mm') : '—' },
    { title: '', width: 90, render: (_, r) => (
      <Button size="small" onClick={() => openReader(r)}>Засах</Button>
    ) },
  ]

  const cardCols = [
    { title: 'Карт UID', dataIndex: 'card_uid', render: v => <code>{v}</code> },
    { title: 'Ажилтан код', dataIndex: 'emp_code', width: 130 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Төрөл', dataIndex: 'card_type', width: 90 },
    { title: 'Дуусах', dataIndex: 'expiry_date', width: 120,
      render: v => v ? v.slice(0, 10) : '—' },
    { title: 'Төлөв', dataIndex: 'is_active', width: 130,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Блоклогдсон'}</Tag> },
    { title: '', width: 100, render: (_, c) => (
      <Button size="small" type="primary" ghost={!c.is_active} danger={c.is_active}
        onClick={() => api.toggleRfidCard(c.id).then(loadCards)}>
        {c.is_active ? 'Блоклох' : 'Нээх'}
      </Button>
    ) },
  ]

  const scanCols = [
    { title: 'Цаг', dataIndex: 'scanned_at', width: 160,
      render: v => dayjs(v).format('MM-DD HH:mm:ss') },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Карт UID', dataIndex: 'card_uid', width: 140, render: v => <code>{v}</code> },
    { title: 'Байршил', dataIndex: 'location_name', width: 140, render: v => v || '—' },
    { title: 'Бүс', dataIndex: 'zone', width: 100, render: v => v || '—' },
    { title: 'Чиглэл', dataIndex: 'direction', width: 90,
      render: v => <Tag color={v === 'entry' ? 'success' : 'orange'}>{v === 'entry' ? 'Орж' : 'Гарч'}</Tag> },
    { title: 'Үр дүн', dataIndex: 'access_result', width: 130,
      render: v => <Tag color={v === 'granted' ? 'success' : 'error'}>{v}</Tag> },
    { title: 'Шалтгаан', dataIndex: 'deny_reason', render: v => v || '—' },
  ]

  const tabItems = [
    { key: 'readers', label: 'Уншигчид', children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openReader(null)}>Уншигч нэмэх</Button>
        </div>
        <Card>
          <Table rowKey="id" size="middle" columns={readerCols} dataSource={readers}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Уншигч алга' }} />
        </Card>
      </>
    ) },
    { key: 'cards', label: 'Картууд', children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCard}>Карт нэмэх</Button>
        </div>
        <Card>
          <Table rowKey="id" size="middle" columns={cardCols} dataSource={cards}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Карт алга' }} />
        </Card>
      </>
    ) },
    { key: 'scans', label: 'Скан лог', children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Space wrap>
            <DatePicker.RangePicker value={range} onChange={v => v && setRange(v)}
              format="YYYY-MM-DD" allowClear={false} />
            <Button type="primary" icon={<ReloadOutlined />}
              onClick={() => loadScans(1, scanPage.pageSize)}>Хайх</Button>
          </Space>
        </Card>
        {stats && (
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            {[
              ['Нийт скан', stats.today_scans ?? 0, '#1890ff'],
              ['Зөвшөөрсөн', stats.granted ?? 0, '#52c41a'],
              ['Татгалзсан', stats.denied ?? 0, '#cf1322'],
              ['Нэвтэрсэн', stats.entries ?? 0, '#722ed1'],
              ['Гарсан', stats.exits ?? 0, '#faad14'],
            ].map(([l, v, c]) => (
              <Col key={l} xs={12} sm={4} md={4}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic title={l} value={v} valueStyle={{ color: c, fontWeight: 700 }} />
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <Card>
          <Table rowKey="id" size="small" loading={scanLoading}
            columns={scanCols} dataSource={scans}
            pagination={{ ...scanPage, onChange: (p, s) => loadScans(p, s) }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>RFID</h4>
      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal === 'reader'} onOk={save} onCancel={() => setModal(null)}
        title={editing ? 'Уншигч засах' : 'Уншигч нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={rForm} layout="vertical" requiredMark={false}>
          <Form.Item name="reader_code" label="Reader Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="location_name" label="Байршил"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="zone" label="Бүс"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="ip_address" label="IP хаяг"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal open={modal === 'card'} onOk={save} onCancel={() => setModal(null)}
        title="Карт нэмэх" confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={cForm} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
          <Form.Item name="card_uid" label="Карт UID" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="card_type" label="Төрөл">
                <Select options={[
                  { value: 'UHF',     label: 'UHF' },
                  { value: 'HF',      label: 'HF' },
                  { value: 'LF',      label: 'LF' },
                  { value: '2.4Ghz',  label: '2.4Ghz' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiry_date" label="Дуусах огноо"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
