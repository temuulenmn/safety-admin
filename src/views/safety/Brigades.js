import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space,
  Popconfirm, Alert, Checkbox, Statistic, message,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const SPECIALTIES = ['Мужаан','Арматурчин','Цутгалт','Гагнуурчин','Цахилгаанчин','Сантехникч','Тоосго','Шавардлага','Будаг','Хучилт','Бусад']
const fmt = n => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function Brigades() {
  const [stats,    setStats]    = useState(null)
  const [list,     setList]     = useState([])
  const [emps,     setEmps]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [specF,    setSpecF]    = useState()
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [detail,   setDetail]   = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getBrigades({ search: search || undefined, specialty: specF || undefined }),
      api.getBrigadeStats(),
    ]).then(([l, s]) => { setList(l.data || []); setStats(s.data) }).finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    load()
  }, [])
  useEffect(load, [specF])

  const openCreate = () => { setEditing(null); setModal(true) }
  const openEdit   = (b) => { setEditing(b); setModal(true) }
  const remove = async (id) => { await api.deleteBrigade(id); load(); message.success('Устгагдлаа') }
  const openDetail = (id) => api.getBrigade(id).then(r => setDetail(r.data))

  const cols = [
    { title: 'Нэр', dataIndex: 'name', render: v => <strong>{v}</strong> },
    { title: 'Мэргэжил', dataIndex: 'specialty', render: v => v || '—' },
    { title: 'Төрөл', dataIndex: 'is_external', width: 90,
      render: v => <Tag color={v ? 'cyan' : 'blue'}>{v ? 'Гадны' : 'Дотоод'}</Tag> },
    { title: 'Ахлагч', render: (_, b) => (
      <>
        <div>{b.leader_name || '—'}</div>
        {b.leader_code && <div style={{ color: '#8c8c8c', fontSize: 11 }}>{b.leader_code}</div>}
      </>
    ) },
    { title: 'Гишүүд', dataIndex: 'member_count', width: 80,
      render: (v, b) => b.is_external ? '—' : v },
    { title: 'Гэрээ', dataIndex: 'contract_count', width: 70 },
    { title: 'Нийт дүн', dataIndex: 'total_value', width: 140, render: v => fmt(v) },
    { title: 'Төлсөн', dataIndex: 'total_paid', width: 160,
      render: (v, b) => {
        const rest = Number(b.total_value) - Number(b.total_paid)
        return <>
          <span style={{ color: '#52c41a' }}>{fmt(v)}</span>
          {rest > 0 && <div style={{ color: '#cf1322', fontSize: 11 }}>үлд {fmt(rest)}</div>}
        </>
      } },
    { title: 'Статус', dataIndex: 'is_active', width: 100,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Хаагдсан'}</Tag> },
    { title: '', width: 130, render: (_, b) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Button size="small" onClick={() => openEdit(b)}>Засах</Button>
        <Popconfirm title="Бригадыг устгах уу?" onConfirm={() => remove(b.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Бригадууд</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Бригад нэмэх</Button>
      </div>

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            ['Идэвхтэй бригад',    stats.active_brigades,    '#1890ff'],
            ['Гадны бригад',       stats.external_brigades,  '#13c2c2'],
            ['Идэвхтэй гэрээ',      stats.open_contracts,     '#faad14'],
            ['Үлдсэн өглөг',        fmt(stats.outstanding),   '#cf1322'],
            ['Сүүлийн 30х төлсөн', fmt(stats.paid_30d),      '#52c41a'],
          ].map(([l, v, c]) => (
            <Col key={l} xs={12} sm={4} md={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title={l} value={v ?? 0} valueStyle={{ color: c, fontWeight: 700, fontSize: 18 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Хайх..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={load}
              allowClear enterButton />
          </Col>
          <Col xs={24} sm={6}>
            <Select value={specF} onChange={setSpecF} allowClear
              placeholder="Бүх мэргэжил" style={{ width: '100%' }}
              options={SPECIALTIES.map(s => ({ value: s, label: s }))} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={list}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Бригад алга' }}
          onRow={(b) => ({ onClick: () => openDetail(b.id), style: { cursor: 'pointer' } })} />
      </Card>

      {modal && <BrigadeForm editing={editing} emps={emps}
        onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />}
      {detail && <BrigadeDetailModal brigade={detail} emps={emps}
        onClose={() => setDetail(null)}
        onRefresh={() => openDetail(detail.id)} onListRefresh={load} />}
    </div>
  )
}

function BrigadeForm({ editing, emps, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [memberIds,    setMemberIds]    = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [isExternal, setIsExternal] = useState(!!editing?.is_external)

  useEffect(() => {
    form.setFieldsValue(editing ? {
      name: editing.name, specialty: editing.specialty || undefined,
      is_external: editing.is_external, leader_id: editing.leader_id || undefined,
      external_leader_name: editing.external_leader_name || '',
      external_phone: editing.external_phone || '', notes: editing.notes || '',
      is_active: editing.is_active,
    } : { is_external: false, is_active: true })
  }, [editing, form])

  const filtered = emps.filter(e =>
    !memberSearch || `${e.last_name} ${e.first_name} ${e.emp_code}`.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const save = async () => {
    setError('')
    try {
      const v = await form.validateFields()
      if (v.is_external && !v.external_leader_name) return setError('Ахлагчийн нэр шаардлагатай')
      if (!v.is_external && !v.leader_id) return setError('Ахлагч сонгоно уу')
      setSaving(true)
      if (editing) {
        await api.updateBrigade(editing.id, v)
      } else {
        await api.createBrigade({ ...v, member_ids: memberIds })
      }
      message.success('Хадгалагдлаа'); onSaved()
    } catch (e) {
      if (e?.errorFields) return
      setError(e.response?.data?.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }

  return (
    <Modal open onOk={save} onCancel={onClose} confirmLoading={saving} width={720}
      title={editing ? 'Бригад засах' : 'Бригад нэмэх'}
      okText="Хадгалах" cancelText="Болих" destroyOnClose maskClosable={false}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="specialty" label="Мэргэжил">
              <Select allowClear placeholder="-- Сонгох --"
                options={SPECIALTIES.map(s => ({ value: s, label: s }))} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="is_external" valuePropName="checked">
              <Checkbox onChange={e => setIsExternal(e.target.checked)}>Гадны (хөлсний) бригад</Checkbox>
            </Form.Item>
          </Col>
          {isExternal ? (
            <>
              <Col span={12}><Form.Item name="external_leader_name" label="Ахлагчийн нэр"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="external_phone" label="Утас"><Input /></Form.Item></Col>
            </>
          ) : (
            <Col span={24}>
              <Form.Item name="leader_id" label="Бригадын ахлагч">
                <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name} (${e.position || '—'})` }))} />
              </Form.Item>
            </Col>
          )}
          <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          {editing && (
            <Col span={24}>
              <Form.Item name="is_active" valuePropName="checked">
                <Checkbox>Идэвхтэй</Checkbox>
              </Form.Item>
            </Col>
          )}
          {!editing && !isExternal && (
            <Col span={24}>
              <Card size="small" title={<>Гишүүн сонгох <Tag color="blue">{memberIds.length}</Tag></>}
                extra={<Input size="small" placeholder="Хайх..." value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)} prefix={<SearchOutlined />} style={{ width: 200 }} />}>
                <Table rowKey="id" size="small" showHeader={false}
                  columns={[
                    { dataIndex: 'emp_code', width: 90 },
                    { render: (_, e) => `${e.last_name} ${e.first_name}` },
                    { dataIndex: 'position', render: v => <span style={{ color: '#8c8c8c' }}>{v || '—'}</span> },
                  ]}
                  dataSource={filtered.slice(0, 100)} scroll={{ y: 240 }}
                  pagination={false}
                  rowSelection={{ selectedRowKeys: memberIds, onChange: setMemberIds }} />
              </Card>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  )
}

function BrigadeDetailModal({ brigade, emps, onClose, onRefresh, onListRefresh }) {
  const [addMode, setAddMode] = useState(false)
  const [pick,    setPick]    = useState([])
  const [search,  setSearch]  = useState('')
  const [adding,  setAdding]  = useState(false)

  const existingIds = new Set((brigade.members || []).filter(m => !m.left_at).map(m => m.employee_id))
  const candidates = emps.filter(e => !existingIds.has(e.id))
    .filter(e => !search || `${e.last_name} ${e.first_name} ${e.emp_code}`.toLowerCase().includes(search.toLowerCase()))

  const doAdd = async () => {
    setAdding(true)
    try {
      await api.addBrigadeMembers(brigade.id, { employee_ids: pick })
      setAddMode(false); setPick([]); onRefresh(); onListRefresh()
      message.success('Нэмэгдлээ')
    } finally { setAdding(false) }
  }
  const removeMember = async (mid) => {
    await api.removeBrigadeMember(mid); onRefresh(); onListRefresh()
    message.success('Хасагдлаа')
  }

  const active = (brigade.members || []).filter(m => !m.left_at)

  return (
    <Modal open onCancel={onClose} width={860}
      title={<>{brigade.name} {brigade.is_external && <Tag color="cyan">Гадны</Tag>}</>}
      footer={<Button onClick={onClose}>Хаах</Button>}>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Мэргэжил</div>
          <div>{brigade.specialty || '—'}</div>
        </Col>
        <Col span={8}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Ахлагч</div>
          <div style={{ fontWeight: 600 }}>{brigade.leader_name || '—'}</div>
        </Col>
        <Col span={8}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{brigade.is_external ? 'Утас' : 'Ахлагчийн код'}</div>
          <div>{brigade.is_external ? brigade.external_phone : brigade.leader_code}</div>
        </Col>
      </Row>
      {brigade.notes && <Alert type="info" message={brigade.notes} style={{ marginBottom: 12 }} />}

      {!brigade.is_external && (
        <Card size="small" title={`Гишүүд (${active.length})`}
          extra={!addMode && <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddMode(true)}>Гишүүн нэмэх</Button>}>
          {addMode ? (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Input size="small" placeholder="Хайх..." value={search}
                  onChange={e => setSearch(e.target.value)} prefix={<SearchOutlined />} style={{ maxWidth: 240 }} />
                <Tag color="blue">{pick.length}</Tag>
                <div style={{ marginLeft: 'auto' }}>
                  <Space>
                    <Button size="small" onClick={() => { setAddMode(false); setPick([]) }}>Болих</Button>
                    <Button size="small" type="primary" onClick={doAdd} loading={adding} disabled={pick.length === 0}>
                      Нэмэх ({pick.length})
                    </Button>
                  </Space>
                </div>
              </div>
              <Table rowKey="id" size="small" columns={[
                  { title: 'Код', dataIndex: 'emp_code', width: 90 },
                  { title: 'Нэр', render: (_, e) => `${e.last_name} ${e.first_name}` },
                  { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
                ]}
                dataSource={candidates} scroll={{ y: 280 }} pagination={{ pageSize: 50, hideOnSinglePage: true }}
                rowSelection={{ selectedRowKeys: pick, onChange: setPick }} />
            </>
          ) : (
            <Table rowKey="id" size="small" columns={[
                { title: 'Код', dataIndex: 'emp_code', width: 90 },
                { title: 'Нэр', dataIndex: 'full_name', render: v => <strong>{v}</strong> },
                { title: 'Хэлтэс', dataIndex: 'department', render: v => v || '—' },
                { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
                { title: 'Орсон', dataIndex: 'joined_at', width: 110,
                  render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
                { title: '', width: 60, render: (_, m) => (
                  <Popconfirm title="Бригадаас хасах уу?" onConfirm={() => removeMember(m.id)} okText="Тийм" cancelText="Үгүй">
                    <Button size="small" danger>×</Button>
                  </Popconfirm>
                ) },
              ]}
              dataSource={active} scroll={{ y: 280 }} pagination={{ pageSize: 50, hideOnSinglePage: true }}
              locale={{ emptyText: 'Гишүүн алга' }} />
          )}
        </Card>
      )}
    </Modal>
  )
}
