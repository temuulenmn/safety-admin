import React, { useEffect, useState, useMemo } from 'react'
import {
  Row, Col, Card, Tag, Button, Modal, Form, Input, Select, DatePicker,
  Table, Space, Empty, Spin, Tabs, Alert, Popconfirm, message,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = { pending: 'orange', scheduled: 'cyan', in_progress: 'blue', completed: 'success', cancelled: 'default' }
const STATUS_LABEL = { pending: 'Хүлээгдэж буй', scheduled: 'Товлогдсон', in_progress: 'Үргэлжилж буй', completed: 'Дууссан', cancelled: 'Цуцлагдсан' }
const PSTATUS_COLOR = { registered: 'default', attended: 'cyan', passed: 'success', failed: 'error', absent: 'warning' }
const PSTATUS_LABEL = { registered: 'Бүртгэгдсэн', attended: 'Ирсэн', passed: 'Тэнцсэн', failed: 'Тэнцээгүй', absent: 'Ирээгүй' }
const fmt = n => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function Training() {
  const [tab, setTab] = useState('catalog')
  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Аюулгүйн сургалт</h4>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'catalog', label: 'Сургалтын каталог', children: <CatalogTab onOrdered={() => setTab('orders')} /> },
        { key: 'orders',  label: 'Миний захиалга',   children: <OrdersTab /> },
      ]} />
    </div>
  )
}

function CatalogTab({ onOrdered }) {
  const [items,    setItems]    = useState([])
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState()
  const [picking,  setPicking]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getTrainingCatalog({ search: search || undefined, category: category || undefined, limit: 200 })
      .then(r => setItems(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [category])
  useEffect(() => { api.getTrainingCategories().then(r => setCats(r.data || [])) }, [])

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Сургалт хайх..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={load}
              allowClear enterButton />
          </Col>
          <Col xs={24} sm={6}>
            <Select value={category} onChange={setCategory} allowClear
              placeholder="Бүх ангилал" style={{ width: '100%' }}
              options={cats.map(c => ({ value: c, label: c }))} />
          </Col>
        </Row>
      </Card>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> : (
        items.length === 0 ? <Empty description="Сургалт алга" style={{ padding: 60 }} /> : (
          <Row gutter={[16, 16]}>
            {items.map(it => (
              <Col key={it.id} xs={24} sm={12} lg={8}>
                <Card style={{ height: '100%' }} bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color="blue">{it.category || '—'}</Tag>
                    {it.is_mandatory && <Tag color="red">Заавал</Tag>}
                  </Space>
                  <h5 style={{ marginBottom: 8 }}>{it.title}</h5>
                  <p style={{
                    color: '#8c8c8c', fontSize: 13, marginBottom: 12,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{it.description}</p>
                  <div style={{ fontSize: 12, marginBottom: 12 }}>
                    <div>⏱ {it.duration_hours} цаг · хүчинтэй {it.validity_months} сар</div>
                    <div>📍 {it.mode || '—'}</div>
                  </div>
                  <div style={{
                    marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f0f0f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#1890ff' }}>
                      {fmt(it.price_per_person)}<small style={{ color: '#8c8c8c' }}> /хүн</small>
                    </span>
                    <Button type="primary" size="small" onClick={() => setPicking(it)}>Захиалах →</Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )
      )}

      {picking && <EnrollModal catalog={picking} onClose={() => setPicking(null)}
        onSuccess={() => { setPicking(null); onOrdered() }} />}
    </>
  )
}

function EnrollModal({ catalog, onClose, onSuccess }) {
  const [emps,    setEmps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [deptF,   setDeptF]   = useState()
  const [selected,setSelected]= useState([])
  const [reqDate, setReqDate] = useState(dayjs().add(7, 'day'))
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    api.getEmployees({ status: 'active', limit: 500 })
      .then(r => setEmps(r.data || [])).finally(() => setLoading(false))
  }, [])

  const departments = useMemo(() => [...new Set(emps.map(e => e.department_name).filter(Boolean))].sort(), [emps])

  const filtered = useMemo(() => emps.filter(e => {
    if (deptF && e.department_name !== deptF) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${e.first_name} ${e.last_name} ${e.emp_code} ${e.position || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [emps, search, deptF])

  const total = selected.length * Number(catalog.price_per_person || 0)

  const submit = async () => {
    setError('')
    if (selected.length === 0) return setError('Хамгийн багадаа 1 ажилтан сонгоно уу')
    setSaving(true)
    try {
      await api.createTrainingOrder({
        catalog_id: catalog.id,
        requested_date: reqDate.format('YYYY-MM-DD'),
        employee_ids: selected,
        note: note || null,
      })
      message.success('Захиалга илгээгдлээ')
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }

  const cols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', render: (_, e) => <span style={{ fontWeight: 600 }}>{e.last_name} {e.first_name}</span> },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
  ]

  return (
    <Modal open onCancel={onClose} width={960} maskClosable={false}
      title={`Сургалтад хамруулах — ${catalog.title}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            Нийт: <span style={{ color: '#1890ff' }}>{fmt(total)}</span>
            <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>
              ({selected.length} хүн × {fmt(catalog.price_per_person)})
            </span>
          </div>
          <Space>
            <Button onClick={onClose}>Болих</Button>
            <Button type="primary" onClick={submit} loading={saving} disabled={selected.length === 0}>
              Захиалга илгээх
            </Button>
          </Space>
        </div>
      }>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Үргэлжлэх</div>
          <div style={{ fontWeight: 600 }}>{catalog.duration_hours} цаг</div>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Хүчинтэй</div>
          <div style={{ fontWeight: 600 }}>{catalog.validity_months} сар</div>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Нэг хүнд</div>
          <div style={{ fontWeight: 600, color: '#1890ff' }}>{fmt(catalog.price_per_person)}</div>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Хүсэлтийн огноо</div>
          <DatePicker value={reqDate} onChange={setReqDate} style={{ width: '100%' }} allowClear={false} />
        </Col>
      </Row>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <Card size="small"
        title={<span>Ажилтан сонгох <Tag color="blue">{selected.length}</Tag></span>}
        extra={
          <Space>
            <Input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)}
              prefix={<SearchOutlined />} style={{ width: 180 }} allowClear />
            <Select value={deptF} onChange={setDeptF} allowClear
              placeholder="Бүх хэлтэс" style={{ width: 160 }}
              options={departments.map(d => ({ value: d, label: d }))} />
          </Space>
        }>
        <Table rowKey="id" size="small" loading={loading} columns={cols} dataSource={filtered}
          scroll={{ y: 300 }} pagination={{ pageSize: 50, hideOnSinglePage: true }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: setSelected,
          }}
          locale={{ emptyText: 'Ажилтан алга' }} />
      </Card>

      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 4 }}>Нэмэлт тэмдэглэл</div>
        <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </div>
    </Modal>
  )
}

function OrdersTab() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState()
  const [detail,  setDetail]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getTrainingOrders({ status: status || undefined, limit: 200 })
      .then(r => setOrders(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [status])

  const open = (id) => api.getTrainingOrder(id).then(r => setDetail(r.data))
  const cancel = async (id) => {
    await api.cancelTrainingOrder(id); load()
    if (detail?.id === id) open(id)
    message.success('Захиалга цуцлагдлаа')
  }

  const cols = [
    { title: '№', dataIndex: 'order_number', render: v => <code>{v}</code> },
    { title: 'Сургалт', dataIndex: 'title', render: v => <strong>{v}</strong> },
    { title: 'Захиалсан', dataIndex: 'ordered_at', width: 120,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Товлогдсон', dataIndex: 'scheduled_date', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Хамрагдах', dataIndex: 'participant_count', width: 100 },
    { title: 'Тэнцсэн', dataIndex: 'passed_count', width: 100,
      render: v => <Tag color="success">{v}</Tag> },
    { title: 'Дүн', dataIndex: 'total_amount', width: 130,
      render: v => <strong>{fmt(v)}</strong> },
    { title: 'Төлөв', dataIndex: 'status', width: 140,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: '', width: 100, render: (_, o) => (
      (o.status === 'pending' || o.status === 'scheduled') && (
        <Popconfirm title="Захиалга цуцлах уу?" onConfirm={(e) => { e.stopPropagation(); cancel(o.id) }}
          onCancel={e => e.stopPropagation()} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger onClick={e => e.stopPropagation()}>Цуцлах</Button>
        </Popconfirm>
      )
    ) },
  ]

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Select value={status} onChange={setStatus} allowClear
          placeholder="Бүх төлөв" style={{ width: 200 }}
          options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
      </Card>
      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={orders}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Захиалга алга' }}
          onRow={(o) => ({ onClick: () => open(o.id), style: { cursor: 'pointer' } })} />
      </Card>
      {detail && <OrderDetailModal order={detail}
        onClose={() => { setDetail(null); load() }} onRefresh={() => open(detail.id)} />}
    </>
  )
}

function OrderDetailModal({ order, onClose, onRefresh }) {
  const [emps,     setEmps]     = useState([])
  const [addMode,  setAddMode]  = useState(false)
  const [search,   setSearch]   = useState('')
  const [picking,  setPicking]  = useState([])
  const [adding,   setAdding]   = useState(false)
  const [selected, setSelected] = useState([])
  const [bulkSt,   setBulkSt]   = useState('passed')

  useEffect(() => {
    if (addMode) api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
  }, [addMode])

  const existingIds = new Set(order.participants?.map(p => p.employee_id) || [])
  const candidates = emps.filter(e => !existingIds.has(e.id))
    .filter(e => !search || `${e.last_name} ${e.first_name} ${e.emp_code}`.toLowerCase().includes(search.toLowerCase()))

  const doAdd = async () => {
    if (picking.length === 0) return
    setAdding(true)
    try {
      await api.addTrainingParticipants(order.id, { employee_ids: picking })
      setAddMode(false); setPicking([]); onRefresh()
      message.success('Нэмэгдлээ')
    } finally { setAdding(false) }
  }

  const bulkUpdate = async () => {
    if (selected.length === 0) return
    await api.bulkUpdateParticipants(order.id, {
      participant_ids: selected, status: bulkSt,
      completion_date: dayjs().format('YYYY-MM-DD'),
    })
    setSelected([]); onRefresh(); message.success('Шинэчлэгдлээ')
  }

  const removeOne = async (pid) => {
    await api.removeTrainingParticipant(order.id, pid); onRefresh()
    message.success('Хасагдлаа')
  }

  const canManage = order.status !== 'cancelled' && order.status !== 'completed'

  const candCols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', render: (_, e) => `${e.last_name} ${e.first_name}` },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
  ]

  const partCols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', dataIndex: 'full_name', render: v => <strong>{v}</strong> },
    { title: 'Хэлтэс', dataIndex: 'department', render: v => v || '—' },
    { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={PSTATUS_COLOR[v]}>{PSTATUS_LABEL[v]}</Tag> },
    { title: 'Хүчинтэй', dataIndex: 'expiry_date', width: 110,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: '', width: 60, render: (_, p) => (
      canManage && order.status === 'pending' && (
        <Popconfirm title="Хасах уу?" onConfirm={() => removeOne(p.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      )
    ) },
  ]

  return (
    <Modal open onCancel={onClose} width={1000} maskClosable={false}
      title={`${order.order_number} — ${order.title}`}
      footer={<Button onClick={onClose}>Хаах</Button>}>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Төлөв</div>
          <Tag color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Tag>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Товлогдсон</div>
          <div>{order.scheduled_date ? dayjs(order.scheduled_date).format('YYYY-MM-DD') : '—'}</div>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Багш</div>
          <div>{order.trainer_name || '—'}</div>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Нийт</div>
          <div style={{ fontWeight: 700, color: '#1890ff' }}>{fmt(order.total_amount)}</div>
        </Col>
      </Row>

      <Card size="small"
        title={`Оролцогчид (${order.participants?.length || 0})`}
        extra={canManage && !addMode && (
          <Space>
            {selected.length > 0 && (
              <>
                <Select value={bulkSt} onChange={setBulkSt} size="small" style={{ width: 160 }}
                  options={Object.entries(PSTATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
                <Popconfirm title={`${selected.length} оролцогчийг өөрчлөх үү?`} onConfirm={bulkUpdate} okText="Тийм" cancelText="Үгүй">
                  <Button size="small" type="primary">Бөөнөөр өөрчлөх ({selected.length})</Button>
                </Popconfirm>
              </>
            )}
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddMode(true)}>Ажилтан нэмэх</Button>
          </Space>
        )}>
        {addMode ? (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)}
                prefix={<SearchOutlined />} style={{ maxWidth: 300 }} allowClear />
              <Tag color="blue">{picking.length}</Tag>
              <div style={{ marginLeft: 'auto' }}>
                <Space>
                  <Button size="small" onClick={() => { setAddMode(false); setPicking([]) }}>Болих</Button>
                  <Button size="small" type="primary" onClick={doAdd} loading={adding} disabled={picking.length === 0}>
                    Нэмэх ({picking.length})
                  </Button>
                </Space>
              </div>
            </div>
            <Table rowKey="id" size="small" columns={candCols} dataSource={candidates}
              scroll={{ y: 320 }} pagination={{ pageSize: 50, hideOnSinglePage: true }}
              rowSelection={{ selectedRowKeys: picking, onChange: setPicking }} />
          </>
        ) : (
          <Table rowKey="id" size="small" columns={partCols} dataSource={order.participants || []}
            scroll={{ y: 320 }} pagination={{ pageSize: 50, hideOnSinglePage: true }}
            rowSelection={canManage ? { selectedRowKeys: selected, onChange: setSelected } : undefined}
            locale={{ emptyText: 'Оролцогч алга' }} />
        )}
      </Card>
    </Modal>
  )
}
