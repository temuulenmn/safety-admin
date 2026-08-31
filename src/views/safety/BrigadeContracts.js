import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Alert, Progress, Popconfirm, Statistic, message,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, PlayCircleOutlined, CheckOutlined, DollarOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = { pending: 'orange', in_progress: 'blue', completed: 'purple', paid: 'success', cancelled: 'default' }
const STATUS_LABEL = { pending: 'Хүлээгдэж буй', in_progress: 'Гүйцэтгэж буй', completed: 'Дууссан', paid: 'Төлөгдсөн', cancelled: 'Цуцлагдсан' }
const fmt = n => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function BrigadeContracts() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [rows,     setRows]     = useState([])
  const [brigades, setBrigades] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState()
  const [modal,    setModal]    = useState(false)
  const [detail,   setDetail]   = useState(null)

  const load = () => {
    setLoading(true)
    api.getBrigadeContracts({ status: status || undefined, project_id: currentProjectId || undefined, limit: 200 })
      .then(r => setRows(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { api.getBrigades({ active: 'true' }).then(r => setBrigades(r.data || [])) }, [])
  useEffect(load, [status, currentProjectId])

  const open = (id) => api.getBrigadeContract(id).then(r => setDetail(r.data))

  const cols = [
    { title: '№', dataIndex: 'contract_number', width: 130, render: v => <code>{v}</code> },
    { title: 'Бригад', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.brigade_name}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.specialty} · {r.leader_name}</div>
      </>
    ) },
    { title: 'Ажил', render: (_, r) => (
      <>
        <div style={{ maxWidth: 320 }}>{r.work_description}</div>
        {r.location && <div style={{ color: '#8c8c8c', fontSize: 11 }}>📍 {r.location}</div>}
      </>
    ) },
    { title: 'Хугацаа', width: 130, render: (_, r) => (
      <span style={{ fontSize: 12 }}>
        {r.start_date ? dayjs(r.start_date).format('MM-DD') : '—'} → {r.end_date ? dayjs(r.end_date).format('MM-DD') : '—'}
      </span>
    ) },
    { title: 'Дүн', dataIndex: 'contract_amount', width: 140,
      render: v => <strong>{fmt(v)}</strong> },
    { title: 'Төлсөн', width: 160, render: (_, r) => {
      const pct = r.contract_amount > 0 ? Math.round(Number(r.paid_amount) / Number(r.contract_amount) * 100) : 0
      return (
        <>
          <div style={{ color: '#52c41a', fontSize: 12 }}>{fmt(r.paid_amount)} ({pct}%)</div>
          <Progress percent={pct} size="small" showInfo={false} strokeColor={pct >= 100 ? '#52c41a' : '#1890ff'} />
        </>
      )
    } },
    { title: 'Төлөв', dataIndex: 'status', width: 140,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: '', width: 90, render: (_, r) => (
      <Button size="small" onClick={(e) => { e.stopPropagation(); open(r.id) }}>Үзэх</Button>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Бригадын гэрээ</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)} disabled={brigades.length === 0}>
          Гэрээ үүсгэх
        </Button>
      </div>

      {brigades.length === 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Идэвхтэй бригад алга байна. Эхлээд 'Бригадууд' хэсэгт бүртгэнэ үү." />
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Select value={status} onChange={setStatus} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Гэрээ алга' }}
          onRow={(r) => ({ onClick: () => open(r.id), style: { cursor: 'pointer' } })} />
      </Card>

      {modal && <ContractForm brigades={brigades}
        onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />}
      {detail && <ContractDetailModal contract={detail}
        onClose={() => { setDetail(null); load() }} onRefresh={() => open(detail.id)} />}
    </div>
  )
}

function ContractForm({ brigades, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const save = async () => {
    setError('')
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createBrigadeContract({
        brigade_id: v.brigade_id,
        work_description: v.work_description,
        location: v.location || null,
        start_date: v.start_date ? v.start_date.format('YYYY-MM-DD') : null,
        end_date:   v.end_date   ? v.end_date.format('YYYY-MM-DD')   : null,
        contract_amount: Number(v.contract_amount),
        notes: v.notes || null,
      })
      message.success('Үүсгэгдлээ'); onSaved()
    } catch (e) {
      if (e?.errorFields) return
      setError(e.response?.data?.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }

  return (
    <Modal open onOk={save} onCancel={onClose} confirmLoading={saving} width={720}
      title="Шинэ гэрээ үүсгэх" okText="Үүсгэх" cancelText="Болих" destroyOnClose maskClosable={false}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="brigade_id" label="Бригад" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
            options={brigades.map(b => ({
              value: b.id,
              label: `${b.name} (${b.specialty || '—'}) — ${b.leader_name || '?'}${b.is_external ? ' [Гадны]' : ''}`,
            }))} />
        </Form.Item>
        <Form.Item name="work_description" label="Ажлын тайлбар" rules={[{ required: true }]}>
          <Input.TextArea rows={2} placeholder="1-р давхрын мужаанийн ажил..." />
        </Form.Item>
        <Form.Item name="location" label="Байршил/Талбай">
          <Input placeholder="1-р давхар, А блок..." />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="start_date" label="Эхлэх огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item name="end_date" label="Дуусах огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
        <Form.Item name="contract_amount" label="Гэрээний нийт дүн (₮)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  )
}

function ContractDetailModal({ contract, onClose, onRefresh }) {
  const [payMode, setPayMode] = useState(false)
  const [payForm] = Form.useForm()
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [acting,  setActing]  = useState(false)

  const remaining = Number(contract.contract_amount) - Number(contract.paid_amount)
  const pct = contract.contract_amount > 0 ? Math.round(Number(contract.paid_amount) / Number(contract.contract_amount) * 100) : 0

  const openPay = () => {
    payForm.resetFields()
    payForm.setFieldsValue({ paid_at: dayjs(), payment_method: 'cash' })
    setPayMode(true); setError('')
  }
  const startContract = async () => {
    setActing(true)
    try { await api.startBrigadeContract(contract.id); onRefresh(); message.success('Эхлүүлсэн') } finally { setActing(false) }
  }
  const completeContract = async () => {
    setActing(true)
    try { await api.completeBrigadeContract(contract.id); onRefresh(); message.success('Дууссан') } finally { setActing(false) }
  }
  const cancelContract = async () => {
    setActing(true)
    try { await api.cancelBrigadeContract(contract.id); onRefresh(); message.success('Цуцлагдсан') } finally { setActing(false) }
  }
  const savePay = async () => {
    setError('')
    try {
      const v = await payForm.validateFields()
      const amt = Number(v.amount)
      if (amt > remaining + 0.01) return setError(`Үлдсэн дүнгээс хэтэрсэн (үлд ${fmt(remaining)})`)
      setSaving(true)
      await api.recordBrigadePayment(contract.id, {
        amount: amt,
        paid_at: v.paid_at.format('YYYY-MM-DD'),
        payment_method: v.payment_method,
        paid_to_name: v.paid_to_name || null,
        receipt_number: v.receipt_number || null,
        notes: v.notes || null,
      })
      setPayMode(false); onRefresh(); message.success('Бүртгэгдлээ')
    } catch (e) {
      if (e?.errorFields) return
      setError(e.response?.data?.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }
  const removePayment = async (pid) => { await api.deleteBrigadePayment(pid); onRefresh(); message.success('Устгагдлаа') }

  const payCols = [
    { title: 'Огноо', dataIndex: 'paid_at', width: 120, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Дүн', dataIndex: 'amount', align: 'right', render: v => <strong>{fmt(v)}</strong> },
    { title: 'Хэлбэр', dataIndex: 'payment_method', width: 100 },
    { title: 'Авсан хүн', dataIndex: 'paid_to_name', render: v => v || '—' },
    { title: 'Баримт', dataIndex: 'receipt_number', render: v => v || '—' },
    { title: 'Бүртгэсэн', dataIndex: 'recorded_by_name', render: v => v || '—' },
    { title: '', width: 60, render: (_, p) => (
      <Popconfirm title="Устгах уу?" onConfirm={() => removePayment(p.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" danger>×</Button>
      </Popconfirm>
    ) },
  ]

  return (
    <Modal open onCancel={onClose} width={1000}
      title={<>{contract.contract_number} — {contract.brigade_name} <Tag color={STATUS_COLOR[contract.status]}>{STATUS_LABEL[contract.status]}</Tag></>}
      footer={<Button onClick={onClose}>Хаах</Button>}>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Бригадын ахлагч</div>
          <div style={{ fontWeight: 600 }}>{contract.leader_name} {contract.is_external && <Tag color="cyan">Гадны</Tag>}</div>
          {contract.leader_phone && <div style={{ fontSize: 12 }}>📞 {contract.leader_phone}</div>}
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Хугацаа</div>
          <div>{contract.start_date ? dayjs(contract.start_date).format('YYYY-MM-DD') : '—'}</div>
          <div>{contract.end_date ? dayjs(contract.end_date).format('YYYY-MM-DD') : '—'}</div>
        </Col>
        <Col span={6}>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>Байршил</div>
          <div>{contract.location || '—'}</div>
        </Col>
      </Row>

      <Alert style={{ marginBottom: 12 }} message={<><strong>Ажил:</strong> {contract.work_description}</>}
        description={contract.notes ? <span style={{ color: '#8c8c8c' }}>📝 {contract.notes}</span> : null} />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic title="Гэрээний дүн" value={fmt(contract.contract_amount)}
              valueStyle={{ color: '#1890ff', fontWeight: 700 }} />
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic title="Төлсөн" value={fmt(contract.paid_amount)}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }} />
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic title="Үлдсэн" value={fmt(remaining)}
              valueStyle={{ color: remaining > 0 ? '#cf1322' : '#52c41a', fontWeight: 700 }} />
          </Col>
        </Row>
        <Progress percent={pct} strokeColor={pct >= 100 ? '#52c41a' : '#1890ff'} style={{ marginTop: 8 }} />
      </Card>

      <Space wrap style={{ marginBottom: 16 }}>
        {contract.status === 'pending' && (
          <Popconfirm title="Гүйцэтгэлийг эхлүүлэх үү?" onConfirm={startContract} okText="Тийм" cancelText="Үгүй">
            <Button type="primary" icon={<PlayCircleOutlined />} loading={acting}>Гүйцэтгэл эхлүүлэх</Button>
          </Popconfirm>
        )}
        {contract.status === 'in_progress' && (
          <Popconfirm title="Ажлыг дууссан гэж тэмдэглэх үү?" onConfirm={completeContract} okText="Тийм" cancelText="Үгүй">
            <Button type="primary" icon={<CheckOutlined />} loading={acting}>Ажил дууссан</Button>
          </Popconfirm>
        )}
        {(contract.status === 'pending' || contract.status === 'in_progress') && (
          <Popconfirm title="Гэрээг цуцлах уу?" onConfirm={cancelContract} okText="Тийм" cancelText="Үгүй">
            <Button danger loading={acting}>Цуцлах</Button>
          </Popconfirm>
        )}
      </Space>

      <Card size="small" title={`Төлбөрийн түүх (${contract.payments?.length || 0})`}
        extra={contract.status !== 'cancelled' && remaining > 0 && (
          <Button size="small" type="primary" icon={<DollarOutlined />} onClick={openPay}>Төлбөр бүртгэх</Button>
        )}>
        {payMode && (
          <div style={{ padding: 12, background: '#fafafa', marginBottom: 8, borderRadius: 6 }}>
            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 8 }} />}
            <Form form={payForm} layout="vertical" requiredMark={false}>
              <Row gutter={8}>
                <Col span={6}>
                  <Form.Item name="amount" label="Дүн (₮)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder={`үлд ${fmt(remaining)}`} />
                  </Form.Item>
                </Col>
                <Col span={5}><Form.Item name="paid_at" label="Огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}>
                  <Form.Item name="payment_method" label="Хэлбэр">
                    <Select options={[
                      { value: 'cash',     label: 'Бэлэн' },
                      { value: 'transfer', label: 'Шилжүүлэг' },
                      { value: 'card',     label: 'Карт' },
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={5}><Form.Item name="paid_to_name" label="Авсан хүн"><Input placeholder={contract.leader_name || ''} /></Form.Item></Col>
                <Col span={4}><Form.Item name="receipt_number" label="Баримтын №"><Input /></Form.Item></Col>
                <Col span={24}><Form.Item name="notes"><Input placeholder="Тэмдэглэл" /></Form.Item></Col>
              </Row>
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setPayMode(false)}>Болих</Button>
                  <Button type="primary" onClick={savePay} loading={saving}>Бүртгэх</Button>
                </Space>
              </div>
            </Form>
          </div>
        )}
        <Table rowKey="id" size="small" columns={payCols} dataSource={contract.payments || []}
          pagination={false} locale={{ emptyText: 'Төлбөр алга' }} />
      </Card>
    </Modal>
  )
}
