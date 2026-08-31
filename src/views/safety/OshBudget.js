import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Statistic, Alert, Popconfirm, Progress, Tabs, message,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, SettingOutlined, CalculatorOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const CAT_LABEL = {
  training: 'Сургалт', ppe: 'ХХХ', insurance: 'Даатгал',
  medical: 'Эмнэлэг', fire_safety: 'Гал', assessment: 'Үнэлгээ',
  committee: 'Зөвлөл', equipment: 'Тоног төхөөрөмж', other: 'Бусад',
}
const CAT_COLOR = {
  training: 'blue', ppe: 'geekblue', insurance: 'purple',
  medical: 'red', fire_safety: 'orange', assessment: 'cyan',
  committee: 'green', equipment: 'gold', other: 'default',
}
const fmt = n => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function OshBudget() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tab, setTab] = useState('summary')
  const [year, setYear] = useState(dayjs().year())
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [catF, setCatF] = useState()

  const [modal, setModal] = useState(false)
  const [form]  = Form.useForm()
  const [saving,setSaving]= useState(false)

  const [baseModal, setBaseModal] = useState(false)
  const [baseForm]  = Form.useForm()
  const [baseSaving,setBaseSaving]= useState(false)
  const [suggesting,setSuggesting]= useState(false)
  const [suggestion,setSuggestion]= useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getOshBudgetSummary({ year }),
      api.getOshExpenses({ year, category: catF, project_id: currentProjectId }),
    ]).then(([s, e]) => { setSummary(s.data); setExpenses(e.data || []) })
      .finally(() => setLoading(false))
  }, [year, catF, currentProjectId])
  useEffect(load, [load])

  const openExpense = () => {
    form.resetFields()
    form.setFieldsValue({ spent_at: dayjs(), category: 'training' })
    setModal(true)
  }
  const saveExpense = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createOshExpense({
        ...v, spent_at: v.spent_at.format('YYYY-MM-DD'),
      })
      setModal(false); load(); message.success('Бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const removeExpense = async (id) => { await api.deleteOshExpense(id); load(); message.success('Устгагдлаа') }

  const openBaseline = () => {
    baseForm.resetFields()
    baseForm.setFieldsValue({
      year,
      required_pct: summary?.baseline?.required_pct ? Number(summary.baseline.required_pct) : 1.5,
      production_cost: summary?.baseline?.production_cost ? Number(summary.baseline.production_cost) : null,
      notes: summary?.baseline?.notes || '',
    })
    setSuggestion(null)
    setBaseModal(true)
  }
  const fetchSuggestion = async () => {
    setSuggesting(true)
    try {
      const r = await api.suggestOshBaseline({ year: baseForm.getFieldValue('year') || year })
      setSuggestion(r.data)
    } finally { setSuggesting(false) }
  }
  const applySuggestion = (amt) => {
    baseForm.setFieldsValue({ production_cost: amt })
    message.success(`${Number(amt).toLocaleString()}₮ бөглөгдлөө`)
  }
  const saveBaseline = async () => {
    try {
      const v = await baseForm.validateFields()
      setBaseSaving(true)
      await api.setOshBaseline(v)
      setBaseModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setBaseSaving(false) }
  }

  const cols = [
    { title: 'Огноо', dataIndex: 'spent_at', width: 120,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Ангилал', dataIndex: 'category', width: 140,
      render: v => <Tag color={CAT_COLOR[v]}>{CAT_LABEL[v] || v}</Tag> },
    { title: 'Тайлбар', dataIndex: 'description' },
    { title: 'Нийлүүлэгч', dataIndex: 'vendor', width: 140, render: v => v || '—' },
    { title: 'Дүн', dataIndex: 'amount', align: 'right', width: 140,
      render: v => <strong>{fmt(v)}</strong> },
    { title: 'Баримт', dataIndex: 'receipt_number', width: 110,
      render: v => v ? <code>{v}</code> : '—' },
    { title: '', width: 60, render: (_, r) => (
      <Popconfirm title="Устгах уу?" onConfirm={() => removeExpense(r.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" danger>×</Button>
      </Popconfirm>
    ) },
  ]

  const pct = summary?.baseline && summary.baseline.production_cost > 0
    ? Math.round(summary.spent / Number(summary.baseline.production_cost) * 10000) / 100
    : null
  const reqPct = summary?.baseline ? Number(summary.baseline.required_pct) : 1.5
  const meets = pct != null && pct >= reqPct

  const tabItems = [
    { key: 'summary', label: 'Гүйцэтгэлийн товч', children: (
      <>
        {summary?.baseline ? (
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col md={8} xs={24}>
                <Statistic title="Үйлдвэрлэлийн жилийн зардал"
                  value={fmt(summary.baseline.production_cost)} valueStyle={{ fontWeight: 700 }} />
              </Col>
              <Col md={8} xs={24}>
                <Statistic title="ХАБЭА-д зарцуулах ёстой"
                  value={fmt(summary.required)}
                  suffix={<span style={{ fontSize: 13, color: '#8c8c8c' }}>({reqPct}%)</span>}
                  valueStyle={{ color: '#1890ff', fontWeight: 700 }} />
              </Col>
              <Col md={8} xs={24}>
                <Statistic title="Зарцуулсан" value={fmt(summary.spent)}
                  suffix={pct != null && <span style={{ fontSize: 13, color: meets ? '#52c41a' : '#cf1322' }}>({pct}%)</span>}
                  valueStyle={{ color: meets ? '#52c41a' : '#cf1322', fontWeight: 700 }} />
                <Progress percent={pct ? Math.min(100, (pct / reqPct) * 100) : 0}
                  strokeColor={meets ? '#52c41a' : '#faad14'}
                  showInfo={false} style={{ marginTop: 4 }} />
              </Col>
            </Row>
            {pct != null && !meets && (
              <Alert type="warning" showIcon style={{ marginTop: 12 }}
                message={`⚠ Хуулиар шаардсан ${reqPct}%-иас доогуур зарцуулсан`}
                description={`${fmt(summary.required - summary.spent)} нэмж зарцуулах шаардлагатай`} />
            )}
          </Card>
        ) : (
          <Alert type="info" showIcon style={{ marginBottom: 16 }}
            message="Үйлдвэрлэлийн зардлын суурь тавьж эхлүүлнэ үү"
            description="1.5% рүү тааруулж тооцох суурь дүнг оруулна уу."
            action={<Button type="primary" size="small" onClick={openBaseline}>Тохируулах</Button>} />
        )}

        {summary?.by_category?.length > 0 && (
          <Card title="Ангилалаар">
            <Row gutter={[12, 12]}>
              {summary.by_category.map(c => {
                const catPct = summary.spent > 0
                  ? Math.round(Number(c.total) / summary.spent * 100) : 0
                return (
                  <Col key={c.category} xs={12} sm={8} md={6}>
                    <Card size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color={CAT_COLOR[c.category]}>{CAT_LABEL[c.category]}</Tag>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{catPct}%</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{fmt(c.total)}</div>
                      <Progress percent={catPct} size="small" showInfo={false} />
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </Card>
        )}
      </>
    ) },
    { key: 'expenses', label: `Зардлын жагсаалт (${expenses.length})`, children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Select value={catF} onChange={setCatF} allowClear
            placeholder="Бүх ангилал" style={{ width: 200 }}
            options={Object.entries(CAT_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
        </Card>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={cols} dataSource={expenses}
            pagination={{ pageSize: 25 }} locale={{ emptyText: 'Зардал алга' }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>ХАБЭА-ын төсөв (1.5% дүрэм)</h4>
        <Space>
          <InputNumber value={year} onChange={setYear} min={2020} max={2100} />
          <Button icon={<SettingOutlined />} onClick={openBaseline}>Суурь тохируулах</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openExpense}>Зардал нэмэх</Button>
        </Space>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 26.2 дугаар зүйл"
        description="Аж ахуйн нэгж нь үйлдвэрлэл, үйлчилгээний зардлын 1.5%-иас доошгүй, төсвийн байгууллага 0.5%-иас доошгүй хөрөнгийг хөдөлмөрийн аюулгүй байдал, эрүүл ахуйн ажлыг санхүүжүүлэхэд зарцуулна." />

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={saveExpense} onCancel={() => setModal(false)}
        title="Зардал бүртгэх" confirmLoading={saving}
        okText="Бүртгэх" cancelText="Болих" width={640} destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="category" label="Ангилал" rules={[{ required: true }]}>
                <Select options={Object.entries(CAT_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="spent_at" label="Огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Тайлбар" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="amount" label="Дүн (₮)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="vendor" label="Нийлүүлэгч"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="receipt_number" label="Баримтын №"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="attachment_url" label="Хавсралт URL"><Input placeholder="https://..." /></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={baseModal} onOk={saveBaseline} onCancel={() => setBaseModal(false)}
        title={`${year} оны төсвийн суурь`} confirmLoading={baseSaving} width={640}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={baseForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="year" label="Жил" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={2020} max={2100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="required_pct" label="Шаардлагатай хувь %">
                <Select options={[
                  { value: 1.5, label: '1.5% — аж ахуйн нэгж' },
                  { value: 0.5, label: '0.5% — төсвийн байгууллага' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="production_cost" label="Үйлдвэрлэлийн жилийн зардал (₮)" rules={[{ required: true }]}
            help="Тухайн жилийн үйлдвэрлэл, үйлчилгээний нийт зардлын хүлээгдэж буй дүн">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Одоо байгаа өгөгдлөөс автомат тооцоолох:</span>
                <Button size="small" icon={<CalculatorOutlined />} loading={suggesting} onClick={fetchSuggestion}>
                  Тооцоолох
                </Button>
              </div>
              {suggestion && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Төслийн budget нийлбэр ({suggestion.project_count} төсөл):</span>
                    <Space>
                      <strong>{fmt(suggestion.project_budget_sum)}</strong>
                      <Button size="small" type="link" onClick={() => applySuggestion(suggestion.project_budget_sum)}>Ашиглах</Button>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Бригадын гэрээний нийлбэр:</span>
                    <Space>
                      <strong>{fmt(suggestion.brigade_contract_sum)}</strong>
                      <Button size="small" type="link" onClick={() => applySuggestion(suggestion.brigade_contract_sum)}>Ашиглах</Button>
                    </Space>
                  </div>
                </>
              )}
            </Space>
          </Card>

          <Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
