import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Statistic, Table, Button, Modal, Form, Input, DatePicker,
  Alert, Space, Popconfirm, InputNumber, Spin, message,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const money = (n) => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function PenaltyFund() {
  const [balance, setBalance] = useState(null)
  const [expenses,setExpenses]= useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.getFundBalance(), api.getFundExpenses()])
      .then(([b, e]) => { setBalance(b.data); setExpenses(e.data || []) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({ spent_at: dayjs() })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createFundExpense({
        ...v,
        amount: Number(v.amount),
        spent_at: v.spent_at.format('YYYY-MM-DD'),
      })
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteFundExpense(id); load(); message.success('Устгагдлаа') }

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>

  const bal = Number(balance?.balance || 0)

  const cols = [
    { title: 'Огноо', dataIndex: 'spent_at', width: 120, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Зориулалт', dataIndex: 'purpose', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Тэмдэглэл', dataIndex: 'notes', render: v => <span style={{ color: '#8c8c8c' }}>{v || '—'}</span> },
    { title: 'Шийдсэн', dataIndex: 'decided_by_name', width: 130, render: v => v || '—' },
    { title: 'Дүн', dataIndex: 'amount', width: 130, align: 'right',
      render: v => <span style={{ fontWeight: 700 }}>{money(v)}</span> },
    { title: '', width: 60, render: (_, e) => (
      <Popconfirm title="Устгах уу?" onConfirm={() => remove(e.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" icon={<DeleteOutlined />} danger />
      </Popconfirm>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Торгуулийн сан</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={bal <= 0}>
          Зарцуулалт нэмэх
        </Button>
      </div>

      <Alert type="info" style={{ marginBottom: 16 }} showIcon
        message="Цуглуулсан торгуулийн мөнгийг ажилчдад нээлттэй харуулна. Ажилчдын саналаар уг сангаас зарцуулна." />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="Нийт цуглуулсан" value={money(balance?.collected)}
            valueStyle={{ color: '#52c41a', fontWeight: 700 }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="Зарцуулсан" value={money(balance?.spent)}
            valueStyle={{ color: '#faad14', fontWeight: 700 }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="Үлдэгдэл" value={money(balance?.balance)}
            valueStyle={{ color: '#5856d6', fontWeight: 700 }} /></Card>
        </Col>
      </Row>

      <Card title="Зарцуулалтын түүх">
        <Table rowKey="id" size="middle" columns={cols} dataSource={expenses}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{ emptyText: 'Зарцуулалт алга' }} />
      </Card>

      <Modal
        title="Сангийн зарцуулалт"
        open={modal} onOk={save} onCancel={() => setModal(false)}
        okText="Хадгалах" cancelText="Болих" confirmLoading={saving} destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="purpose" label="Зориулалт" rules={[{ required: true }]}>
            <Input placeholder="Ажилчдын аялал, цайны өрөөний хэрэгсэл..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amount" label="Дүн (₮)"
                rules={[{ required: true }, { validator: (_, v) =>
                  Number(v) > bal ? Promise.reject('Үлдэгдлээс их байна') : Promise.resolve() }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={bal} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spent_at" label="Огноо">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            Үлдэгдэл: <strong>{money(bal)}</strong>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
