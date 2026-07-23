import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Space, Popconfirm, Statistic, Alert, Tabs, message,
} from 'antd'
import { PlusOutlined, WarningOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const TYPE_LABEL = { life_health: 'Амь нас, эрүүл мэнд', accident: 'Осол', professional: 'Мэргэжлийн' }
const fmt = n => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function Insurance() {
  const [tab, setTab] = useState('list')
  const [rows,      setRows]      = useState([])
  const [emps,      setEmps]      = useState([])
  const [stats,     setStats]     = useState(null)
  const [uncovered, setUncovered] = useState([])
  const [loading,   setLoading]   = useState(true)

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getInsurances(),
      api.getInsuranceStats(),
      api.getUncoveredWorkers(),
    ]).then(([r, s, u]) => {
      setRows(r.data || []); setStats(s.data); setUncovered(u.data || [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    load()
  }, [])

  const openCreate = (emp) => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({
      insurance_type: 'life_health',
      months_of_salary: 36,
      start_date: dayjs(),
      end_date: dayjs().add(1, 'year'),
      employee_id: emp?.id,
    })
    if (emp?.base_salary) {
      form.setFieldsValue({ coverage_amount: Number(emp.base_salary) * 36 })
    }
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      employee_id: r.employee_id, insurance_type: r.insurance_type, insurer_name: r.insurer_name,
      policy_number: r.policy_number || '',
      coverage_amount: Number(r.coverage_amount),
      months_of_salary: r.months_of_salary ? Number(r.months_of_salary) : null,
      start_date: dayjs(r.start_date), end_date: dayjs(r.end_date),
      premium_amount: r.premium_amount ? Number(r.premium_amount) : null,
      notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        start_date: v.start_date.format('YYYY-MM-DD'),
        end_date:   v.end_date.format('YYYY-MM-DD'),
      }
      editing ? await api.updateInsurance(editing, payload) : await api.createInsurance(payload)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteInsurance(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Ажилтан', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.emp_code} {r.full_name}</div>
        {r.is_high_risk_worker && <Tag color="red">⚠ Эрсдэл өндөр</Tag>}
      </>
    ) },
    { title: 'Даатгагч', dataIndex: 'insurer_name' },
    { title: 'Полис №', dataIndex: 'policy_number', render: v => v ? <code>{v}</code> : '—' },
    { title: 'Төрөл', dataIndex: 'insurance_type', width: 160,
      render: v => TYPE_LABEL[v] || v },
    { title: 'Дүн', dataIndex: 'coverage_amount', align: 'right', width: 160,
      render: v => <strong>{fmt(v)}</strong> },
    { title: 'Сар', dataIndex: 'months_of_salary', align: 'right', width: 70,
      render: v => v ? Number(v).toFixed(0) : '—' },
    { title: 'Дуусах', dataIndex: 'end_date', width: 120,
      render: v => {
        const d = dayjs(v)
        const days = d.diff(dayjs(), 'day')
        return <span style={{ color: days < 0 ? '#cf1322' : days < 30 ? '#faad14' : undefined }}>
          {d.format('YYYY-MM-DD')}
        </span>
      } },
    { title: 'Идэвх', dataIndex: 'is_active', width: 90,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Хаагдсан'}</Tag> },
    { title: '', width: 120, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const uncoveredCols = [
    { title: 'Ажилтан', render: (_, e) => `${e.emp_code} — ${e.full_name}` },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Эрсдэлт бүс', dataIndex: 'zone_name', render: v => v || '—' },
    { title: 'Цалин', dataIndex: 'base_salary', align: 'right',
      render: v => v ? fmt(v) : '—' },
    { title: '36 сар шаардлага', align: 'right',
      render: (_, e) => e.base_salary ? <strong>{fmt(Number(e.base_salary) * 36)}</strong> : '—' },
    { title: '', width: 130, render: (_, e) => (
      <Button size="small" type="primary" icon={<SafetyCertificateOutlined />}
        onClick={() => openCreate(e)}>Даатгуулах</Button>
    ) },
  ]

  const tabItems = [
    { key: 'list', label: `Полисын жагсаалт (${rows.length})`, children: (
      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Полис алга' }} />
      </Card>
    ) },
    { key: 'uncovered', label: (
      <span>
        <WarningOutlined style={{ color: uncovered.length ? '#cf1322' : undefined }} /> Даатгалгүй ({uncovered.length})
      </span>
    ), children: (
      <>
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="ХАБЭА тухай хууль 28.4"
          description="Эрсдэлийн түвшин их ажлын байранд ажилладаг ажилтныг 36 сарын дундаж цалинтай тэнцэх хэмжээгээр амь нас, эрүүл мэндийн даатгалд заавал хамруулна." />
        <Card>
          <Table rowKey="id" size="middle" columns={uncoveredCols} dataSource={uncovered}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: 'Бүх эрсдэлт ажилтан даатгалтай ✓' }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Даатгал</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>Полис нэмэх</Button>
      </div>

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Эрсдэлт ажилтан" value={stats.high_risk_workers ?? 0}
                valueStyle={{ color: '#cf1322', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Даатгалтай" value={stats.insured_workers ?? 0}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="30 хоногт дуусах" value={stats.expiring_soon ?? 0}
                valueStyle={{ color: '#faad14', fontWeight: 700 }} />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Полис засах' : 'Полис нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" width={720} destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({
                value: e.id,
                label: `${e.emp_code} — ${e.last_name} ${e.first_name}${e.is_high_risk_worker ? ' ⚠' : ''}`,
              }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="insurance_type" label="Төрөл">
                <Select options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="insurer_name" label="Даатгагч" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="policy_number" label="Полисын дугаар"><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="months_of_salary" label="Сарын дундаж цалингийн тоо"
                help="36+ сар — хуулиар шаардсан хэмжээ">
                <InputNumber style={{ width: '100%' }} min={1} max={120} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="coverage_amount" label="Даатгалын дүн (₮)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="premium_amount" label="Хураамж (жил)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="start_date" label="Эхлэх" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="end_date" label="Дуусах" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
