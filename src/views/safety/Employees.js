import React, { useState, useCallback, useEffect } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Checkbox, message, Alert,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, EditOutlined, QrcodeOutlined, LockOutlined, UserDeleteOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
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
  const [pinFor,  setPinFor]  = useState(null)   // гар утасны PIN тавих ажилтан
  const [pinForm] = Form.useForm()
  const [pinSaving, setPinSaving] = useState(false)
  const [termFor, setTermFor] = useState(null)   // чөлөөлөх ажилтан
  const [termForm] = Form.useForm()
  const [termSaving, setTermSaving] = useState(false)

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
        setPage(pageInfo(r, p, l))
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
    { title: '', width: 190, render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} title="Засах" />
        <Button size="small" icon={<QrcodeOutlined />} onClick={() => setQrFor(r)} title="QR код" />
        <Button size="small" icon={<LockOutlined />} title="Гар утасны PIN"
                onClick={() => { setPinFor(r); pinForm.resetFields() }} />
        {r.status !== 'terminated' && (
          <Button size="small" danger icon={<UserDeleteOutlined />} title="Ажлаас чөлөөлөх"
                  onClick={() => { setTermFor(r); termForm.setFieldsValue({ termination_date: dayjs() }) }} />
        )}
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

      {/* Гар утасны аппликейшны PIN. Ажилтан emp_code + PIN-ээр нэвтэрнэ. */}
      <Modal
        open={!!pinFor}
        title={`Гар утасны PIN — ${pinFor?.emp_code || ''} ${pinFor?.first_name || ''}`}
        okText="Хадгалах" cancelText="Болих" confirmLoading={pinSaving}
        onCancel={() => setPinFor(null)}
        onOk={async () => {
          try {
            const v = await pinForm.validateFields()
            setPinSaving(true)
            await api.setEmployeePin(pinFor.id, { pin: v.pin })
            message.success(`${pinFor.emp_code} PIN тавигдлаа — ажилтан аппликейшнд нэвтэрч болно`)
            setPinFor(null)
          } catch (e) {
            if (e?.errorFields) return
            message.error(e?.response?.data?.message || 'PIN хадгалагдсангүй')
          } finally { setPinSaving(false) }
        }}>
        <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
          Ажилтан «Барилга» аппликейшнд <b>{pinFor?.emp_code}</b> код болон энэ PIN-ээр нэвтэрнэ.
          PIN нь шифрлэгдэж хадгалагдана — дараа нь харах боломжгүй тул ажилтанд шууд дамжуулна уу.
        </p>
        <Form form={pinForm} layout="vertical">
          <Form.Item name="pin" label="4–6 оронтой PIN"
            rules={[
              { required: true, message: 'PIN оруулна уу' },
              { pattern: /^\d{4,6}$/, message: 'Зөвхөн 4–6 орон тоо' },
            ]}>
            <Input.Password maxLength={6} placeholder="жишээ: 4821" autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="confirm" label="Давтан оруулах" dependencies={['pin']}
            rules={[
              { required: true, message: 'Давтан оруулна уу' },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || getFieldValue('pin') === v ? Promise.resolve() : Promise.reject(new Error('PIN таарахгүй байна')),
              }),
            ]}>
            <Input.Password maxLength={6} autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Ажлаас чөлөөлөх. Бичлэг устгагдахгүй — статус `terminated` болж,
          ирц/зөрчил/сургалтын түүх хуулийн шаардлагын дагуу үлдэнэ. */}
      <Modal
        open={!!termFor}
        title={`Ажлаас чөлөөлөх — ${termFor?.emp_code || ''} ${termFor?.first_name || ''} ${termFor?.last_name || ''}`}
        okText="Чөлөөлөх" cancelText="Болих" okButtonProps={{ danger: true }}
        confirmLoading={termSaving}
        onCancel={() => setTermFor(null)}
        onOk={async () => {
          try {
            const v = await termForm.validateFields()
            setTermSaving(true)
            await api.terminateEmployee(termFor.id, {
              termination_date: v.termination_date.format('YYYY-MM-DD'),
            })
            message.success(`${termFor.emp_code} чөлөөлөгдлөө`)
            setTermFor(null); load(page.current, page.pageSize)
          } catch (e) {
            if (e?.errorFields) return
            message.error(e?.response?.data?.message || 'Чөлөөлөхөд алдаа гарлаа')
          } finally { setTermSaving(false) }
        }}>
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Ажилтны түүх хадгалагдана"
          description="Ирц, зөрчил, сургалт, эрүүл мэндийн үзлэгийн бүртгэл хуулийн шаардлагын дагуу үлдэнэ. Зөвхөн төлөв нь «Чөлөөлөгдсөн» болж, RFID карт болон хаалганы хандалт хаагдана." />
        <Form form={termForm} layout="vertical">
          <Form.Item name="termination_date" label="Чөлөөлөх огноо"
            rules={[{ required: true, message: 'Огноо сонгоно уу' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
