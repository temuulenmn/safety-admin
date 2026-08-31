import React, { useEffect, useState, useCallback } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, Statistic, Alert, Popconfirm, message, Tooltip,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, WarningOutlined, TagsOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

// worker_clothing нь хаалганы PPE илрүүлэлтийн ЭХ СУРВАЛЖ — энд бүртгэгдээгүй
// хэрэгсэл хаалганд "дутуу" гэж тоологдож, ажилтан торгууль хүртэнэ.
const TYPE_LABEL = {
  helmet: 'Каска', vest: 'Хантааз', boots: 'Гутал', gloves: 'Бээлий',
  glasses: 'Нүдний шил', harness: 'Аюулгүйн бүс', mask: 'Амны хаалт', earplug: 'Чихэвч',
}
const TYPE_COLOR = {
  helmet: 'red', vest: 'orange', boots: 'brown', gloves: 'blue',
  glasses: 'cyan', harness: 'purple', mask: 'green', earplug: 'default',
}
// Хаалга эдгээрийг заавал шаарддаг (DEFAULT_REQUIRED_PPE)
const MANDATORY = ['helmet', 'vest', 'boots']

const STATUS_LABEL = { active: 'Идэвхтэй', replaced: 'Солигдсон', lost: 'Алдагдсан', damaged: 'Эвдэрсэн' }
const STATUS_COLOR = { active: 'success', replaced: 'default', lost: 'red', damaged: 'orange' }

export default function WorkerClothing() {
  const [rows,    setRows]    = useState([])
  const [emps,    setEmps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [typeF,   setTypeF]   = useState()
  const [empF,    setEmpF]    = useState()
  const [statusF, setStatusF] = useState('active')
  const [search,  setSearch]  = useState('')

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.getWorkerClothing({
      item_type: typeF, employee_id: empF, status: statusF, search: search || undefined, limit: 200,
    })
      .then(r => setRows(r.data || []))
      .catch(e => message.error(e?.response?.data?.message || 'Ачаалахад алдаа гарлаа'))
      .finally(() => setLoading(false))
  }, [typeF, empF, statusF, search])
  useEffect(load, [load])

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 })
      .then(r => setEmps(r.data || []))
      .catch(() => {})
  }, [])

  // Заавал өмсөх хэрэгслийн таг дутуу ажилтнууд.
  // Хуудаслагдсан жагсаалтаас тооцвол хязгаараас гадуурх ажилтан бүр
  // "дутуу" мэт харагдана — тиймээс серверээс бүтэн дүнг авна.
  const [coverage, setCoverage] = useState(null)
  const loadCoverage = useCallback(() => {
    api.getClothingCoverage()
      .then(r => setCoverage(r.data))
      .catch(() => setCoverage(null))
  }, [])
  useEffect(loadCoverage, [loadCoverage])
  const gaps = coverage?.gaps || []

  const openCreate = (preset = {}) => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ status: 'active', issued_at: dayjs(), ...preset })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      employee_id: r.employee_id, rfid_tag: r.rfid_tag, item_type: r.item_type,
      size: r.size || '', status: r.status,
      issued_at: r.issued_at ? dayjs(r.issued_at) : null, notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = { ...v, issued_at: v.issued_at ? v.issued_at.format('YYYY-MM-DD') : null }
      if (editing) await api.updateWorkerClothing(editing, payload)
      else await api.createWorkerClothing(payload)
      message.success(editing ? 'Шинэчлэгдлээ' : 'RFID таг бүртгэгдлээ')
      setModal(false); load(); loadCoverage()
    } catch (e) {
      if (e?.errorFields) return
      const m = e?.response?.data?.message || ''
      message.error(/duplicate|unique/i.test(m) ? 'Энэ RFID таг өөр хэрэгсэлд бүртгэгдсэн байна' : (m || 'Хадгалахад алдаа гарлаа'))
    } finally { setSaving(false) }
  }
  const remove = async (id) => {
    try { await api.deleteWorkerClothing(id); message.success('Устгагдлаа'); load(); loadCoverage() }
    catch (e) { message.error(e?.response?.data?.message || 'Устгахад алдаа гарлаа') }
  }

  const activeRows = rows.filter(r => r.status === 'active')
  const cols = [
    { title: 'Ажилтан', dataIndex: 'employee_id', width: 220,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.full_name || `#${r.employee_id}`}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.emp_code}</div>
        </div>
      ) },
    { title: 'Хэрэгсэл', dataIndex: 'item_type', width: 130,
      render: v => <Tag color={TYPE_COLOR[v] || 'default'}>{TYPE_LABEL[v] || v}</Tag> },
    { title: 'RFID таг', dataIndex: 'rfid_tag', width: 230,
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: 'Хэмжээ', dataIndex: 'size', width: 80, render: v => v || '—' },
    { title: 'Олгосон', dataIndex: 'issued_at', width: 110,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 110,
      render: v => <Tag color={STATUS_COLOR[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag> },
    { title: '', width: 110, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" okText="Тийм" cancelText="Үгүй" onConfirm={() => remove(r.id)}>
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Ажлын хувцасны RFID бүртгэл</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>RFID таг бүртгэх</Button>
      </div>

      <Alert type="info" showIcon icon={<TagsOutlined />} style={{ marginBottom: 16 }}
        message="Энэ бүртгэл нь хаалганы шалгалтын эх сурвалж"
        description="Хаалганы уншигч энд бүртгэгдсэн RFID тагаар ажилтны хамгаалах хэрэгслийг таньдаг. Бүртгэгдээгүй хэрэгсэл «дутуу» гэж тоологдож, ажилтан сануулга эсвэл торгууль хүртэнэ." />

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Идэвхтэй таг" value={activeRows.length} suffix={rows.length >= 200 ? '+' : ''} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Бүрэн хамрагдсан" value={coverage?.covered ?? '—'} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Идэвхтэй ажилтан" value={coverage?.active_employees ?? emps.length} /></Card></Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Заавал хэрэгсэл дутуу" value={gaps.length}
              valueStyle={{ color: gaps.length ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      {gaps.length > 0 && (
        <Alert type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message={`${gaps.length} ажилтан заавал өмсөх хэрэгслийн RFID тагтай биш — хаалганд зөрчил үүснэ`}
          description={
            <div style={{ marginTop: 8 }}>
              <Space size={[6, 6]} wrap>
                {gaps.slice(0, 12).map(g => (
                  <Tooltip key={g.id} title={`Дутуу: ${g.missing.map(t => TYPE_LABEL[t]).join(', ')}`}>
                    <Tag style={{ cursor: 'pointer' }}
                      onClick={() => openCreate({ employee_id: g.id, item_type: g.missing[0] })}>
                      {g.emp_code} · {g.missing.map(t => TYPE_LABEL[t]).join(', ')}
                    </Tag>
                  </Tooltip>
                ))}
                {gaps.length > 12 && <Tag>+{gaps.length - 12} бусад</Tag>}
              </Space>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                Ажилтан дээр дарж тухайн хэрэгслийн тагийг шууд бүртгэнэ.
              </div>
            </div>
          } />
      )}

      <Card size="small">
        <Space wrap style={{ marginBottom: 12 }}>
          <Input.Search placeholder="RFID таг эсвэл нэрээр хайх" allowClear style={{ width: 260 }}
            onSearch={setSearch} onChange={e => { if (!e.target.value) setSearch('') }} />
          <Select allowClear placeholder="Хэрэгсэл" style={{ width: 150 }} value={typeF} onChange={setTypeF}
            options={Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
          <Select allowClear showSearch placeholder="Ажилтан" style={{ width: 220 }} value={empF} onChange={setEmpF}
            optionFilterProp="label"
            options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.first_name} ${e.last_name}` }))} />
          <Select allowClear placeholder="Төлөв" style={{ width: 140 }} value={statusF} onChange={setStatusF}
            options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
        </Space>
        <Table rowKey="id" size="small" loading={loading} columns={cols} dataSource={rows}
          pagination={{ pageSize: 25, showSizeChanger: false }} scroll={{ x: 1000 }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)} confirmLoading={saving}
        title={editing ? 'RFID таг засах' : 'Шинэ RFID таг бүртгэх'}
        okText="Хадгалах" cancelText="Болих" width={560}>
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true, message: 'Ажилтан сонгоно уу' }]}>
                <Select showSearch optionFilterProp="label" placeholder="Ажилтан сонгох"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.first_name} ${e.last_name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="item_type" label="Хэрэгслийн төрөл" rules={[{ required: true, message: 'Төрөл сонгоно уу' }]}>
                <Select options={Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="size" label="Хэмжээ">
                <Select allowClear options={['S', 'M', 'L', 'XL', 'XXL', '39', '40', '41', '42', '43', '44', '45'].map(v => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="rfid_tag" label="RFID таг (EPC)"
                extra="Ширээний уншигч дээр тагийг уншуулаад буусан утгыг энд буулгана."
                rules={[
                  { required: true, message: 'RFID таг оруулна уу' },
                  { pattern: /^[A-Za-z0-9_-]{6,64}$/, message: '6–64 тэмдэгт, зөвхөн үсэг/тоо' },
                ]}>
                <Input placeholder="жишээ: E2806894000050350BB478E6"
                  style={{ fontFamily: 'monospace' }} autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="issued_at" label="Олгосон огноо">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Төлөв" initialValue="active">
                <Select options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label="Тэмдэглэл">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
