import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber,
  Space, Statistic, Descriptions, Alert, Spin, message,
} from 'antd'
import { PlusOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
import { downloadCSV } from 'src/utils/exporters'
import dayjs from 'dayjs'

const TYPE_LABEL = {
  clothing_missing: 'Хувцас дутуу',
  tool_missing:     'Багаж дутуу',
  no_helmet:        'Каскагүй',
  no_vest:          'Хантаазгүй',
  no_boots:         'Гутал буруу',
  other:            'Бусад',
}
const STATUS_COLOR = { pending: 'orange', confirmed: 'cyan', paid: 'success', waived: 'default' }
const STATUS_LABEL = { pending: 'Хүлээгдэж буй', confirmed: 'Баталгаажсан', paid: 'Төлсөн', waived: 'Чөлөөлсөн' }
const fmtMNT = n => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function Violations() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [stats,   setStats]   = useState(null)
  const [emps,    setEmps]    = useState([])
  const [statusF, setStatusF] = useState()
  const [typeF,   setTypeF]   = useState()
  const [monthF,  setMonthF]  = useState()      // 'YYYY-MM'
  const [months,  setMonths]  = useState([])
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState({ current: 1, pageSize: 25, total: 0 })

  const [modal, setModal] = useState(false)
  const [form]  = Form.useForm()
  const [saving,setSaving] = useState(false)
  const [detail,setDetail] = useState(null)
  const [setModalOpen, setSetModalOpen] = useState(false)

  const refreshStats = () => api.getViolationStats({ days: 30 }).then(r => setStats(r.data))
  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    refreshStats()
  }, [])

  const load = useCallback((p = 1, l = 25) => {
    setLoading(true)
    api.getViolations({
      page: p, limit: l,
      status: statusF || undefined,
      violation_type: typeF || undefined,
      month: monthF || undefined,
      project_id: currentProjectId || undefined,
    }).then(r => {
      setRows(r.data || [])
      setPage(pageInfo(r, p, l))
    }).finally(() => setLoading(false))
  }, [statusF, typeF, monthF, currentProjectId])
  useEffect(() => { load(1, page.pageSize) /* eslint-disable-next-line */ }, [statusF, typeF, monthF, currentProjectId])

  // Боломжит он-сарууд (шинэ нь эхэнд). Хуудаслалттай тул серверээс авна.
  useEffect(() => {
    api.getViolationMonths({ project_id: currentProjectId || undefined })
      .then(r => setMonths(r.data || []))
      .catch(() => setMonths([]))
  }, [currentProjectId])

  const exportExcel = async () => {
    const r = await api.getViolations({ page: 1, limit: 5000,
      status: statusF || undefined, violation_type: typeF || undefined, month: monthF || undefined,
      project_id: currentProjectId || undefined })
    downloadCSV('zorchil', ['Огноо','Код','Ажилтан','Хэлтэс','Төрөл','Бүс','Төсөл','Торгууль','Төлөв'],
      (r.data || []).map(v => [
        v.occurred_at ? dayjs(v.occurred_at).format('YYYY-MM-DD HH:mm') : '',
        v.emp_code || '', v.full_name || '', v.department || '',
        TYPE_LABEL[v.violation_type] || v.violation_type, v.zone || '', v.project_name || '',
        v.penalty_amount || 0, STATUS_LABEL[v.status] || v.status]))
  }

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({ violation_type: 'clothing_missing', penalty_amount: 20000 })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createViolation({
        ...v,
        missing_items: (v.missing_items || '').split(',').map(s => s.trim()).filter(Boolean),
        penalty_amount: Number(v.penalty_amount),
      })
      setModal(false); load(page.current, page.pageSize); refreshStats(); message.success('Бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const changeStatus = async (id, status) => {
    await api.updateViolation(id, { status })
    load(page.current, page.pageSize); refreshStats()
    if (detail?.id === id) setDetail(d => ({ ...d, status }))
    message.success('Шинэчлэгдлээ')
  }

  const cols = [
    { title: 'Огноо', dataIndex: 'occurred_at', width: 165,
      render: (v, r, idx) => {
        if (!v) return '—'
        const d = dayjs(v)
        // Сар солигдох мөрөнд он-сарыг бүдүүнээр харуулж бүлгийг ялгана
        const prev = idx > 0 ? rows[idx - 1]?.occurred_at : null
        const newMonth = !prev || dayjs(prev).format('YYYY-MM') !== d.format('YYYY-MM')
        return (
          <div>
            {newMonth && (
              <div style={{ fontWeight: 700, fontSize: 12, color: '#1677ff', marginBottom: 2 }}>
                {d.format('YYYY оны M-р сар')}
              </div>
            )}
            <span>{d.format('MM-DD HH:mm')}</span>
          </div>
        )
      } },
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Ажилтан', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department', width: 130, render: v => v || '—' },
    { title: 'Төрөл', dataIndex: 'violation_type', width: 140,
      render: v => TYPE_LABEL[v] || v },
    { title: 'Бүс', dataIndex: 'zone', width: 100, render: v => v || '—' },
    { title: 'Төсөл', dataIndex: 'project_name', width: 130, render: v => v || '—' },
    { title: 'Торгууль', dataIndex: 'penalty_amount', width: 130, align: 'right',
      render: v => <strong>{fmtMNT(v)}</strong> },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: '', width: 80, render: (_, r) => (
      <Button size="small" onClick={() => setDetail(r)}>Үзэх</Button>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Зөрчил / Торгууль</h4>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>Excel</Button>
          <Button icon={<SettingOutlined />} onClick={() => setSetModalOpen(true)}>Тохиргоо</Button>
          <Button type="primary" danger icon={<PlusOutlined />} onClick={openCreate}>Зөрчил бүртгэх</Button>
        </Space>
      </div>

      {stats?.overall && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Нийт зөрчил (30 хоног)" value={stats.overall.total} valueStyle={{ fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Хүлээгдэж буй" value={stats.overall.pending}
                valueStyle={{ color: '#faad14', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Цуглуулсан" value={fmtMNT(stats.overall.collected)}
                valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: 18 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="Авлага үлдсэн" value={fmtMNT(stats.overall.outstanding)}
                valueStyle={{ color: '#cf1322', fontWeight: 700, fontSize: 18 }} />
            </Card>
          </Col>
        </Row>
      )}

      {stats?.top_violators?.length > 0 && (
        <Card title="Хамгийн их зөрчилтэй (30 хоног)" size="small" style={{ marginBottom: 16 }}>
          <Table rowKey="employee_id" size="small" pagination={false}
            columns={[
              { title: 'Код', dataIndex: 'emp_code', width: 100 },
              { title: 'Нэр', dataIndex: 'full_name' },
              { title: 'Зөрчил', dataIndex: 'count', align: 'right', width: 100 },
              { title: 'Дүн', dataIndex: 'total_amount', align: 'right', width: 160,
                render: v => <strong>{fmtMNT(v)}</strong> },
            ]}
            dataSource={stats.top_violators.slice(0, 5)} />
        </Card>
      )}

      <Card>
        <Row gutter={8} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Select value={statusF} onChange={setStatusF} allowClear
              placeholder="Бүх төлөв" style={{ width: '100%' }}
              options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Select value={typeF} onChange={setTypeF} allowClear
              placeholder="Бүх төрөл" style={{ width: '100%' }}
              options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Col>
          <Col xs={12} sm={6}>
            <Select value={monthF} onChange={setMonthF} allowClear
              placeholder="Бүх сар" style={{ width: '100%' }}
              options={months.map(m => ({
                value: m.month,
                label: `${dayjs(m.month + '-01').format('YYYY оны M-р сар')} · ${m.total}`,
              }))} />
          </Col>
        </Row>
        {months.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {months.map(m => {
              const active = monthF === m.month
              return (
                <div key={m.month}
                  onClick={() => setMonthF(active ? undefined : m.month)}
                  style={{
                    cursor: 'pointer', borderRadius: 6, padding: '8px 12px', minWidth: 132,
                    border: `1px solid ${active ? '#1677ff' : '#f0f0f0'}`,
                    background: active ? '#f0f7ff' : '#fafafa',
                  }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {dayjs(m.month + '-01').format('YYYY оны M-р сар')}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                    {m.total} зөрчил · {Number(m.amount).toLocaleString('mn-MN')}₮
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                    сануулга {m.warnings} · торгууль {m.penalties}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ ...page, onChange: (p, s) => load(p, s) }} />
      </Card>

      <Modal open={modal} onOk={save} onCancel={() => setModal(false)}
        title="Зөрчил бүртгэх" confirmLoading={saving}
        okText="Бүртгэх" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="violation_type" label="Зөрчлийн төрөл">
                <Select options={Object.entries(TYPE_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="zone" label="Бүс"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="missing_items" label="Дутуу зүйлс (таслалаар)">
            <Input placeholder="helmet, vest, gloves" />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="penalty_amount" label="Торгуулийн дүн (₮)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={!!detail} onCancel={() => setDetail(null)}
        title="Зөрчлийн дэлгэрэнгүй" width={600}
        footer={
          <Space>
            {detail?.status === 'pending' && (
              <>
                <Button onClick={() => changeStatus(detail.id, 'confirmed')}>Баталгаажуулах</Button>
                <Button onClick={() => changeStatus(detail.id, 'waived')}>Чөлөөлөх</Button>
              </>
            )}
            {(detail?.status === 'pending' || detail?.status === 'confirmed') && (
              <Button type="primary" onClick={() => changeStatus(detail.id, 'paid')}>Төлөв: Төлсөн</Button>
            )}
            <Button onClick={() => setDetail(null)}>Хаах</Button>
          </Space>
        }>
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Ажилтан">{detail.emp_code} — {detail.full_name}</Descriptions.Item>
            <Descriptions.Item label="Огноо">{dayjs(detail.occurred_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Төрөл">{TYPE_LABEL[detail.violation_type] || detail.violation_type}</Descriptions.Item>
            <Descriptions.Item label="Бүс">{detail.zone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Дутуу">{(detail.missing_items || []).join(', ') || '—'}</Descriptions.Item>
            <Descriptions.Item label="Тайлбар">{detail.description || '—'}</Descriptions.Item>
            <Descriptions.Item label="Торгууль">
              <span style={{ color: '#cf1322', fontWeight: 700 }}>{fmtMNT(detail.penalty_amount)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Төлөв">
              <Tag color={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {setModalOpen && <SettingsModal onClose={() => setSetModalOpen(false)} />}
    </div>
  )
}

function SettingsModal({ onClose }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    api.getViolationSettings().then(r => {
      setPreview(r.data)
      form.setFieldsValue({
        violation_warning_limit: Number(r.data.violation_warning_limit),
        penalty_amount: Number(r.data.penalty_amount),
        warning_reset_days: Number(r.data.warning_reset_days),
      })
    }).finally(() => setLoading(false))
  }, [form])

  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.updateViolationSettings({
        violation_warning_limit: Number(v.violation_warning_limit),
        penalty_amount: Number(v.penalty_amount),
        warning_reset_days: Number(v.warning_reset_days),
      })
      message.success('Хадгалагдлаа'); onClose()
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }

  return (
    <Modal open onOk={save} onCancel={onClose} confirmLoading={saving}
      title="Сануулга / Торгуулийн тохиргоо" okText="Хадгалах" cancelText="Болих" destroyOnClose>
      {loading ? <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div> : (
        <>
          {preview && (
            <Alert type="info" showIcon style={{ marginBottom: 12 }}
              message={<>Ажилтныг <strong>{preview.violation_warning_limit}</strong> удаа сануулаад,
                дараагийн ({Number(preview.violation_warning_limit) + 1} дэх) зөрчилд автоматаар
                <strong> {Number(preview.penalty_amount).toLocaleString()}₮</strong> торгууль ноогдуулна.</>} />
          )}
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item name="violation_warning_limit" label="Сануулгын тоо (X удаа)"
              help="Энэ тооноос хэтэрвэл торгууль эхэлнэ">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="penalty_amount" label="Торгуулийн дүн (₮)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="warning_reset_days" label="Сануулга тэглэх хугацаа (хоног)"
              help="Энэ хоногийн дотор тоолно (rolling window)">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  )
}
