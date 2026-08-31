import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  Space, Tabs, Statistic, Popconfirm, InputNumber, message,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
import dayjs from 'dayjs'

export default function Ppe() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tab, setTab] = useState('items')
  const [categories, setCategories] = useState([])
  const [items,      setItems]      = useState([])
  const [checks,     setChecks]     = useState([])
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(false)

  const [modal,    setModal]    = useState(null)  // 'category' | 'item'
  const [catForm]  = Form.useForm()
  const [itemForm] = Form.useForm()
  const [editing,  setEditing]  = useState(null)
  const [saving,   setSaving]   = useState(false)

  const [range, setRange] = useState([dayjs().subtract(7, 'day'), dayjs()])

  const loadCategories = () => api.getPpeCategories().then(r => setCategories(r.data || []))
  const [itemPage, setItemPage] = useState({ current: 1, pageSize: 50, total: 0 })
  const loadItems = (page = 1, limit = 50) =>
    api.getPpeItems({ page, limit })
      .then(r => { setItems(r.data || []); setItemPage(pageInfo(r, page, limit)) })
      .catch(() => {})
  useEffect(() => { loadCategories(); loadItems() }, [])

  const loadChecks = useCallback(() => {
    setLoading(true)
    const date_from = range[0].format('YYYY-MM-DD')
    const date_to   = range[1].format('YYYY-MM-DD')
    Promise.all([
      api.getPpeChecks({ date_from, date_to, project_id: currentProjectId || undefined, limit: 500 }),
      api.getPpeCheckStats({ date_from, date_to }),
    ]).then(([c, s]) => { setChecks(c.data || []); setStats(s.data) }).finally(() => setLoading(false))
  }, [range, currentProjectId])
  useEffect(() => { if (tab === 'checks') loadChecks() }, [tab, loadChecks])

  const openCategory = (r) => {
    setEditing(r?.id || null); catForm.resetFields()
    catForm.setFieldsValue(r ? { name: r.name, description: r.description || '' } : {})
    setModal('category')
  }
  const openItem = (r) => {
    setEditing(r?.id || null); itemForm.resetFields()
    itemForm.setFieldsValue(r
      ? { name: r.name, category_id: r.category_id || undefined, unit: r.unit || '', reorder_level: r.reorder_level ?? null }
      : {})
    setModal('item')
  }
  const save = async () => {
    try {
      if (modal === 'category') {
        const v = await catForm.validateFields()
        setSaving(true)
        editing ? await api.updatePpeCategory(editing, v) : await api.createPpeCategory(v)
        loadCategories()
      } else {
        const v = await itemForm.validateFields()
        setSaving(true)
        editing ? await api.updatePpeItem(editing, v) : await api.createPpeItem(v)
        loadItems()
      }
      setModal(null); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const removeCategory = async (id) => { await api.deletePpeCategory(id); loadCategories(); message.success('Устгагдлаа') }

  const statusColor = (qty, reorder) => {
    if (!reorder) return 'default'
    return qty <= 0 ? 'red' : qty <= reorder ? 'orange' : 'green'
  }
  const statusLabel = (qty, reorder) => {
    if (!reorder) return 'Тодорхойгүй'
    return qty <= 0 ? 'Дуссан' : qty <= reorder ? 'Бага' : 'Хангалттай'
  }

  const itemCols = [
    { title: 'Нэр', dataIndex: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Ангилал', dataIndex: 'category_name', render: v => v || '—' },
    { title: 'Нэгж', dataIndex: 'unit', width: 100, render: v => v || '—' },
    { title: 'Үлдэгдэл', dataIndex: 'stock_quantity', align: 'right', width: 100,
      render: v => <strong>{v ?? 0}</strong> },
    { title: 'Нөөц', width: 130,
      render: (_, r) => <Tag color={statusColor(r.stock_quantity, r.reorder_level)}>
        {statusLabel(r.stock_quantity, r.reorder_level)}
      </Tag> },
    { title: '', width: 90, render: (_, r) => (
      <Button size="small" onClick={() => openItem(r)}>Засах</Button>
    ) },
  ]

  const catCols = [
    { title: '#', width: 60, render: (_, __, i) => i + 1 },
    { title: 'Нэр', dataIndex: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Тайлбар', dataIndex: 'description', render: v => v || '—' },
    { title: '', width: 140, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => openCategory(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => removeCategory(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>Устгах</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const checkCols = [
    { title: 'Цаг', dataIndex: 'checked_at', width: 140,
      render: v => v ? dayjs(v).format('MM-DD HH:mm') : '—' },
    { title: 'Ажилтан', dataIndex: 'full_name', render: v => v || '—' },
    { title: 'Хэрэгсэл', dataIndex: 'item_name', render: v => v || '—' },
    { title: 'Бүс', dataIndex: 'zone', render: v => v || '—' },
    { title: 'Үр дүн', dataIndex: 'result', width: 120,
      render: v => <Tag color={v === 'pass' ? 'success' : 'error'}>{v === 'pass' ? 'Тэнцсэн' : 'Тэнцээгүй'}</Tag> },
    { title: 'Тайлбар', dataIndex: 'notes', render: v => v || '—' },
  ]

  const tabItems = [
    { key: 'items', label: 'Хэрэгслүүд', children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openItem(null)}>Хэрэгсэл нэмэх</Button>
        </div>
        <Card>
          <Table rowKey="id" size="middle" columns={itemCols} dataSource={items}
            pagination={{ ...itemPage, showSizeChanger: false,
                          onChange: (p, l) => loadItems(p, l) }}
            locale={{ emptyText: 'Хэрэгсэл алга' }} />
        </Card>
      </>
    ) },
    { key: 'categories', label: 'Ангилал', children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCategory(null)}>Ангилал нэмэх</Button>
        </div>
        <Card>
          <Table rowKey="id" size="middle" columns={catCols} dataSource={categories}
            pagination={{ pageSize: 20, hideOnSinglePage: true }} locale={{ emptyText: 'Ангилал алга' }} />
        </Card>
      </>
    ) },
    { key: 'checks', label: 'Шалгалтын лог', children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Space wrap>
            <DatePicker.RangePicker value={range} onChange={v => v && setRange(v)}
              format="YYYY-MM-DD" allowClear={false} />
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadChecks}>Хайх</Button>
          </Space>
        </Card>
        {stats && (
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            {[
              ['Нийт шалгалт', stats.total_checks || 0, '#1890ff'],
              ['Тэнцсэн', stats.passed || 0, '#52c41a'],
              ['Тэнцээгүй', stats.failed || 0, '#cf1322'],
            ].map(([l, v, c]) => (
              <Col key={l} xs={12} sm={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic title={l} value={v} valueStyle={{ color: c, fontWeight: 700 }} />
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <Card>
          <Table rowKey={(r, i) => r.id || i} size="small" loading={loading}
            columns={checkCols} dataSource={checks}
            pagination={{ pageSize: 25 }} locale={{ emptyText: 'Шалгалт алга' }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>PPE — Хувийн хамгаалах хэрэгсэл</h4>
      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal === 'category'} onOk={save} onCancel={() => setModal(null)}
        title={editing ? 'Ангилал засах' : 'Ангилал нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={catForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Тайлбар"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal open={modal === 'item'} onOk={save} onCancel={() => setModal(null)}
        title={editing ? 'Хэрэгсэл засах' : 'Хэрэгсэл нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={itemForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category_id" label="Ангилал">
            <Select allowClear placeholder="-- Сонгох --"
              options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="unit" label="Нэгж"><Input placeholder="ш, пар, иж..." /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reorder_level" label="Нөөцийн хязгаар">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
