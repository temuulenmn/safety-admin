import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, Tabs, Popconfirm, Alert, Descriptions, message,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const ROLE_LABEL = {
  chair: 'Дарга', secretary: 'Нарийн бичгийн дарга',
  employer_rep: 'Ажил олгогчийн төлөөлөл', worker_rep: 'Ажилтны төлөөлөл', member: 'Гишүүн',
}
const ROLE_COLOR = { chair: 'red', secretary: 'blue', employer_rep: 'orange', worker_rep: 'cyan', member: 'default' }
const STATUS_COLOR = { scheduled: 'blue', held: 'success', cancelled: 'default' }
const STATUS_LABEL = { scheduled: 'Товлогдсон', held: 'Явагдсан', cancelled: 'Цуцлагдсан' }

export default function OshCommittee() {
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState([])
  const [meetings, setMeetings] = useState([])
  const [emps, setEmps] = useState([])
  const [loading, setLoading] = useState(true)

  const [mModal, setMModal] = useState(false)
  const [mForm]  = Form.useForm()
  const [mSaving,setMSaving]= useState(false)

  const [gModal, setGModal] = useState(false)
  const [gForm]  = Form.useForm()
  const [gEditing,setGEditing] = useState(null)
  const [gSaving, setGSaving] = useState(false)
  const [gDetail, setGDetail] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.getOshMembers(), api.getOshMeetings()])
      .then(([m, g]) => { setMembers(m.data || []); setMeetings(g.data || []) })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    load()
  }, [])

  // ── Members ────────────────────────────────────────
  const openAddMember = () => {
    mForm.resetFields()
    mForm.setFieldsValue({ role: 'member', joined_at: dayjs() })
    setMModal(true)
  }
  const saveMember = async () => {
    try {
      const v = await mForm.validateFields()
      setMSaving(true)
      await api.addOshMember({ ...v, joined_at: v.joined_at.format('YYYY-MM-DD') })
      setMModal(false); load(); message.success('Нэмэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setMSaving(false) }
  }
  const removeMember = async (id) => { await api.removeOshMember(id); load(); message.success('Устгагдлаа') }

  // ── Meetings ───────────────────────────────────────
  const openMeetingCreate = () => {
    setGEditing(null); gForm.resetFields()
    gForm.setFieldsValue({ meeting_date: dayjs(), status: 'held' })
    setGModal(true)
  }
  const openMeetingEdit = (g) => {
    setGEditing(g.id)
    gForm.setFieldsValue({
      meeting_date: dayjs(g.meeting_date),
      agenda: g.agenda || '', decisions: g.decisions || '',
      status: g.status, minutes_url: g.minutes_url || '', notes: g.notes || '',
    })
    setGModal(true)
  }
  const saveMeeting = async () => {
    try {
      const v = await gForm.validateFields()
      setGSaving(true)
      const payload = { ...v, meeting_date: v.meeting_date.format('YYYY-MM-DD') }
      gEditing ? await api.updateOshMeeting(gEditing, payload) : await api.createOshMeeting(payload)
      setGModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setGSaving(false) }
  }
  const removeMeeting = async (id) => { await api.removeOshMeeting(id); load(); message.success('Устгагдлаа') }

  const memberCols = [
    { title: 'Үүрэг', dataIndex: 'role', width: 200,
      render: v => <Tag color={ROLE_COLOR[v]}>{ROLE_LABEL[v] || v}</Tag> },
    { title: 'Ажилтан', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.emp_code} {r.full_name}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.position || '—'} · {r.department_name || '—'}</div>
      </>
    ) },
    { title: 'Орсон', dataIndex: 'joined_at', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: '', width: 80, render: (_, r) => (
      <Popconfirm title="Хасах уу?" onConfirm={() => removeMember(r.id)} okText="Тийм" cancelText="Үгүй">
        <Button size="small" danger>×</Button>
      </Popconfirm>
    ) },
  ]

  const meetingCols = [
    { title: '№', dataIndex: 'meeting_number', width: 130, render: v => <code>{v}</code> },
    { title: 'Огноо', dataIndex: 'meeting_date', width: 120,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Хэлэлцсэн асуудал', dataIndex: 'agenda',
      render: v => v ? v.slice(0, 100) + (v.length > 100 ? '...' : '') : '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: 'Протокол', dataIndex: 'minutes_url', width: 90,
      render: v => v ? <a href={v} target="_blank" rel="noopener">📄</a> : '—' },
    { title: '', width: 150, render: (_, g) => (
      <Space size="small">
        <Button size="small" onClick={() => setGDetail(g)}>Үзэх</Button>
        <Button size="small" onClick={() => openMeetingEdit(g)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => removeMeeting(g.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const tabItems = [
    { key: 'members', label: `Гишүүд (${members.length})`, children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddMember}>Гишүүн нэмэх</Button>
        </div>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={memberCols} dataSource={members}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            locale={{ emptyText: 'Гишүүн алга' }} />
        </Card>
      </>
    ) },
    { key: 'meetings', label: `Хурлууд (${meetings.length})`, children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openMeetingCreate}>Хурал бүртгэх</Button>
        </div>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={meetingCols} dataSource={meetings}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Хурал алга' }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Аюулгүй ажиллагааны зөвлөл</h4>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 15-16 дугаар зүйл"
        description="Аж ахуйн нэгж бүр аюулгүйн бүтэц, зөвлөл ажиллуулна. Гурван талт зөвшлийн зарчмаар (ажил олгогч, ажилтан, төр) хамтарсан бүтэц." />

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={mModal} onOk={saveMember} onCancel={() => setMModal(false)}
        title="Гишүүн нэмэх" confirmLoading={mSaving}
        okText="Нэмэх" cancelText="Болих" destroyOnClose>
        <Form form={mForm} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
          <Form.Item name="role" label="Үүрэг">
            <Select options={Object.entries(ROLE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Form.Item>
          <Form.Item name="joined_at" label="Орсон огноо"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={gModal} onOk={saveMeeting} onCancel={() => setGModal(false)}
        title={gEditing ? 'Хурал засах' : 'Хурал бүртгэх'} confirmLoading={gSaving}
        okText="Хадгалах" cancelText="Болих" width={720} destroyOnClose>
        <Form form={gForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="meeting_date" label="Огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="status" label="Төлөв">
                <Select options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="agenda" label="Хэлэлцсэн асуудал"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={24}><Form.Item name="decisions" label="Гарсан шийдвэр"><Input.TextArea rows={3} /></Form.Item></Col>
            <Col span={24}><Form.Item name="minutes_url" label="Протоколын холбоос"><Input placeholder="https://..." /></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={!!gDetail} onCancel={() => setGDetail(null)}
        title={gDetail?.meeting_number} width={720}
        footer={<Button onClick={() => setGDetail(null)}>Хаах</Button>}>
        {gDetail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Огноо">{dayjs(gDetail.meeting_date).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="Төлөв"><Tag color={STATUS_COLOR[gDetail.status]}>{STATUS_LABEL[gDetail.status]}</Tag></Descriptions.Item>
            {gDetail.agenda && <Descriptions.Item label="Асуудал"><div style={{ whiteSpace: 'pre-wrap' }}>{gDetail.agenda}</div></Descriptions.Item>}
            {gDetail.decisions && <Descriptions.Item label="Шийдвэр"><div style={{ whiteSpace: 'pre-wrap' }}>{gDetail.decisions}</div></Descriptions.Item>}
            {gDetail.minutes_url && <Descriptions.Item label="Протокол"><a href={gDetail.minutes_url} target="_blank" rel="noopener">Файл нээх</a></Descriptions.Item>}
            {gDetail.notes && <Descriptions.Item label="Тэмдэглэл">{gDetail.notes}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
