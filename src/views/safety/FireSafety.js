import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Space, Statistic, Alert, Popconfirm, Tabs, Checkbox, message,
} from 'antd'
import DatePicker from 'src/components/DatePicker'
import { PlusOutlined, FireOutlined, WarningOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const TYPE_LABEL = {
  extinguisher:   'Гал унтраагуур',
  sprinkler:      'Автомат усалгаа',
  alarm:          'Дохиолол',
  hose:           'Түрлэг',
  exit_sign:      'Гарцын тэмдэг',
  evacuation_map: 'Гарцын зураглал',
  fire_door:      'Галын хаалга',
  smoke_detector: 'Утаа мэдрэгч',
}

export default function FireSafety() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tab,    setTab]    = useState('equipment')
  const [rows,   setRows]   = useState([])
  const [inspections, setInspections] = useState([])
  const [stats,  setStats]  = useState(null)
  const [loading,setLoading]= useState(true)
  const [typeF,  setTypeF]  = useState()
  const [needsInsp, setNeedsInsp] = useState(false)

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)

  const [insModal, setInsModal] = useState(false)
  const [insForm]  = Form.useForm()
  const [insSaving,setInsSaving]= useState(false)
  const [inspFor,  setInspFor]  = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.getFireEquipment({
        equipment_type: typeF,
        needs_inspection: needsInsp ? 'true' : undefined,
        project_id: currentProjectId,
      }),
      api.getFireStats(),
      api.getFireInspections(),
    ]).then(([r, s, i]) => {
      setRows(r.data || []); setStats(s.data); setInspections(i.data || [])
    }).finally(() => setLoading(false))
  }, [typeF, needsInsp, currentProjectId])
  useEffect(load, [load])

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ equipment_type: 'extinguisher', is_operational: true })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      equipment_type: r.equipment_type, code: r.code || '', location: r.location,
      extinguisher_class: r.extinguisher_class || '', capacity: r.capacity || '',
      installed_at: r.installed_at ? dayjs(r.installed_at) : null,
      next_inspection_at: r.next_inspection_at ? dayjs(r.next_inspection_at) : null,
      expiry_date: r.expiry_date ? dayjs(r.expiry_date) : null,
      is_operational: r.is_operational, notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        installed_at: v.installed_at ? v.installed_at.format('YYYY-MM-DD') : null,
        next_inspection_at: v.next_inspection_at ? v.next_inspection_at.format('YYYY-MM-DD') : null,
        expiry_date: v.expiry_date ? v.expiry_date.format('YYYY-MM-DD') : null,
      }
      editing ? await api.updateFireEquipment(editing, payload) : await api.createFireEquipment(payload)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteFireEquipment(id); load(); message.success('Устгагдлаа') }

  const openInspection = (eq) => {
    setInspFor(eq); insForm.resetFields()
    insForm.setFieldsValue({ inspected_at: dayjs(), passed: true, next_due_date: dayjs().add(1, 'year') })
    setInsModal(true)
  }
  const saveInspection = async () => {
    try {
      const v = await insForm.validateFields()
      setInsSaving(true)
      await api.createFireInspection({
        ...v, equipment_id: inspFor.id,
        inspected_at: v.inspected_at.format('YYYY-MM-DD'),
        next_due_date: v.next_due_date ? v.next_due_date.format('YYYY-MM-DD') : null,
      })
      setInsModal(false); load(); message.success('Шалгалт бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setInsSaving(false) }
  }

  const eqCols = [
    { title: 'Төрөл', dataIndex: 'equipment_type', width: 160,
      render: v => <Tag color="orange">{TYPE_LABEL[v] || v}</Tag> },
    { title: 'Код', dataIndex: 'code', width: 100, render: v => v ? <code>{v}</code> : '—' },
    { title: 'Байршил', dataIndex: 'location' },
    { title: 'Ангилал', dataIndex: 'extinguisher_class', width: 90, render: v => v || '—' },
    { title: 'Багтаамж', dataIndex: 'capacity', width: 100, render: v => v || '—' },
    { title: 'Дараагийн шалгалт', dataIndex: 'next_inspection_at', width: 140,
      render: v => {
        if (!v) return <Tag color="magenta">Шалгаагүй</Tag>
        const d = dayjs(v); const days = d.diff(dayjs(), 'day')
        return <span style={{ color: days < 0 ? '#cf1322' : days < 30 ? '#faad14' : undefined }}>
          {d.format('YYYY-MM-DD')}
        </span>
      } },
    { title: 'Дуусах', dataIndex: 'expiry_date', width: 110,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Ажиллагаа', dataIndex: 'is_operational', width: 100,
      render: v => <Tag color={v ? 'success' : 'error'}>{v ? 'Идэвхтэй' : 'Ажиллахгүй'}</Tag> },
    { title: '', width: 190, render: (_, r) => (
      <Space size="small">
        <Button size="small" type="primary" ghost onClick={() => openInspection(r)}>Шалгалт</Button>
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  const insCols = [
    { title: 'Огноо', dataIndex: 'inspected_at', width: 120,
      render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: 'Тоног төхөөрөмж', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.equipment_code} — {TYPE_LABEL[r.equipment_type]}</div>
        <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.equipment_location}</div>
      </>
    ) },
    { title: 'Байцаагч', dataIndex: 'inspector_name', width: 140, render: v => v || '—' },
    { title: 'Үр дүн', dataIndex: 'passed', width: 100,
      render: v => <Tag color={v ? 'success' : 'error'}>{v ? 'Тэнцсэн' : 'Тэнцээгүй'}</Tag> },
    { title: 'Тэмдэглэсэн', dataIndex: 'findings', render: v => v || '—' },
    { title: 'Дараагийн', dataIndex: 'next_due_date', width: 120,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
  ]

  const tabItems = [
    { key: 'equipment', label: `Тоног төхөөрөмж (${rows.length})`, children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Row gutter={8}>
            <Col xs={12} sm={6}>
              <Select value={typeF} onChange={setTypeF} allowClear
                placeholder="Бүх төрөл" style={{ width: '100%' }}
                options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
            </Col>
            <Col xs={12} sm={6}>
              <Checkbox checked={needsInsp} onChange={e => setNeedsInsp(e.target.checked)}>
                Шалгалт хугацаа хэтэрсэн
              </Checkbox>
            </Col>
          </Row>
        </Card>
        <Card>
          <Table rowKey="id" size="middle" loading={loading}
            columns={eqCols} dataSource={rows}
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Тоног төхөөрөмж алга' }} />
        </Card>
      </>
    ) },
    { key: 'inspections', label: `Шалгалтын түүх (${inspections.length})`, children: (
      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={insCols} dataSource={inspections}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Шалгалт алга' }} />
      </Card>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}><FireOutlined style={{ color: '#faad14' }} /> Галын аюулгүй байдал</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Тоног төхөөрөмж нэмэх</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 13.3 дугаар зүйл"
        description="Галын дохиолол, гал унтраах тусгай тоноглол, гарц/орцын зураглалыг гал гарч болзошгүй ажлын байр бүрт байрлуулан ажиллуулах." />

      {stats?.overdue_inspection > 0 && (
        <Alert type="error" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message={`⚠ ${stats.overdue_inspection} тоног төхөөрөмжийн шалгалтын хугацаа хэтэрсэн`} />
      )}

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Нийт" value={stats.total_equipment ?? 0} valueStyle={{ fontWeight: 700 }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Идэвхтэй" value={stats.operational ?? 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Ажиллахгүй" value={stats.out_of_service ?? 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Шалгалт хэтэрсэн" value={stats.overdue_inspection ?? 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="30 хоногт дуусах" value={stats.due_soon ?? 0} valueStyle={{ color: '#faad14' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Дуусгавар" value={stats.expired ?? 0} valueStyle={{ color: '#eb2f96' }} /></Card></Col>
        </Row>
      )}

      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? 'Тоног төхөөрөмж засах' : 'Тоног төхөөрөмж нэмэх'} confirmLoading={saving}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="equipment_type" label="Төрөл" rules={[{ required: true }]}>
                <Select options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="code" label="Код"><Input placeholder="EXT-001" /></Form.Item></Col>
            <Col span={24}><Form.Item name="location" label="Байршил" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="extinguisher_class" label="Ангилал"><Input placeholder="ABC, CO2..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="capacity" label="Багтаамж"><Input placeholder="6 kg" /></Form.Item></Col>
            <Col span={8}><Form.Item name="installed_at" label="Суулгасан"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="next_inspection_at" label="Дараагийн шалгалт"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="expiry_date" label="Дуусах огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}>
              <Form.Item name="is_operational" valuePropName="checked">
                <Checkbox>Идэвхтэй ажиллаж байна</Checkbox>
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={insModal} onOk={saveInspection} onCancel={() => setInsModal(false)}
        title={inspFor ? `Шалгалт: ${inspFor.code || TYPE_LABEL[inspFor.equipment_type]} — ${inspFor.location}` : ''}
        confirmLoading={insSaving}
        okText="Бүртгэх" cancelText="Болих" destroyOnClose>
        <Form form={insForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="inspected_at" label="Огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="inspector_name" label="Байцаагч"><Input /></Form.Item></Col>
            <Col span={24}>
              <Form.Item name="passed" valuePropName="checked">
                <Checkbox>Шалгалтад тэнцсэн</Checkbox>
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="findings" label="Илэрсэн зөрчил"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={24}><Form.Item name="action_taken" label="Авсан арга хэмжээ"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="next_due_date" label="Дараагийн шалгалт"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
