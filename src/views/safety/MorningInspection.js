import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Statistic, Progress, Table, Tag, Button, Modal, Form,
  Select, Input, Checkbox, Space, Alert, Spin, message,
} from 'antd'
import { PlusOutlined, SafetyOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const PPE_CHECK = [
  { key: 'helmet',  label: 'Каска' },
  { key: 'vest',    label: 'Хантааз' },
  { key: 'gloves',  label: 'Бээлий' },
  { key: 'boots',   label: 'Гутал' },
  { key: 'glasses', label: 'Нүдний шил' },
]

export default function MorningInspection() {
  const [summary,   setSummary]   = useState(null)
  const [notChecked,setNotChecked]= useState([])
  const [emps,      setEmps]      = useState([])
  const [today,     setToday]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [preselect, setPreselect] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getMorningToday(),
      api.getMorningInspections({ date: dayjs().format('YYYY-MM-DD'), limit: 500 }),
    ]).then(([t, l]) => {
      setSummary(t.data?.summary); setNotChecked(t.data?.not_checked || [])
      setToday(l.data || [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    load()
  }, [])

  const pct = summary?.total_active > 0
    ? Math.round(summary.checked / summary.total_active * 100) : 0

  const todayCols = [
    { title: 'Ажилтан', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.emp_code} {r.full_name}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{dayjs(r.inspected_at).format('HH:mm')}</div>
      </>
    ) },
    { title: 'Шалгасан', dataIndex: 'inspector_name', width: 130, render: v => v || '—' },
    { title: 'ХХХ', width: 150,
      render: (_, r) => PPE_CHECK.map(p => (
        <span key={p.key} title={p.label} style={{ marginRight: 4 }}>
          {r.ppe_items?.[p.key] ? '✅' : '❌'}
        </span>
      )) },
    { title: 'Үр дүн', dataIndex: 'passed', width: 110,
      render: v => <Tag color={v ? 'success' : 'error'}>{v ? 'Тэнцсэн' : 'Тэнцээгүй'}</Tag> },
    { title: 'RFID', dataIndex: 'rfid_registered', width: 70,
      render: v => v ? <Tag color="cyan">✓</Tag> : '—' },
  ]

  const notCheckedCols = [
    { render: (_, e) => (
      <>
        <div style={{ fontWeight: 600 }}>{e.emp_code} {e.full_name}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{e.department || '—'}</div>
      </>
    ) },
    { width: 90, align: 'right', render: (_, e) => (
      <Button size="small" type="primary" ghost onClick={() => { setPreselect(e); setModal(true) }}>Шалгах</Button>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Өглөөний шалгалт</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setPreselect(null); setModal(true) }}>
          Шалгалт бүртгэх
        </Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Өглөө бүр ажилтан нэг нэгнийхээ хувийн хамгаалах хэрэгслийг шалгаад, талбайд гарахдаа RFID уншуулж бүртгүүлнэ." />

      {summary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Шалгагдсан" value={`${summary.checked} / ${summary.total_active}`}
                valueStyle={{ fontWeight: 700 }} />
              <Progress percent={pct} size="small" showInfo={false} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Тэнцсэн" value={summary.passed}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Тэнцээгүй" value={summary.failed}
                valueStyle={{ color: '#cf1322', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="RFID бүртгэсэн" value={summary.registered}
                valueStyle={{ color: '#1890ff', fontWeight: 700 }} />
            </Card>
          </Col>
        </Row>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> : (
        <Row gutter={[16, 16]}>
          <Col lg={14} xs={24}>
            <Card title={<><SafetyOutlined /> Өнөөдөр шалгагдсан ({today.length})</>}>
              <Table rowKey="id" size="small" columns={todayCols} dataSource={today}
                pagination={{ pageSize: 15, hideOnSinglePage: true }}
                locale={{ emptyText: 'Шалгалт алга' }} scroll={{ y: 400 }} />
            </Card>
          </Col>
          <Col lg={10} xs={24}>
            <Card title={<span style={{ color: '#faad14' }}>⚠ Шалгагдаагүй ({notChecked.length})</span>}>
              {notChecked.length === 0
                ? <div style={{ textAlign: 'center', padding: 30, color: '#52c41a' }}>Бүгд шалгагдсан ✓</div>
                : <Table rowKey="id" size="small" columns={notCheckedCols} dataSource={notChecked}
                    pagination={{ pageSize: 15, hideOnSinglePage: true }} scroll={{ y: 400 }} showHeader={false} />
              }
            </Card>
          </Col>
        </Row>
      )}

      {modal && <CheckModal emps={emps} preselect={preselect}
        onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />}
    </div>
  )
}

function CheckModal({ emps, preselect, onClose, onSaved }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [ppe, setPpe] = useState(['helmet','vest','gloves','boots','glasses'])

  useEffect(() => {
    form.setFieldsValue({ employee_id: preselect?.id || undefined, rfid: true })
  }, [preselect, form])

  const allPass = PPE_CHECK.every(p => ppe.includes(p.key))

  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const ppe_items = PPE_CHECK.reduce((a, p) => ({ ...a, [p.key]: ppe.includes(p.key) }), {})
      await api.createMorningInspection({
        employee_id: v.employee_id, inspector_id: v.inspector_id || null,
        zone: v.zone || null, ppe_items, passed: allPass,
        rfid_registered: !!v.rfid, notes: v.notes || null,
      })
      message.success('Бүртгэгдлээ'); onSaved()
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }

  return (
    <Modal open onCancel={onClose} onOk={save} confirmLoading={saving}
      title="Өглөөний шалгалт бүртгэх" okText="Бүртгэх" cancelText="Болих"
      width={640} destroyOnClose>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="employee_id" label="Шалгуулж буй ажилтан" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
            options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="inspector_id" label="Шалгасан хүн">
              <Select showSearch optionFilterProp="label" allowClear placeholder="-- Сонгох --"
                options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="zone" label="Талбай / бүс"><Input /></Form.Item>
          </Col>
        </Row>
        <Form.Item label="Хувийн хамгаалах хэрэгсэл">
          <Checkbox.Group value={ppe} onChange={setPpe}>
            <Space wrap>{PPE_CHECK.map(p => <Checkbox key={p.key} value={p.key}>{p.label}</Checkbox>)}</Space>
          </Checkbox.Group>
          <div style={{ marginTop: 8 }}>
            <Tag color={allPass ? 'success' : 'error'}>
              {allPass ? 'Бүрэн — Тэнцэнэ' : 'Дутуу — Тэнцэхгүй'}
            </Tag>
          </div>
        </Form.Item>
        <Form.Item name="rfid" valuePropName="checked">
          <Checkbox>RFID уншуулж талбайд гарахыг бүртгэв</Checkbox>
        </Form.Item>
        <Form.Item name="notes" label="Тэмдэглэл"><Input /></Form.Item>
      </Form>
    </Modal>
  )
}
