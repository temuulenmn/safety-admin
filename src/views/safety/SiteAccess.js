import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Checkbox,
  Space, Popconfirm, Alert, message,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { useCrud } from 'src/hooks/useCrud'

export default function SiteAccess() {
  const [trainings, setTrainings]= useState([])
  const [emps,      setEmps]     = useState([])

  const [checkEmp,  setCheckEmp] = useState()
  const [checkZone, setCheckZone]= useState()
  const [checkResult, setCheckResult] = useState(null)
  const [checking,  setChecking] = useState(false)

  const crud = useCrud({
    list:   () => api.getSiteAccess(),
    create: (d) => api.createSiteAccess(d),
    update: (id, d) => api.updateSiteAccess(id, d),
    remove: (id) => api.deleteSiteAccess(id),
    defaults: { requires_rfid: true, required_training_ids: [] },
    toForm: (r) => ({
      zone_name: r.zone_name, description: r.description || '',
      requires_rfid: r.requires_rfid,
      required_training_ids: r.required_training_ids || [],
    }),
  })
  const rules = crud.rows

  useEffect(() => {
    Promise.all([
      api.getTrainings(),
      api.getEmployees({ status: 'active', limit: 500 }),
    ]).then(([t, e]) => { setTrainings(t.data || []); setEmps(e.data || []) })
      .catch(() => {})
  }, [])

  const checkAccess = async () => {
    if (!checkEmp || !checkZone) return
    setChecking(true); setCheckResult(null)
    try {
      const r = await api.checkAccess({ employee_id: checkEmp, zone_name: checkZone })
      setCheckResult(r.data)
    } catch (e) {
      setCheckResult({ allowed: false, reason: e?.response?.data?.message || 'Алдаа гарлаа' })
    } finally { setChecking(false) }
  }

  const zoneOptions = [...new Set(rules.map(r => r.zone_name))]

  const cols = [
    { title: 'Бүсийн нэр', dataIndex: 'zone_name',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'RFID', dataIndex: 'requires_rfid', width: 130,
      render: v => <Tag color={v ? 'red' : 'default'}>{v ? 'Шаардлагатай' : 'Шаардлагагүй'}</Tag> },
    { title: 'Шаардлагатай сургалт', dataIndex: 'required_trainings',
      render: (v) => (v || []).length
        ? v.map(t => <Tag key={t.id} color="blue">{t.name}</Tag>)
        : <span style={{ color: '#8c8c8c' }}>—</span> },
    { title: 'Тайлбар', dataIndex: 'description', render: v => v || '—' },
    { title: '', width: 120, render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => crud.openEdit(r)} />
        <Popconfirm title="Дүрэм устгах уу?" onConfirm={() => crud.destroy(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Талбайн нэвтрэх дүрэм</h4>
      <Row gutter={[16, 16]}>
        <Col lg={16} xs={24}>
          <Card
            title="Бүсийн дүрмүүд"
            extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => crud.openCreate()}>Дүрэм нэмэх</Button>}
          >
            <Table {...crud.tableProps} size="middle" columns={cols}
              locale={{ emptyText: 'Дүрэм алга' }} />
          </Card>
        </Col>
        <Col lg={8} xs={24}>
          <Card title={<><SafetyOutlined /> Нэвтрэх эрх шалгах</>}>
            <Form layout="vertical">
              <Form.Item label="Ажилтан">
                <Select value={checkEmp} onChange={(v) => { setCheckEmp(v); setCheckResult(null) }}
                  showSearch optionFilterProp="label" allowClear placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
              <Form.Item label="Бүс">
                <Select value={checkZone} onChange={(v) => { setCheckZone(v); setCheckResult(null) }}
                  allowClear placeholder="-- Сонгох --"
                  options={zoneOptions.map(z => ({ value: z, label: z }))} />
              </Form.Item>
              <Button type="primary" block onClick={checkAccess}
                loading={checking} disabled={!checkEmp || !checkZone}>Шалгах</Button>
            </Form>
            {checkResult && (
              <Alert style={{ marginTop: 12 }}
                type={checkResult.allowed ? 'success' : 'error'} showIcon
                message={checkResult.allowed ? '✓ Нэвтрэх эрхтэй' : '✗ Нэвтрэх эрхгүй'}
                description={<>
                  {checkResult.reason && <div>{checkResult.reason}</div>}
                  {checkResult.missing_trainings?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>Дутуу сургалтууд:</div>
                      {checkResult.missing_trainings.map((t, i) => (
                        <Tag key={i} color="warning" style={{ marginTop: 4 }}>{t}</Tag>
                      ))}
                    </div>
                  )}
                </>} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={crud.editing ? 'Дүрэм засах' : 'Дүрэм нэмэх'}
        {...crud.modalProps} width={720}
      >
        <Form {...crud.formProps} requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="zone_name" label="Бүсийн нэр" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requires_rfid" label="RFID шаардлага">
                <Select options={[
                  { value: true, label: 'Шаардлагатай' },
                  { value: false, label: 'Шаардлагагүй' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Тайлбар"><Input /></Form.Item>
          <Form.Item name="required_training_ids" label="Шаардлагатай сургалтууд">
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', maxHeight: 200, overflowY: 'auto' }}>
              {trainings.length === 0
                ? <span style={{ color: '#8c8c8c', fontSize: 12 }}>Сургалт байхгүй</span>
                : trainings.map(t => (
                  <Checkbox key={t.id} value={t.id}>{t.name}{t.is_mandatory ? ' ⚠' : ''}</Checkbox>))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
