import React, { useState, useCallback, useEffect } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Space, Checkbox, message,
} from 'antd'
import { PlusOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'
import { MN_BANKS } from 'src/utils/banks'
import EmployeeQrModal from 'src/components/EmployeeQrModal'

const STATUS_COLOR = { active: 'success', inactive: 'default', on_leave: 'orange', terminated: 'red' }
const STATUS_LABEL = { active: 'Идэвхтэй', inactive: 'Идэвхгүй', on_leave: 'Чөлөөт', terminated: 'Чөлөөлөгдсөн' }

export default function Employees() {
  const [depts,   setDepts]   = useState([])
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState({ current: 1, pageSize: 25, total: 0 })
  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [saving,  setSaving]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [qrFor,   setQrFor]   = useState(null)

  const [zones, setZones] = useState([])
  useEffect(() => {
    api.getDepartments().then(r => setDepts(r.data || []))
    api.getDangerZones().then(r => setZones(r.data || []))
  }, [])

  const load = useCallback((p = 1, l = 25) => {
    setLoading(true)
    api.getEmployees({ page: p, limit: l, search, status: statusF || undefined })
      .then(r => {
        setRows(r.data || [])
        setPage({ current: p, pageSize: l, total: r.total || (r.data || []).length })
      }).finally(() => setLoading(false))
  }, [search, statusF])
  useEffect(() => { load(1, page.pageSize) /* eslint-disable-next-line */ }, [statusF])

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ status: 'active' })
    setModal(true)
  }
  const openEdit = (row) => {
    setEditing(row.id)
    form.setFieldsValue({
      emp_code: row.emp_code, first_name: row.first_name, last_name: row.last_name,
      gender: row.gender || undefined,
      birth_date: row.birth_date ? dayjs(row.birth_date) : null,
      register_number: row.register_number || '', phone: row.phone || '', email: row.email || '',
      address: row.address || '', position: row.position || '',
      department_id: row.department_id || undefined,
      hire_date: row.hire_date ? dayjs(row.hire_date) : null,
      base_salary: row.base_salary ? Number(row.base_salary) : null,
      status: row.status,
      bank_name: row.bank_name || undefined, bank_account: row.bank_account || '',
      primary_zone_id: row.primary_zone_id || undefined,
      is_high_risk_worker: !!row.is_high_risk_worker,
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        birth_date: v.birth_date ? v.birth_date.format('YYYY-MM-DD') : null,
        hire_date:  v.hire_date  ? v.hire_date.format('YYYY-MM-DD')  : null,
      }
      editing ? await api.updateEmployee(editing, payload) : await api.createEmployee(payload)
      setModal(false); load(page.current, page.pageSize); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }

  const cols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Овог', dataIndex: 'last_name', width: 120 },
    { title: 'Нэр', dataIndex: 'first_name', width: 120 },
    { title: 'Хэлтэс', dataIndex: 'department_name', width: 150, render: v => v || '—' },
    { title: 'Албан тушаал', dataIndex: 'position', render: v => v || '—' },
    { title: 'Утас', dataIndex: 'phone', width: 130 },
    { title: 'Ажилд орсон', dataIndex: 'hire_date', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag> },
    { title: '', width: 130, render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        <Button size="small" icon={<QrcodeOutlined />} onClick={() => setQrFor(r)} />
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Ажилтнууд</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Нэмэх</Button>
      </div>
      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Хайх..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={() => load(1, page.pageSize)}
              allowClear enterButton />
          </Col>
          <Col xs={24} sm={6}>
            <Select value={statusF} onChange={setStatusF} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ ...page, onChange: (p, s) => load(p, s) }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Ажилтан засах' : 'Ажилтан нэмэх'} confirmLoading={saving} width={720}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="emp_code" label="Ажилтны код" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="last_name" label="Овог" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="first_name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="position" label="Албан тушаал"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Утас"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Имэйл"><Input type="email" /></Form.Item></Col>
            <Col span={12}><Form.Item name="register_number" label="Регистр"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="birth_date" label="Төрсөн огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="hire_date" label="Ажилд орсон" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="base_salary" label="Үндсэн цалин"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="department_id" label="Хэлтэс">
                <Select allowClear placeholder="-- Сонгох --"
                  options={depts.map(d => ({ value: d.id, label: d.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Хүйс">
                <Select allowClear placeholder="-- Сонгох --" options={[
                  { value: 'male',   label: 'Эрэгтэй' },
                  { value: 'female', label: 'Эмэгтэй' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Төлөв">
                <Select options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, marginBottom: 8, paddingTop: 8, color: '#8c8c8c', fontSize: 12, fontWeight: 600 }}>
                🏦 Банкны мэдээлэл (цалин шилжүүлэхэд хэрэглэнэ)
              </div>
            </Col>
            <Col span={12}>
              <Form.Item name="bank_name" label="Банк">
                <Select allowClear placeholder="-- Сонгох --"
                  options={MN_BANKS.map(b => ({ value: b, label: b }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="bank_account" label="Дансны дугаар"><Input placeholder="1234567890" /></Form.Item></Col>

            <Col span={24}>
              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, marginBottom: 8, paddingTop: 8, color: '#8c8c8c', fontSize: 12, fontWeight: 600 }}>
                ⚠ ХАБЭА-ын ангилал (Хууль 3.1.22 / 28.4)
              </div>
            </Col>
            <Col span={12}>
              <Form.Item name="primary_zone_id" label="Үндсэн ажлын байр (аюултай бүс)">
                <Select allowClear placeholder="-- Сонгох --"
                  options={zones.map(z => ({
                    value: z.id,
                    label: `${z.name}${z.is_high_risk_workplace ? ' ⚠ (эрсдэлт)' : ''}`,
                  }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_high_risk_worker" valuePropName="checked" label=" ">
                <Checkbox>Эрсдэлт ажилтан (36 сарын цалингийн даатгал шаардлагатай)</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {qrFor && <EmployeeQrModal employee={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  )
}
