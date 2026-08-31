import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Popconfirm, message,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { useCrud } from 'src/hooks/useCrud'
import { downloadCSV } from 'src/utils/exporters'
import dayjs from 'dayjs'

const money = (n) => Number(n || 0).toLocaleString() + '₮'
const scoreColor = (s) => s == null ? 'default' : s >= 90 ? 'success' : s >= 70 ? 'processing' : s >= 50 ? 'warning' : 'error'
const STATUS = { planned: 'blue', active: 'green', suspended: 'orange', completed: 'default' }
const STATUS_LABEL = { planned: 'Төлөвлөсөн', active: 'Идэвхтэй', suspended: 'Түр зогссон', completed: 'Дууссан' }

export default function Projects() {
  const navigate = useNavigate()
  const [stats,  setStats]  = useState(null)
  const [board,  setBoard]  = useState([])
  const [emps,   setEmps]   = useState([])
  const [statusF,setStatusF]= useState()
  const [search, setSearch] = useState('')

  const D = (v) => (v ? dayjs(v) : null)
  const F = (v) => (v ? v.format('YYYY-MM-DD') : null)

  const crud = useCrud({
    list:   (p) => api.getProjects(p),
    create: (d) => api.createProject(d),
    update: (id, d) => api.updateProject(id, d),
    remove: (id) => api.deleteProject(id),
    params: { status: statusF || undefined, search: search || undefined },
    defaults: { status: 'active' },
    toForm: (p) => ({
      ...p,
      manager_id: p.manager_id || undefined,
      start_date: D(p.start_date), end_date: D(p.end_date),
      budget_amount: p.budget_amount != null ? Number(p.budget_amount) : null,
      area_m2:       p.area_m2       != null ? Number(p.area_m2)       : null,
    }),
    toApi: (v) => ({
      ...v,
      manager_id: v.manager_id || null,
      budget_amount: v.budget_amount ?? null,
      area_m2: v.area_m2 ?? null,
      start_date: F(v.start_date), end_date: F(v.end_date),
    }),
    onLoaded: () => {
      api.getProjectStats().then(r => setStats(r.data)).catch(() => {})
      api.getProjectLeaderboard().then(r => setBoard(r.data?.projects || [])).catch(() => {})
    },
  })
  const rows = crud.rows

  useEffect(() => { api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || [])).catch(() => {}) }, [])

  const exportExcel = () => {
    downloadCSV('tosluud',
      ['Код','Нэр','Байршил','Менежер','Төлөв','Гэрээ тоо','Гэрээ дүн','Нээлттэй ажил','Төсөв'],
      rows.map(p => [p.code || '', p.name, p.location || '', p.manager_name || '',
        STATUS_LABEL[p.status] || p.status, p.contract_count, p.contract_value, p.open_tasks, p.budget_amount || 0]))
  }

  const SUMMARY = stats ? [
    ['Идэвхтэй төсөл',   stats.active ?? 0,             '#52c41a'],
    ['Өнөөдөр ирсэн',    stats.present_today ?? 0,      '#1890ff'],
    ['Зөрчил (30 хоног)', stats.violations_30d ?? 0,    '#faad14'],
    ['Гэрээний дүн',     money(stats.contract_value),   '#722ed1'],
    ['Идэвхтэй төсөв',   money(stats.active_budget),    '#13c2c2'],
  ] : []

  const boardCols = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Төсөл', dataIndex: 'name',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Оноо', dataIndex: 'safety_score', align: 'right', width: 90,
      render: v => <Tag color={scoreColor(v)}>{v ?? '—'}</Tag> },
    { title: 'ХХХ нийцэл', dataIndex: 'ppe_compliance', align: 'right', width: 120,
      render: v => v == null ? '—' : v + '%' },
    { title: 'Зөрчил', dataIndex: 'violations', align: 'right', width: 80 },
    { title: 'Ажилтан', dataIndex: 'workers', align: 'right', width: 90 },
  ]

  const cols = [
    { title: 'Код', dataIndex: 'code', width: 100, render: v => v || '—' },
    { title: 'Нэр', dataIndex: 'name',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Байршил', dataIndex: 'location', render: v => v || '—' },
    { title: 'Менежер', dataIndex: 'manager_name', render: v => v || '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag> },
    { title: 'Гэрээ', align: 'right', width: 180,
      render: (_, p) => `${p.contract_count} · ${money(p.contract_value)}` },
    { title: 'Нээлттэй', dataIndex: 'open_tasks', align: 'right', width: 90 },
    { title: '', width: 140, render: (_, p) => (
      <Space size="small" onClick={(e) => e.stopPropagation()}>
        <Button size="small" icon={<EditOutlined />} onClick={() => crud.openEdit(p)} />
        <Popconfirm title="Төслийг устгах уу?" onConfirm={() => remove(p.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Төсөл / Объект</h4>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>Excel</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => crud.openCreate()}>Төсөл нэмэх</Button>
        </Space>
      </div>

      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            {SUMMARY.map(([l, v, c]) => (
              <Col key={l} xs={12} md={4}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{l}</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: c }}>{v}</div>
              </Col>
            ))}
          </Row>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
            Бүх төслийн нэгдсэн үзүүлэлт. Төсөл дээр дарж дэлгэрэнгүй рүү орно.
          </div>
        </Card>
      )}

      {board.length > 0 && (
        <Card title="Төслүүдийн аюулгүйн оноо" style={{ marginBottom: 16 }}>
          <Table rowKey="id" size="small" columns={boardCols} dataSource={board}
            pagination={false}
            onRow={(r) => ({ onClick: () => navigate(`/projects/${r.id}`), style: { cursor: 'pointer' } })} />
        </Card>
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Хайх..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={() => crud.reload()}
              allowClear enterButton />
          </Col>
          <Col xs={24} sm={6}>
            <Select value={statusF} onChange={setStatusF} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
        </Row>
        <Table {...crud.tableProps} size="middle"
          columns={cols}
          locale={{ emptyText: 'Төсөл алга. "Төсөл нэмэх"-ээр эхлүүлнэ үү.' }}
          onRow={(r) => ({ onClick: () => navigate(`/projects/${r.id}`), style: { cursor: 'pointer' } })} />
      </Card>

      <Modal {...crud.modalProps}
        title={crud.editing ? 'Төсөл засах' : 'Төсөл нэмэх'} width={720}>
        <Form {...crud.formProps} requiredMark={false}>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="code" label="Код"><Input /></Form.Item></Col>
            <Col span={16}><Form.Item name="name" label="Төслийн нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="location" label="Байршил"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="client_name" label="Захиалагч"><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="manager_id" label="Менежер">
                <Select allowClear showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Төлөв">
                <Select options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={6}><Form.Item name="start_date" label="Эхлэх"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="end_date" label="Дуусах"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="budget_amount" label="Төсөв (₮)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={6}><Form.Item name="area_m2" label="Талбай (м²)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Тайлбар"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
