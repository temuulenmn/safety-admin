import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Tabs, Table, Tag, Button, Modal, Form, Input, Select,
  DatePicker, TimePicker, Space, Statistic, Popconfirm, Progress, Alert,
  InputNumber, message,
} from 'antd'
import { PlusOutlined, ReloadOutlined, PlayCircleOutlined, CheckOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
import dayjs from 'dayjs'

const SHIFT_COLOR = { day: 'green', night: 'blue', rotating: 'orange' }
const SHIFT_LABEL = { day: 'Өдөр', night: 'Шөнө', rotating: 'Ротаци' }

const TSTATUS_COLOR = { planned: 'default', active: 'processing', completed: 'success', cancelled: 'error' }
const TSTATUS_LABEL = { planned: 'Төлөвлөсөн', active: 'Гүйцэтгэж буй', completed: 'Дууссан', cancelled: 'Цуцлагдсан' }
const PRIORITY_COLOR = { low: 'default', normal: 'blue', high: 'orange', urgent: 'red' }
const PRIORITY_LABEL = { low: 'Бага', normal: 'Энгийн', high: 'Өндөр', urgent: 'Яаралтай' }

export default function Schedules() {
  const [tab, setTab] = useState('individual')
  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Ажлын хуваарь</h4>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'individual', label: 'Ажилтны хуваарь', children: <IndividualTab /> },
        { key: 'brigade',    label: 'Бригадын даалгавар', children: <BrigadeTab /> },
      ]} />
    </div>
  )
}

function IndividualTab() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [emps,       setEmps]       = useState([])
  const [range,      setRange]      = useState([dayjs(), dayjs().add(7, 'day')])
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(false)
  const [page,       setPage]       = useState({ current: 1, pageSize: 25, total: 0 })
  const [modal,      setModal]      = useState(false)
  const [form]       = Form.useForm()
  const [editing,    setEditing]    = useState(null)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || [])) }, [])

  const load = useCallback((p = 1, l = 25) => {
    setLoading(true)
    api.getSchedules({
      page: p, limit: l,
      date_from: range[0].format('YYYY-MM-DD'),
      date_to:   range[1].format('YYYY-MM-DD'),
      project_id: currentProjectId || undefined,
    }).then(r => {
      setRows(r.data || [])
      setPage(pageInfo(r, p, l))
    }).finally(() => setLoading(false))
  }, [range, currentProjectId])
  useEffect(() => { load(1, page.pageSize) /* eslint-disable-next-line */ }, [range, currentProjectId])

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ work_date: dayjs(), shift: 'day' })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      employee_id: r.employee_id, work_date: r.work_date ? dayjs(r.work_date) : null,
      shift: r.shift,
      start_time: r.start_time ? dayjs(r.start_time, 'HH:mm') : null,
      end_time:   r.end_time   ? dayjs(r.end_time,   'HH:mm') : null,
      task_description: r.task_description || '', site_zone: r.site_zone || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        employee_id: v.employee_id,
        work_date: v.work_date.format('YYYY-MM-DD'),
        shift: v.shift,
        start_time: v.start_time ? v.start_time.format('HH:mm') : null,
        end_time:   v.end_time   ? v.end_time.format('HH:mm')   : null,
        task_description: v.task_description || null,
        site_zone: v.site_zone || null,
      }
      editing ? await api.updateSchedule(editing, payload) : await api.createSchedule(payload)
      setModal(false); load(page.current, page.pageSize); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteSchedule(id); load(page.current, page.pageSize); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Огноо', dataIndex: 'work_date', width: 110, render: v => v?.slice(0, 10) },
    { title: 'Код', dataIndex: 'emp_code', width: 80 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department', render: v => v || '—' },
    { title: 'Ээлж', dataIndex: 'shift', width: 90,
      render: v => <Tag color={SHIFT_COLOR[v] || 'default'}>{SHIFT_LABEL[v] || v}</Tag> },
    { title: 'Эхлэх', dataIndex: 'start_time', width: 90 },
    { title: 'Дуусах', dataIndex: 'end_time', width: 90 },
    { title: 'Бүс', dataIndex: 'site_zone', width: 100, render: v => v || '—' },
    { title: 'Даалгавар', dataIndex: 'task_description', render: v => v || '—' },
    { title: '', width: 130, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Хуваарь нэмэх</Button>
      </div>
      <Card style={{ marginBottom: 12 }}>
        <Space wrap>
          <DatePicker.RangePicker value={range} onChange={v => v && setRange(v)}
            format="YYYY-MM-DD" allowClear={false} />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => load(1, page.pageSize)}>Хайх</Button>
        </Space>
      </Card>
      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ ...page, onChange: (p, s) => load(p, s) }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Хуваарь засах' : 'Хуваарь нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="work_date" label="Огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="shift" label="Ээлж">
                <Select options={Object.entries(SHIFT_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="start_time" label="Эхлэх цаг"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="end_time" label="Дуусах цаг"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="site_zone" label="Бүс"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="task_description" label="Даалгавар"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

function BrigadeTab() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tasks,     setTasks]     = useState([])
  const [stats,     setStats]     = useState(null)
  const [brigades,  setBrigades]  = useState([])
  const [contracts, setContracts] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [statusF,   setStatusF]   = useState()
  const [brigadeF,  setBrigadeF]  = useState()
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getBrigadeTasks({
        status: statusF || undefined, brigade_id: brigadeF || undefined,
        project_id: currentProjectId || undefined, limit: 200,
      }),
      api.getBrigadeTaskStats(),
    ]).then(([l, s]) => { setTasks(l.data || []); setStats(s.data) }).finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getBrigades({ active: 'true' }).then(r => setBrigades(r.data || []))
    api.getBrigadeContracts({ limit: 100 }).then(r => setContracts(r.data || []))
  }, [])
  useEffect(load, [statusF, brigadeF, currentProjectId])

  const openCreate = () => { setEditing(null); setModal(true) }
  const openEdit   = (t) => { setEditing(t); setModal(true) }
  const remove = async (id) => { await api.deleteBrigadeTask(id); load(); message.success('Устгагдлаа') }
  const setStatus = async (id, status) => {
    await api.updateBrigadeTask(id, { status, ...(status === 'completed' ? { progress_percent: 100 } : {}) })
    load()
  }

  const cols = [
    { title: 'Даалгавар', render: (_, t) => (
      <>
        <div style={{ fontWeight: 600 }}>{t.title}</div>
        {t.description && <div style={{ color: '#8c8c8c', fontSize: 11 }}>{t.description.slice(0, 80)}</div>}
      </>
    ) },
    { title: 'Бригад', render: (_, t) => (
      <>
        <div>{t.brigade_name}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{t.specialty} · {t.leader_name}</div>
      </>
    ) },
    { title: 'Хугацаа', width: 150, render: (_, t) => {
      const overdue = t.status === 'active' && t.end_date < dayjs().format('YYYY-MM-DD')
      return <>
        <div style={{ fontSize: 12 }}>{dayjs(t.start_date).format('MM-DD')} → {dayjs(t.end_date).format('MM-DD')}</div>
        {overdue && <Tag color="red" style={{ marginTop: 4 }}>Хугацаа хэтэрсэн</Tag>}
      </>
    } },
    { title: 'Бүс', dataIndex: 'site_zone', width: 100, render: v => v || '—' },
    { title: 'Гэрээ', dataIndex: 'contract_number', width: 120,
      render: v => v ? <code>{v}</code> : '—' },
    { title: 'Чухал', dataIndex: 'priority', width: 100,
      render: v => <Tag color={PRIORITY_COLOR[v]}>{PRIORITY_LABEL[v]}</Tag> },
    { title: 'Биелэлт', dataIndex: 'progress_percent', width: 140,
      render: v => <>
        <Progress percent={v} size="small" strokeColor={v >= 100 ? '#52c41a' : '#1890ff'} showInfo={false} />
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{v}%</div>
      </> },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={TSTATUS_COLOR[v]}>{TSTATUS_LABEL[v]}</Tag> },
    { title: '', width: 200, render: (_, t) => (
      <Space size="small">
        {t.status === 'planned' && (
          <Button size="small" icon={<PlayCircleOutlined />} onClick={() => setStatus(t.id, 'active')}>Эхлүүлэх</Button>
        )}
        {t.status === 'active' && (
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => setStatus(t.id, 'completed')}>Дуусгах</Button>
        )}
        <Button size="small" onClick={() => openEdit(t)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(t.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <>
      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {[
            ['Төлөвлөсөн',     stats.planned,   '#8c8c8c'],
            ['Гүйцэтгэж буй',   stats.active,    '#1890ff'],
            ['Дууссан',        stats.completed, '#52c41a'],
            ['Хугацаа хэтэрсэн', stats.overdue,  '#cf1322'],
          ].map(([l, v, c]) => (
            <Col key={l} xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic title={l} value={v ?? 0} valueStyle={{ color: c, fontWeight: 700 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={brigades.length === 0}>
          Даалгавар нэмэх
        </Button>
      </div>

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Select value={brigadeF} onChange={setBrigadeF} allowClear
              placeholder="Бүх бригад" style={{ width: '100%' }}
              options={brigades.map(b => ({ value: b.id, label: b.name }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Select value={statusF} onChange={setStatusF} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(TSTATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={tasks}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Даалгавар алга' }} />
      </Card>

      {modal && <TaskForm editing={editing} brigades={brigades} contracts={contracts}
        onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />}
    </>
  )
}

function TaskForm({ editing, brigades, contracts, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [brigadeId, setBrigadeId] = useState(editing?.brigade_id)

  useEffect(() => {
    form.setFieldsValue(editing ? {
      brigade_id:  editing.brigade_id,
      contract_id: editing.contract_id || undefined,
      title:       editing.title,
      description: editing.description || '',
      site_zone:   editing.site_zone || '',
      dates: [dayjs(editing.start_date), dayjs(editing.end_date)],
      priority:    editing.priority,
      progress_percent: editing.progress_percent,
      notes:       editing.notes || '',
    } : {
      priority: 'normal', progress_percent: 0,
      dates: [dayjs(), dayjs().add(14, 'day')],
    })
  }, [editing, form])

  const relevantContracts = contracts.filter(c => !brigadeId || c.brigade_id === Number(brigadeId))

  const save = async () => {
    setError('')
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        brigade_id:  v.brigade_id,
        contract_id: v.contract_id || null,
        title:       v.title,
        description: v.description || null,
        site_zone:   v.site_zone || null,
        start_date:  v.dates[0].format('YYYY-MM-DD'),
        end_date:    v.dates[1].format('YYYY-MM-DD'),
        priority:    v.priority,
        progress_percent: Number(v.progress_percent) || 0,
        notes:       v.notes || null,
      }
      editing ? await api.updateBrigadeTask(editing.id, payload) : await api.createBrigadeTask(payload)
      message.success('Хадгалагдлаа')
      onSaved()
    } catch (e) {
      if (e?.errorFields) return
      setError(e.response?.data?.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }

  return (
    <Modal open onOk={save} onCancel={onClose} confirmLoading={saving} width={720}
      title={editing ? 'Даалгавар засах' : 'Бригадын даалгавар нэмэх'}
      okText="Хадгалах" cancelText="Болих" destroyOnClose maskClosable={false}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="brigade_id" label="Бригад" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
            onChange={setBrigadeId}
            options={brigades.map(b => ({
              value: b.id, label: `${b.name} (${b.specialty || '—'}) — ${b.leader_name || '?'}`,
            }))} />
        </Form.Item>
        <Form.Item name="title" label="Даалгаврын нэр" rules={[{ required: true }]}>
          <Input placeholder="1-р давхрын мужаанийн ажил" />
        </Form.Item>
        <Form.Item name="description" label="Тайлбар"><Input.TextArea rows={2} /></Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="dates" label="Хугацаа" rules={[{ required: true }]}><DatePicker.RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item></Col>
          <Col span={12}><Form.Item name="site_zone" label="Бүс"><Input placeholder="1-р давхар..." /></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="priority" label="Чухал зэрэг">
              <Select options={Object.entries(PRIORITY_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="progress_percent" label="Биелэлт %">
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="contract_id" label="Холбоотой гэрээ">
          <Select allowClear placeholder="— Холбоогүй —"
            options={relevantContracts.map(c => ({
              value: c.id,
              label: `${c.contract_number} — ${(c.work_description || '').slice(0, 50)} (${Number(c.contract_amount).toLocaleString()}₮)`,
            }))} />
        </Form.Item>
        <Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  )
}
