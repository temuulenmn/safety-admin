import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Select, InputNumber, Input, Space, Statistic, Alert, Popconfirm, Tabs, message,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const TYPE_LABEL = { milk: 'Сүү', food: 'Хүнс', vitamin: 'Витамин', medicine: 'Эм' }

export default function DetoxRations() {
  const [tab, setTab] = useState('list')
  const [rows,   setRows]   = useState([])
  const [emps,   setEmps]   = useState([])
  const [missing,setMissing]= useState([])
  const [loading,setLoading]= useState(true)
  const [year, setYear] = useState(dayjs().year())
  const [month,setMonth]= useState(dayjs().month() + 1)

  const [modal,  setModal]  = useState(false)
  const [form]   = Form.useForm()
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getDetoxRations({ year, month }),
      api.getDetoxMissing(),
    ]).then(([r, m]) => { setRows(r.data || []); setMissing(m.data || []) })
      .finally(() => setLoading(false))
  }, [year, month])
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
  }, [])
  useEffect(load, [load])

  const openCreate = (emp) => {
    form.resetFields()
    form.setFieldsValue({
      employee_id: emp?.id,
      ration_month: dayjs().startOf('month'),
      ration_type: 'milk', quantity: 1, unit: 'литр',
      distributed_at: dayjs(),
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createDetoxRation({
        ...v,
        ration_month: v.ration_month.format('YYYY-MM-01'),
        distributed_at: v.distributed_at.format('YYYY-MM-DD'),
      })
      setModal(false); load(); message.success('Бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteDetoxRation(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: 'Ажилтан', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.emp_code} {r.full_name}</div>
        {r.is_high_risk_worker && <Tag color="red">⚠</Tag>}
      </>
    ) },
    { title: 'Сар', dataIndex: 'ration_month', width: 120,
      render: v => dayjs(v).format('YYYY-MM') },
    { title: 'Төрөл', dataIndex: 'ration_type', width: 100,
      render: v => <Tag color="blue">{TYPE_LABEL[v] || v}</Tag> },
    { title: 'Хэмжээ', width: 120,
      render: (_, r) => `${Number(r.quantity)} ${r.unit}` },
    { title: 'Өртөг', dataIndex: 'cost', align: 'right',
      render: v => v ? Number(v).toLocaleString() + '₮' : '—' },
    { title: 'Олгосон', dataIndex: 'distributed_at', width: 120,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Хариуцсан', dataIndex: 'distributed_by_name', render: v => v || '—' },
    { title: '', width: 60, render: (_, r) => (
      <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" danger>×</Button>
      </Popconfirm>
    ) },
  ]

  const missingCols = [
    { title: 'Ажилтан', render: (_, e) => `${e.emp_code} — ${e.full_name}` },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
    { title: '', width: 130, render: (_, e) => (
      <Button size="small" type="primary" onClick={() => openCreate(e)}>Олгох</Button>
    ) },
  ]

  const tabItems = [
    { key: 'list', label: `Олголт (${rows.length})`, children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Space>
            <InputNumber value={year} onChange={setYear} min={2020} max={2100} />
            <Select value={month} onChange={setMonth} style={{ width: 140 }}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}-р сар` }))} />
          </Space>
        </Card>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={cols} dataSource={rows}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Олголт алга' }} />
        </Card>
      </>
    ) },
    { key: 'missing', label: (
      <span><WarningOutlined style={{ color: missing.length ? '#faad14' : undefined }} /> Энэ сард аваагүй ({missing.length})</span>
    ), children: (
      <Card>
        <Table rowKey="id" size="middle" columns={missingCols} dataSource={missing}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'Бүгд авсан ✓' }} />
      </Card>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Хортой ажлын хор саармагжуулах</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>Олголт нэмэх</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 22 дугаар зүйл"
        description="Хөдөлмөрийн аюултай, хортой нөхцөлд ажил үүрэг гүйцэтгэдэг ажилтныг хор саармагжуулах бодис, хүнсний бүтээгдэхүүнээр үнэ төлбөргүй хангана." />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8}>
          <Card size="small"><Statistic title="Энэ сард аваагүй эрсдэлт ажилтан" value={missing.length}
            valueStyle={{ color: missing.length ? '#cf1322' : '#52c41a', fontWeight: 700 }} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small"><Statistic title="Энэ сард олгосон" value={rows.length}
            valueStyle={{ color: '#1890ff', fontWeight: 700 }} /></Card>
        </Col>
      </Row>

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title="Хор саармагжуулах олголт" confirmLoading={saving}
        okText="Бүртгэх" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}${e.is_high_risk_worker ? ' ⚠' : ''}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="ration_month" label="Аль сард" rules={[{ required: true }]}><DatePicker picker="month" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="ration_type" label="Төрөл">
                <Select options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="quantity" label="Хэмжээ"><InputNumber style={{ width: '100%' }} min={0} step={0.1} /></Form.Item></Col>
            <Col span={8}><Form.Item name="unit" label="Нэгж"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="cost" label="Өртөг (₮)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="distributed_at" label="Олгосон огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="distributed_by" label="Хариуцагч">
                <Select allowClear showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
