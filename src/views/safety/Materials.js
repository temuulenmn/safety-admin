import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Tabs, Table, Tag, Button, Modal, Form, Input, InputNumber,
  Select, Space, Popconfirm, Alert, message,
} from 'antd'
import { PlusOutlined, CalculatorOutlined, SaveOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const money = (n) => Number(n || 0).toLocaleString() + '₮'
const UNITS = ['ширхэг','кг','м³','м²','уут','литр','тонн','багц']

export default function Materials() {
  const [tab, setTab] = useState('calc')

  const [norms, setNorms] = useState([])
  const [loadingNorms, setLoadingNorms] = useState(false)
  const [modal, setModal] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const [area, setArea] = useState()
  const [calcCat, setCalcCat] = useState()
  const [calc, setCalc] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [estTitle, setEstTitle] = useState('')
  const [savingEst, setSavingEst] = useState(false)

  const [estimates, setEstimates] = useState([])

  const loadNorms = useCallback(() => {
    setLoadingNorms(true)
    api.getMaterialNorms().then(r => setNorms(r.data || [])).finally(() => setLoadingNorms(false))
  }, [])
  const loadEstimates = useCallback(() => {
    api.getMaterialEstimates().then(r => setEstimates(r.data || []))
  }, [])
  useEffect(() => { loadNorms(); loadEstimates() }, [loadNorms, loadEstimates])

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ unit: 'ширхэг', waste_pct: 0 })
    setModal(true)
  }
  const openEdit = (n) => {
    setEditing(n.id)
    form.setFieldsValue({
      name: n.name, category: n.category || '', unit: n.unit,
      qty_per_m2: Number(n.qty_per_m2), unit_price: Number(n.unit_price),
      waste_pct: Number(n.waste_pct), notes: n.notes || '',
    })
    setModal(true)
  }
  const saveNorm = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        qty_per_m2: Number(v.qty_per_m2) || 0,
        unit_price: Number(v.unit_price) || 0,
        waste_pct:  Number(v.waste_pct) || 0,
      }
      editing ? await api.updateMaterialNorm(editing, payload) : await api.createMaterialNorm(payload)
      setModal(false); loadNorms(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const deleteNorm = async (id) => { await api.deleteMaterialNorm(id); loadNorms(); message.success('Устгагдлаа') }

  const runCalc = async () => {
    if (!area || area <= 0) return
    setCalculating(true)
    try {
      const r = await api.calculateMaterials({ area_m2: Number(area), category: calcCat || undefined })
      setCalc(r.data)
    } finally { setCalculating(false) }
  }
  const saveEstimate = async () => {
    if (!estTitle || !area) return
    setSavingEst(true)
    try {
      await api.saveMaterialEstimate({ title: estTitle, area_m2: Number(area), category: calcCat || undefined })
      setEstTitle(''); loadEstimates(); message.success('Хадгалагдлаа')
    } finally { setSavingEst(false) }
  }
  const deleteEstimate = async (id) => { await api.deleteMaterialEstimate(id); loadEstimates(); message.success('Устгагдлаа') }

  const categories = [...new Set(norms.map(n => n.category).filter(Boolean))].sort()

  const calcCols = [
    { title: 'Материал', dataIndex: 'name' },
    { title: 'Ангилал', dataIndex: 'category', render: v => v || '—' },
    { title: 'Норм/м²', dataIndex: 'qty_per_m2', align: 'right' },
    { title: 'Хэмжээ', align: 'right', render: (_, l) => `${l.quantity} ${l.unit}` },
    { title: 'Нэгж үнэ', dataIndex: 'unit_price', align: 'right', render: v => money(v) },
    { title: 'Өртөг', dataIndex: 'cost', align: 'right',
      render: v => <strong>{money(v)}</strong> },
  ]

  const normCols = [
    { title: 'Материал', dataIndex: 'name' },
    { title: 'Ангилал', dataIndex: 'category', render: v => v || '—' },
    { title: 'Норм/м²', dataIndex: 'qty_per_m2', align: 'right' },
    { title: 'Нэгж', dataIndex: 'unit', width: 90 },
    { title: 'Үнэ', dataIndex: 'unit_price', align: 'right', render: v => money(v) },
    { title: 'Хаягдал', dataIndex: 'waste_pct', align: 'right', render: v => `${v}%` },
    { title: 'Төлөв', dataIndex: 'is_active', width: 100,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Идэвхгүй'}</Tag> },
    { title: '', width: 130, render: (_, n) => (
      <Space size="small">
        <Button size="small" onClick={() => openEdit(n)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => deleteNorm(n.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>Устгах</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const estCols = [
    { title: 'Нэр', dataIndex: 'title' },
    { title: 'Талбай', dataIndex: 'area_m2', align: 'right', render: v => `${v} м²` },
    { title: 'Нийт өртөг', dataIndex: 'total_cost', align: 'right',
      render: v => <strong>{money(v)}</strong> },
    { title: 'Үүсгэсэн', dataIndex: 'created_by_name', render: v => v || '—' },
    { title: 'Огноо', dataIndex: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '', width: 90, render: (_, e) => (
      <Popconfirm title="Тооцоог устгах уу?" onConfirm={() => deleteEstimate(e.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" danger>Устгах</Button>
      </Popconfirm>
    ) },
  ]

  const tabItems = [
    { key: 'calc', label: 'Тооцоолуур', children: (
      <>
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={6}>
              <div style={{ marginBottom: 4 }}>Талбай (м²)</div>
              <InputNumber value={area} onChange={setArea} min={0}
                style={{ width: '100%' }} onPressEnter={runCalc} />
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ marginBottom: 4 }}>Ажлын төрөл</div>
              <Select value={calcCat} onChange={setCalcCat} allowClear
                style={{ width: '100%' }} placeholder="Бүгд"
                options={categories.map(c => ({ value: c, label: c }))} />
            </Col>
            <Col xs={24} sm={4}>
              <Button type="primary" icon={<CalculatorOutlined />}
                onClick={runCalc} loading={calculating} disabled={!area}>Бодох</Button>
            </Col>
          </Row>
          <Alert type="info" showIcon style={{ marginTop: 12 }}
            message="Ажлын төрлөө сонгоод талбай оруулна. Норм = 1 м²-т ногдох хэмжээ × талбай × (1 + хаягдал%)." />
        </Card>

        {calc && (
          <Card title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{calc.area_m2} м²-ийн материал</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{money(calc.total_cost)}</span>
            </div>
          }>
            <Table rowKey="norm_id" size="middle" columns={calcCols} dataSource={calc.lines}
              pagination={false} locale={{ emptyText: 'Норм оруулаагүй байна.' }} />
            {calc.lines.length > 0 && (
              <Row gutter={12} align="bottom" style={{ marginTop: 16 }}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 4 }}>Тооцоог хадгалах нэр</div>
                  <Input value={estTitle} onChange={e => setEstTitle(e.target.value)}
                    placeholder="ж: А блок, 1-р давхар" />
                </Col>
                <Col xs={24} sm={6}>
                  <Button icon={<SaveOutlined />} onClick={saveEstimate}
                    loading={savingEst} disabled={!estTitle}>Хадгалах</Button>
                </Col>
              </Row>
            )}
          </Card>
        )}
      </>
    ) },
    { key: 'norms', label: 'Нормын жагсаалт', children: (
      <Card>
        <Table rowKey="id" size="middle" loading={loadingNorms}
          columns={normCols} dataSource={norms}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Норм байхгүй.' }} />
      </Card>
    ) },
    { key: 'saved', label: 'Хадгалсан тооцоо', children: (
      <Card>
        <Table rowKey="id" size="middle" columns={estCols} dataSource={estimates}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Тооцоо алга.' }} />
      </Card>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Материалын тооцоо</h4>
        {tab === 'norms' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Норм нэмэх</Button>
        )}
      </div>

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={saveNorm} onCancel={() => setModal(false)}
        title={editing ? 'Норм засах' : 'Норм нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" width={720} destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="name" label="Материалын нэр" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Нэгж">
                <Select options={UNITS.map(u => ({ value: u, label: u }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Ангилал / ажлын төрөл">
                <Input placeholder="ж: Цутгалт" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="qty_per_m2" label="1 м²-т ногдох хэмжээ" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.0001} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit_price" label="Нэгж үнэ (₮)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="waste_pct" label="Хаягдлын нөөц (%)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label="Тэмдэглэл"><Input /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
