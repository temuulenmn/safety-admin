import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Space, Statistic, Alert, Popconfirm, Tabs, Progress, message,
} from 'antd'
import { PlusOutlined, WarningOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const TYPE_LABEL = {
  pre_employment: 'Урьдчилсан (ажилд ороход)',
  periodic:       'Хугацаат (жилийн)',
  special:        'Тусгай / хортой ажлын',
  post_accident:  'Ослын дараах',
}
const RESULT_COLOR = { fit: 'success', fit_with_restrictions: 'orange', unfit: 'red', pending: 'default' }
const RESULT_LABEL = { fit: 'Ажиллах боломжтой', fit_with_restrictions: 'Хязгаартай', unfit: 'Тэнцээгүй', pending: 'Хүлээгдэж буй' }

export default function HealthChecks() {
  const [tab, setTab] = useState('list')
  const [rows,    setRows]    = useState([])
  const [emps,    setEmps]    = useState([])
  const [stats,   setStats]   = useState(null)
  const [due,     setDue]     = useState([])
  const [loading, setLoading] = useState(true)
  const [typeF,   setTypeF]   = useState()
  const [resultF, setResultF] = useState()

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getHealthChecks({ check_type: typeF, result: resultF }),
      api.getHealthCheckStats(),
      api.getHealthCheckDue({ within_days: 60 }),
    ]).then(([r, s, d]) => {
      setRows(r.data || []); setStats(s.data); setDue(d.data || [])
    }).finally(() => setLoading(false))
  }, [typeF, resultF])
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = (emp) => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({
      check_type: 'periodic',
      check_date: dayjs(),
      next_due_date: dayjs().add(1, 'year'),
      result: 'fit',
      employee_id: emp?.id,
    })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      employee_id: r.employee_id, check_type: r.check_type,
      check_date: dayjs(r.check_date),
      next_due_date: r.next_due_date ? dayjs(r.next_due_date) : null,
      result: r.result, restrictions: r.restrictions || '',
      clinic_name: r.clinic_name || '', doctor_name: r.doctor_name || '',
      cert_number: r.cert_number || '', cert_url: r.cert_url || '',
      cost: r.cost ? Number(r.cost) : null, notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        check_date: v.check_date.format('YYYY-MM-DD'),
        next_due_date: v.next_due_date ? v.next_due_date.format('YYYY-MM-DD') : null,
      }
      editing ? await api.updateHealthCheck(editing, payload) : await api.createHealthCheck(payload)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteHealthCheck(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Ажилтан', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.emp_code} {r.full_name}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.department_name || '—'}</div>
      </>
    ) },
    { title: 'Төрөл', dataIndex: 'check_type', width: 180,
      render: v => <Tag color="blue">{TYPE_LABEL[v] || v}</Tag> },
    { title: 'Огноо', dataIndex: 'check_date', width: 110,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Дараагийн', dataIndex: 'next_due_date', width: 120,
      render: v => {
        if (!v) return '—'
        const d = dayjs(v); const days = d.diff(dayjs(), 'day')
        return <span style={{ color: days < 0 ? '#cf1322' : days < 30 ? '#faad14' : undefined }}>
          {d.format('YYYY-MM-DD')}
        </span>
      } },
    { title: 'Үр дүн', dataIndex: 'result', width: 160,
      render: v => <Tag color={RESULT_COLOR[v]}>{RESULT_LABEL[v]}</Tag> },
    { title: 'Эмч / Эмнэлэг', render: (_, r) => (
      <>
        {r.doctor_name && <div>{r.doctor_name}</div>}
        {r.clinic_name && <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.clinic_name}</div>}
      </>
    ) },
    { title: 'Гэрчилгээ', dataIndex: 'cert_number', width: 130,
      render: (v, r) => v ? (r.cert_url ? <a href={r.cert_url} target="_blank" rel="noopener"><code>{v}</code></a> : <code>{v}</code>) : '—' },
    { title: '', width: 120, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const dueCols = [
    { title: 'Ажилтан', render: (_, e) => (
      <>
        <div style={{ fontWeight: 600 }}>{e.emp_code} {e.full_name}</div>
        {e.is_high_risk_worker && <Tag color="red">⚠ Эрсдэл өндөр</Tag>}
      </>
    ) },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Дараагийн үзлэг', dataIndex: 'next_health_check_date', width: 140,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : <Tag color="magenta">Хийгээгүй</Tag> },
    { title: 'Статус', dataIndex: 'urgency', width: 130, render: v => (
      v === 'overdue' ? <Tag color="red">Хугацаа хэтэрсэн</Tag>
      : v === 'never' ? <Tag color="magenta">Хийгээгүй</Tag>
      : <Tag color="orange">Удахгүй</Tag>
    ) },
    { title: '', width: 130, render: (_, e) => (
      <Button size="small" type="primary" icon={<MedicineBoxOutlined />}
        onClick={() => openCreate(e)}>Үзлэг оруулах</Button>
    ) },
  ]

  const pct = stats?.total_active > 0 ? Math.round(stats.covered / stats.total_active * 100) : 0

  const tabItems = [
    { key: 'list', label: `Үзлэгийн бүртгэл (${rows.length})`, children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Row gutter={8}>
            <Col xs={12} sm={6}>
              <Select value={typeF} onChange={setTypeF} allowClear
                placeholder="Бүх төрөл" style={{ width: '100%' }}
                options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
            </Col>
            <Col xs={12} sm={6}>
              <Select value={resultF} onChange={setResultF} allowClear
                placeholder="Бүх үр дүн" style={{ width: '100%' }}
                options={Object.entries(RESULT_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
            </Col>
          </Row>
        </Card>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={cols} dataSource={rows}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Үзлэг алга' }} />
        </Card>
      </>
    ) },
    { key: 'due', label: (
      <span>
        <WarningOutlined style={{ color: due.length ? '#faad14' : undefined }} /> Үзлэг шаардлагатай ({due.length})
      </span>
    ), children: (
      <>
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="ХАБЭА тухай хууль 13.2"
          description="Ажил олгогч нь ажилтныг үйлдвэрлэл, ажил, үйлчилгээтэй холбоотой, зайлшгүй шаардлагатай эрүүл мэндийн урьдчилсан ба хугацаат үзлэгт хамруулна." />
        <Card>
          <Table rowKey="id" size="middle" columns={dueCols} dataSource={due}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: 'Хугацаа хэтэрсэн үзлэг алга ✓' }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Эрүүл мэндийн үзлэг</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>Үзлэг нэмэх</Button>
      </div>

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Нийт идэвхтэй" value={stats.total_active ?? 0} valueStyle={{ fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Үзлэгтэй" value={stats.covered ?? 0}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }} />
              <Progress percent={pct} size="small" showInfo={false} strokeColor="#52c41a" />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Хугацаа хэтэрсэн" value={stats.overdue ?? 0}
                valueStyle={{ color: '#cf1322', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="30 хоногт дуусах" value={stats.due_soon ?? 0}
                valueStyle={{ color: '#faad14', fontWeight: 700 }} />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Үзлэг засах' : 'Үзлэг бүртгэх'} confirmLoading={saving} width={720}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="check_type" label="Төрөл">
                <Select options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="check_date" label="Үзлэгийн огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="next_due_date" label="Дараагийн үзлэгийн огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="result" label="Үр дүн">
                <Select options={Object.entries(RESULT_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="restrictions" label="Хязгаарлалт"><Input placeholder="жин өргөхгүй, өндөрт гарахгүй..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="clinic_name" label="Эмнэлэг"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="doctor_name" label="Эмч"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="cert_number" label="Гэрчилгээ №"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="cert_url" label="Гэрчилгээний холбоос"><Input placeholder="https://..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="cost" label="Зардал (₮)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
