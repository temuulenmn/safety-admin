import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  InputNumber, Space, Statistic, Alert, Checkbox, Popconfirm, Descriptions, message,
  Divider, Empty, Spin, Typography,
} from 'antd'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
import dayjs from 'dayjs'

const SEVERITY_COLOR = { minor: 'blue', moderate: 'orange', severe: 'red', fatal: 'magenta' }
const SEVERITY_LABEL = { minor: 'Хөнгөн', moderate: 'Дунд', severe: 'Хүнд', fatal: 'Нас барсан' }
const STATUS_COLOR = { reported: 'orange', investigating: 'blue', closed: 'success', archived: 'default' }
const STATUS_LABEL = { reported: 'Бүртгэсэн', investigating: 'Судалж буй', closed: 'Хаагдсан', archived: 'Архивт' }

// Ослын үеийн хамгаалах хэрэгслийн нэршил
const PPE_LABEL = {
  helmet: 'Каска', vest: 'Хантааз', boots: 'Гутал',
  gloves: 'Бээлий', glasses: 'Нүдний шил', harness: 'Аюулгүйн бүс',
  mask: 'Амны хаалт', earplug: 'Чихэвч',
}
const PPE_ORDER = ['helmet', 'vest', 'boots', 'gloves', 'glasses']
const ppeName = t => PPE_LABEL[t] || t

export default function Accidents() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [rows,    setRows]    = useState([])
  const [emps,    setEmps]    = useState([])
  const [zones,   setZones]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [severity,setSeverity]= useState()
  const [status,  setStatus]  = useState()
  const [page,    setPage]    = useState({ current: 1, pageSize: 25, total: 0 })

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [detail,  setDetail]  = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    api.getDangerZones().then(r => setZones(r.data || []))
    api.getAccidentStats().then(r => setStats(r.data))
  }, [])

  const load = useCallback((p = 1, l = 25) => {
    setLoading(true)
    api.getAccidents({
      page: p, limit: l,
      severity: severity || undefined, status: status || undefined,
      project_id: currentProjectId || undefined,
    }).then(r => {
      setRows(r.data || [])
      setPage(pageInfo(r, p, l))
    }).finally(() => setLoading(false))
  }, [severity, status, currentProjectId])
  useEffect(() => { load(1, page.pageSize) /* eslint-disable-next-line */ }, [severity, status, currentProjectId])

  const openDetail = (r) => {
    setDetail(r)                       // шууд нээж, контекстийг ард нь нөхнө
    setDetailLoading(true)
    api.getAccident(r.id)
      .then(res => setDetail(d => (d && d.id === r.id ? { ...d, ...res.data } : d)))
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  const openCreate = () => {
    setEditing(null); form.resetFields()
    form.setFieldsValue({ occurred_at: dayjs(), severity: 'minor', hospitalized: false, days_lost: 0 })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({
      employee_id: r.employee_id,
      occurred_at: dayjs(r.occurred_at),
      location: r.location || '', zone_id: r.zone_id || undefined,
      severity: r.severity, accident_type: r.accident_type || '',
      description: r.description,
      root_cause: r.root_cause || '', immediate_action: r.immediate_action || '',
      preventive_action: r.preventive_action || '',
      hospitalized: r.hospitalized, hospital_name: r.hospital_name || '',
      days_lost: r.days_lost || 0,
      return_to_work_date: r.return_to_work_date ? dayjs(r.return_to_work_date) : null,
      reported_to_inspector: r.reported_to_inspector,
      inspector_report_number: r.inspector_report_number || '',
      inspector_report_date: r.inspector_report_date ? dayjs(r.inspector_report_date) : null,
      investigator_id: r.investigator_id || undefined,
      status: r.status, notes: r.notes || '',
    })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload = {
        ...v,
        occurred_at: v.occurred_at.toISOString(),
        return_to_work_date: v.return_to_work_date ? v.return_to_work_date.format('YYYY-MM-DD') : null,
        inspector_report_date: v.inspector_report_date ? v.inspector_report_date.format('YYYY-MM-DD') : null,
      }
      editing ? await api.updateAccident(editing, payload) : await api.createAccident(payload)
      setModal(false); load(page.current, page.pageSize)
      api.getAccidentStats().then(r => setStats(r.data))
      message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => {
    await api.deleteAccident(id); load(page.current, page.pageSize)
    api.getAccidentStats().then(r => setStats(r.data))
    message.success('Устгагдлаа')
  }

  const cols = [
    { title: '№', dataIndex: 'accident_number', width: 130, render: v => <code>{v}</code> },
    { title: 'Огноо', dataIndex: 'occurred_at', width: 140,
      render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: 'Ажилтан', render: (_, r) => (
      <>
        <div style={{ fontWeight: 600 }}>{r.emp_code} {r.full_name}</div>
        {r.zone_name && <div style={{ color: '#8c8c8c', fontSize: 11 }}>{r.zone_name}</div>}
      </>
    ) },
    { title: 'Хүндрэл', dataIndex: 'severity', width: 100,
      render: v => <Tag color={SEVERITY_COLOR[v]}>{SEVERITY_LABEL[v]}</Tag> },
    { title: 'Төрөл', dataIndex: 'accident_type', width: 120, render: v => v || '—' },
    { title: 'Ажлаас чөл. хоног', dataIndex: 'days_lost', align: 'right', width: 90 },
    { title: 'Байцаагч', dataIndex: 'reported_to_inspector', width: 100,
      render: (v, r) => v
        ? <Tag color="success">✓</Tag>
        : (r.severity === 'severe' || r.severity === 'fatal'
          ? <Tag color="red">Мэдэгдээгүй!</Tag>
          : <Tag>—</Tag>) },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: '', width: 130, render: (_, r) => (
      <Space size="small">
        <Button size="small" onClick={() => openDetail(r)}>Үзэх</Button>
        <Button size="small" onClick={() => openEdit(r)}>Засах</Button>
        <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger>×</Button>
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Үйлдвэрлэлийн осол</h4>
        <Button type="primary" danger icon={<PlusOutlined />} onClick={openCreate}>Осол бүртгэх</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="ХАБЭА тухай хууль 24-25 дугаар зүйл"
        description="Хүнд болон нас барсан осол гарсан тохиолдолд 24 цагийн дотор эмнэлэгт хүргэж, судлан бүртгэж, Хөдөлмөрийн хяналтын улсын байцаагчид мэдэгдэнэ." />

      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="30 хоног: Нийт" value={stats.total ?? 0} valueStyle={{ fontWeight: 700 }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Хөнгөн" value={stats.minor ?? 0} valueStyle={{ color: '#1890ff' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Дунд" value={stats.moderate ?? 0} valueStyle={{ color: '#faad14' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Хүнд" value={stats.severe ?? 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Нас барсан" value={stats.fatal ?? 0} valueStyle={{ color: '#eb2f96' }} /></Card></Col>
          <Col xs={12} sm={4}><Card size="small"><Statistic title="Ажлаас чөл. хоног" value={stats.total_days_lost ?? 0} /></Card></Col>
        </Row>
      )}

      {stats?.unreported_severe > 0 && (
        <Alert type="error" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message={`⚠ ${stats.unreported_severe} хүнд/нас барсан осол улсын байцаагчид мэдэгдээгүй байна`}
          description="Хууль зөрчиж байна. Бүртгэлийн мөрд орж inspector_report_number-ыг оруулна уу." />
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Select value={severity} onChange={setSeverity} allowClear
              placeholder="Бүх хүндрэл" style={{ width: '100%' }}
              options={Object.entries(SEVERITY_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Select value={status} onChange={setStatus} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
        </Row>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ ...page, onChange: (p, s) => load(p, s) }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title={editing ? `Осол засах — ${rows.find(r => r.id === editing)?.accident_number}` : 'Осол бүртгэх'}
        confirmLoading={saving} width={860}
        okText="Хадгалах" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="employee_id" label="Ослын хохирогч" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="occurred_at" label="Огноо, цаг" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="severity" label="Хүндрэл">
                <Select options={Object.entries(SEVERITY_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="accident_type" label="Төрөл"><Input placeholder="fall, cut, chemical..." /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="zone_id" label="Бүс">
                <Select allowClear placeholder="-- Сонгох --"
                  options={zones.map(z => ({ value: z.id, label: z.name }))} />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="location" label="Байршил"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Ослын тайлбар" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="root_cause" label="Гол шалтгаан"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="immediate_action" label="Яаралтай авсан арга хэмжээ"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={24}><Form.Item name="preventive_action" label="Урьдчилан сэргийлэх арга хэмжээ"><Input.TextArea rows={2} /></Form.Item></Col>

            <Col span={24}>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginBottom: 8, color: '#8c8c8c', fontWeight: 600 }}>
                🏥 Эмнэлэгт хүргэсэн эсэх
              </div>
            </Col>
            <Col span={8}>
              <Form.Item name="hospitalized" valuePropName="checked">
                <Checkbox>Эмнэлэгт хүргэсэн</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="hospital_name" label="Эмнэлгийн нэр"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="days_lost" label="Ажлаас чөл. хоног"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="return_to_work_date" label="Ажилдаа орсон огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="investigator_id" label="Судлаач">
                <Select allowClear showSearch optionFilterProp="label" placeholder="-- Сонгох --"
                  options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginBottom: 8, color: '#8c8c8c', fontWeight: 600 }}>
                🏛 Улсын байцаагчид мэдэгдсэн эсэх
              </div>
            </Col>
            <Col span={8}>
              <Form.Item name="reported_to_inspector" valuePropName="checked">
                <Checkbox>Байцаагчид мэдэгдсэн</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="inspector_report_number" label="Бүртгэлийн №"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="inspector_report_date" label="Мэдэгдсэн огноо"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>

            {editing && (
              <Col span={12}>
                <Form.Item name="status" label="Төлөв">
                  <Select options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
                </Form.Item>
              </Col>
            )}
            <Col span={editing ? 12 : 24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={!!detail} onCancel={() => setDetail(null)}
        title={detail?.accident_number} width={720}
        footer={<Button onClick={() => setDetail(null)}>Хаах</Button>}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Хохирогч" span={2}>{detail.emp_code} — {detail.full_name}</Descriptions.Item>
            <Descriptions.Item label="Огноо">{dayjs(detail.occurred_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Байршил">{detail.location || '—'}</Descriptions.Item>
            <Descriptions.Item label="Бүс">{detail.zone_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Төрөл">{detail.accident_type || '—'}</Descriptions.Item>
            <Descriptions.Item label="Хүндрэл"><Tag color={SEVERITY_COLOR[detail.severity]}>{SEVERITY_LABEL[detail.severity]}</Tag></Descriptions.Item>
            <Descriptions.Item label="Төлөв"><Tag color={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="Тайлбар" span={2}>{detail.description}</Descriptions.Item>
            {detail.root_cause && <Descriptions.Item label="Шалтгаан" span={2}>{detail.root_cause}</Descriptions.Item>}
            {detail.preventive_action && <Descriptions.Item label="Урьдчилан сэргийлэх" span={2}>{detail.preventive_action}</Descriptions.Item>}
            <Descriptions.Item label="Эмнэлэг">{detail.hospitalized ? (detail.hospital_name || 'Тийм') : 'Үгүй'}</Descriptions.Item>
            <Descriptions.Item label="Ажлаас чөл. хоног">{detail.days_lost}</Descriptions.Item>
            <Descriptions.Item label="Байцаагчид мэдэгдсэн" span={2}>
              {detail.reported_to_inspector
                ? <span style={{ color: '#52c41a' }}>✓ №{detail.inspector_report_number || '—'} ({detail.inspector_report_date ? dayjs(detail.inspector_report_date).format('YYYY-MM-DD') : '—'})</span>
                : <span style={{ color: '#cf1322' }}>✗ Мэдэгдээгүй</span>}
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* ── Ослын үеийн нөхцөл: тухайн өдрийн ХХХ ба авсан багаж ── */}
        {detail && (
          <Spin spinning={detailLoading}>
            <Divider orientation="left" style={{ marginTop: 24 }}>
              Ослын үеийн нөхцөл — {dayjs(detail.occurred_at).format('YYYY-MM-DD')}
            </Divider>

            {!detail.context && !detailLoading && (
              <Typography.Text type="secondary">Тухайн өдрийн RFID бүртгэл олдсонгүй.</Typography.Text>
            )}

            {detail.context && (
              <>
                {/* Ирц */}
                <Descriptions column={2} bordered size="small" style={{ marginBottom: 12 }}>
                  <Descriptions.Item label="Талбайд орсон">
                    {detail.context.attendance?.check_in
                      ? dayjs(detail.context.attendance.check_in).format('HH:mm')
                      : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Гарсан">
                    {detail.context.attendance?.check_out
                      ? dayjs(detail.context.attendance.check_out).format('HH:mm')
                      : '—'}
                  </Descriptions.Item>
                </Descriptions>

                {/* Хамгаалах хэрэгсэл — талбайд орох үеийн RFID илрүүлэлт */}
                <div style={{ marginBottom: 6, fontWeight: 500 }}>
                  Хамгаалах хэрэгсэл (RFID илрүүлэлт)
                  {detail.context.ppe_scan && (
                    <Typography.Text type="secondary" style={{ fontWeight: 400, marginLeft: 8 }}>
                      {dayjs(detail.context.ppe_scan.checked_at).format('HH:mm')}
                      {detail.context.ppe_scan.location_name ? ` · ${detail.context.ppe_scan.location_name}` : ''}
                    </Typography.Text>
                  )}
                </div>
                {detail.context.ppe_scan ? (
                  <div style={{ marginBottom: 16 }}>
                    <Space size={[6, 6]} wrap>
                      {(() => {
                        const det  = (detail.context.ppe_scan.items_detected || []).map(x => x.type || x)
                        const miss = detail.context.ppe_scan.missing_items || []
                        const all  = [...new Set([...PPE_ORDER, ...det, ...miss])]
                        return all.map(t => {
                          // улаан = заавал өмсөх боловч дутуу · шар = өмсөөгүй (заавал биш) · ногоон = өмссөн
                          const worn = det.includes(t)
                          const mandatoryGap = miss.includes(t)
                          return (
                            <Tag key={t} color={mandatoryGap ? 'red' : (worn ? 'success' : 'orange')}>
                              {worn ? '✓ ' : '✗ '}{ppeName(t)}
                              {!worn && !mandatoryGap ? ' (илрээгүй)' : ''}
                            </Tag>
                          )
                        })
                      })()}
                    </Space>
                    {(() => {
                      const det  = (detail.context.ppe_scan.items_detected || []).map(x => x.type || x)
                      const miss = detail.context.ppe_scan.missing_items || []
                      const notWorn = PPE_ORDER.filter(t => !det.includes(t))
                      if (!notWorn.length) return null
                      return (
                        <Alert type={miss.length ? 'error' : 'warning'} showIcon style={{ marginTop: 8 }}
                          message={`Ослын үед өмсөөгүй: ${notWorn.map(ppeName).join(', ')}`}
                          description={miss.length
                            ? `Үүнээс заавал өмсөх ёстой: ${miss.map(ppeName).join(', ')}`
                            : 'Заавал өмсөх жагсаалтад ороогүй ч ослын шалтгаантай холбоотой байж болзошгүй.'} />
                      )
                    })()}
                  </div>
                ) : (
                  <Empty style={{ marginBottom: 16 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Тухайн өдөр PPE скан бүртгэгдээгүй" />
                )}

                {/* Өглөөний шалгалт */}
                {detail.context.morning_inspection && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 6, fontWeight: 500 }}>
                      Өглөөний шалгалт
                      <Typography.Text type="secondary" style={{ fontWeight: 400, marginLeft: 8 }}>
                        {dayjs(detail.context.morning_inspection.inspected_at).format('HH:mm')}
                        {detail.context.morning_inspection.inspector_name ? ` · ${detail.context.morning_inspection.inspector_name}` : ''}
                      </Typography.Text>
                    </div>
                    <Space size={[6, 6]} wrap>
                      <Tag color={detail.context.morning_inspection.passed ? 'success' : 'red'}>
                        {detail.context.morning_inspection.passed ? '✓ Тэнцсэн' : '✗ Тэнцээгүй'}
                      </Tag>
                      {Object.entries(detail.context.morning_inspection.ppe_items || {}).map(([k, v]) => (
                        <Tag key={k} color={v ? 'success' : 'red'}>{v ? '✓ ' : '✗ '}{ppeName(k)}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* Ослын мөчид гар дээр байсан багаж */}
                <div style={{ marginBottom: 6, fontWeight: 500 }}>
                  Ослын мөчид авсан багаж ({(detail.context.tools_in_hand || []).length})
                </div>
                {(detail.context.tools_in_hand || []).length ? (
                  <Table
                    size="small" rowKey="id" pagination={false}
                    dataSource={detail.context.tools_in_hand}
                    columns={[
                      { title: 'Код', dataIndex: 'code', width: 100 },
                      { title: 'Нэр', dataIndex: 'name' },
                      { title: 'Ангилал', dataIndex: 'category', width: 100, render: v => v || '—' },
                      { title: 'RFID', dataIndex: 'rfid_tag', width: 210,
                        render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
                      { title: 'Авсан', dataIndex: 'checked_out_at', width: 70,
                        render: v => dayjs(v).format('HH:mm') },
                      { title: 'Буцаасан', dataIndex: 'returned_at', width: 80,
                        render: v => v ? dayjs(v).format('HH:mm') : <Tag color="orange">Буцаагаагүй</Tag> },
                    ]}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Багаж аваагүй" />
                )}
              </>
            )}
          </Spin>
        )}
      </Modal>
    </div>
  )
}
