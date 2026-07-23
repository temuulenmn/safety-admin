import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, InputNumber, DatePicker,
  Space, Empty, Spin, Popconfirm, Input, message,
} from 'antd'
import { PlusOutlined, DownloadOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { downloadCSV } from 'src/utils/exporters'
import dayjs from 'dayjs'

const STATUS_COLOR = { draft: 'default', approved: 'processing', paid: 'success' }
const STATUS_LABEL = { draft: 'Ноорог', approved: 'Батлагдсан', paid: 'Төлсөн' }
const fmt = (v) => Number(v || 0).toLocaleString('mn-MN')

export default function Payroll() {
  const [periods,   setPeriods]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [entries,   setEntries]   = useState([])
  const [summary,   setSummary]   = useState(null)
  const [entLoad,   setEntLoad]   = useState(false)
  const [modal,     setModal]     = useState(false)
  const [form]      = Form.useForm()
  const [saving,    setSaving]    = useState(false)
  const [approving, setApproving] = useState(null)
  const [generating,setGenerating]= useState(false)

  const load = () => {
    setLoading(true)
    api.getPayrollPeriods().then(r => setPeriods(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openPeriod = async (p) => {
    setSelected(p); setEntLoad(true)
    const [e, s] = await Promise.all([api.getPeriodEntries(p.id), api.getPeriodSummary(p.id)])
    setEntries(e.data || []); setSummary(s.data || null); setEntLoad(false)
  }

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({ year: dayjs().year(), month: dayjs().month() + 1 })
    setModal(true)
  }
  const createPeriod = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createPayrollPeriod({
        year: v.year, month: v.month,
        start_date: v.start_date.format('YYYY-MM-DD'),
        end_date:   v.end_date.format('YYYY-MM-DD'),
      })
      setModal(false); load(); message.success('Хугацаа үүсгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }

  const approve = async (id) => {
    setApproving(id)
    try {
      await api.approvePeriod(id); load()
      if (selected?.id === id) openPeriod({ ...selected, status: 'approved' })
      message.success('Батлагдлаа')
    } finally { setApproving(null) }
  }

  const generate = async () => {
    if (!selected) return
    setGenerating(true)
    try { await api.generatePayroll(selected.id); load(); openPeriod(selected); message.success('Тооцоолол дууслаа') }
    finally { setGenerating(false) }
  }

  const exportExcel = () => {
    if (!selected) return
    downloadCSV(`tsalin-${selected.year}-${String(selected.month).padStart(2, '0')}`,
      ['Код','Нэр','Хэлтэс','Үндсэн','Илүү цаг','Урамшуулал','ААНТТШ','НДШХ','Бусад суутгал','Ажилласан өдөр','Цэвэр'],
      entries.map(e => [e.emp_code, e.full_name, e.department_name || '',
        e.base_salary || 0, e.overtime_pay || 0, e.bonus || 0,
        e.deduction_tax || 0, e.deduction_social || 0, e.deduction_other || 0, e.worked_days || 0,
        e.net_salary ?? (Number(e.base_salary || 0) + Number(e.overtime_pay || 0) + Number(e.bonus || 0)
          - Number(e.deduction_tax || 0) - Number(e.deduction_social || 0) - Number(e.deduction_other || 0))]))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Цалин</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Хугацаа үүсгэх</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col lg={8} xs={24}>
          <Card title="Цалингийн хугацаанууд">
            {loading ? <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div> : (
              periods.length === 0 ? <Empty description="Хугацаа алга" /> :
              periods.map(p => (
                <div key={p.id} onClick={() => openPeriod(p)}
                  style={{
                    padding: 12, borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                    background: selected?.id === p.id ? '#e6f7ff' : 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.year} / {String(p.month).padStart(2, '0')}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 11 }}>
                      {p.start_date?.slice(0, 10)} – {p.end_date?.slice(0, 10)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Tag color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Tag>
                    <div style={{ color: '#8c8c8c', fontSize: 11 }}>{p.entry_count} ажилтан</div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </Col>

        <Col lg={16} xs={24}>
          {selected ? (
            <Card title={`${selected.year} / ${String(selected.month).padStart(2, '0')} — дэлгэрэнгүй`}
              extra={
                <Space>
                  <Button size="small" icon={<DownloadOutlined />} onClick={exportExcel}>Excel</Button>
                  {selected.status === 'draft' && (
                    <>
                      <Popconfirm title="Бүх идэвхтэй ажилтны цалинг автоматаар тооцох уу?" onConfirm={generate} okText="Тийм" cancelText="Үгүй">
                        <Button size="small" icon={<ReloadOutlined />} loading={generating}>Цалин тооцох</Button>
                      </Popconfirm>
                      <Popconfirm title="Цалинг батлах уу?" onConfirm={() => approve(selected.id)} okText="Тийм" cancelText="Үгүй">
                        <Button size="small" type="primary" icon={<CheckOutlined />}
                          loading={approving === selected.id}>Батлах</Button>
                      </Popconfirm>
                    </>
                  )}
                </Space>
              }>
              {summary && (
                <Row gutter={[8, 8]} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  {[
                    ['Нийт ажилтан', summary.employee_count],
                    ['Үндсэн цалин', fmt(summary.total_base) + '₮'],
                    ['Илүү цаг', fmt(summary.total_overtime) + '₮'],
                    ['Урамшуулал', fmt(summary.total_bonus) + '₮'],
                    ['НДШХ', fmt(summary.total_social) + '₮'],
                    ['ААНТТШ', fmt(summary.total_tax) + '₮'],
                    ['Цэвэр', fmt(summary.total_net) + '₮'],
                  ].map(([l, v]) => (
                    <Col key={l} xs={12} sm={6} md={3} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#8c8c8c', fontSize: 11 }}>{l}</div>
                      <div style={{ fontWeight: 700 }}>{v}</div>
                    </Col>
                  ))}
                </Row>
              )}
              {entLoad ? <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div> :
                <PayrollEntriesTable entries={entries} canEdit={selected.status === 'draft'}
                  onUpdated={() => openPeriod(selected)} period={selected} />}
            </Card>
          ) : (
            <Empty description="Хугацаа сонгоно уу" style={{ padding: 60 }} />
          )}
        </Col>
      </Row>

      <Modal open={modal} onOk={createPeriod} onCancel={() => setModal(false)}
        title="Цалингийн хугацаа үүсгэх" confirmLoading={saving}
        okText="Үүсгэх" cancelText="Болих" destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="year" label="Жил" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="month" label="Сар" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} max={12} /></Form.Item></Col>
            <Col span={12}><Form.Item name="start_date" label="Эхлэх огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="end_date" label="Дуусах огноо" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

function PayrollEntriesTable({ entries, canEdit, onUpdated, period }) {
  const [editing,  setEditing]  = useState(null)
  const [bonusVal, setBonusVal] = useState()
  const [noteVal,  setNoteVal]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const startEdit = (e) => { setEditing(e.employee_id); setBonusVal(Number(e.bonus || 0)); setNoteVal(e.note || '') }
  const save = async (e) => {
    setSaving(true)
    try {
      await api.upsertEntry(period.id, {
        employee_id: e.employee_id,
        base_salary: e.base_salary, overtime_hours: e.overtime_hours, overtime_pay: e.overtime_pay,
        bonus: Number(bonusVal) || 0,
        deduction_tax: e.deduction_tax, deduction_social: e.deduction_social, deduction_other: e.deduction_other,
        worked_days: e.worked_days, absent_days: e.absent_days, note: noteVal || null,
      })
      setEditing(null); onUpdated(); message.success('Хадгалагдлаа')
    } finally { setSaving(false) }
  }

  const cols = [
    { title: 'Код', dataIndex: 'emp_code', width: 90 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department_name', render: v => v || '—' },
    { title: 'Үндсэн', dataIndex: 'base_salary', align: 'right', render: v => fmt(v) },
    { title: 'Илүү', dataIndex: 'overtime_pay', align: 'right', render: v => fmt(v) },
    { title: 'Урамшуулал', dataIndex: 'bonus', align: 'right', width: 160,
      render: (v, e) => editing === e.employee_id
        ? <InputNumber size="small" value={bonusVal} onChange={setBonusVal} style={{ width: '100%' }} autoFocus />
        : <span style={{ color: Number(v) > 0 ? '#52c41a' : undefined, fontWeight: Number(v) > 0 ? 600 : 400 }}>{fmt(v)}</span> },
    { title: 'Суутгал', align: 'right',
      render: (_, e) => <span style={{ color: '#cf1322' }}>
        {fmt(Number(e.deduction_tax || 0) + Number(e.deduction_social || 0) + Number(e.deduction_other || 0))}
      </span> },
    { title: 'Цэвэр', align: 'right',
      render: (_, e) => {
        const deduction = Number(e.deduction_tax || 0) + Number(e.deduction_social || 0) + Number(e.deduction_other || 0)
        const bonus = editing === e.employee_id ? Number(bonusVal || 0) : Number(e.bonus || 0)
        return <strong>{fmt(Number(e.base_salary || 0) + Number(e.overtime_pay || 0) + bonus - deduction)}</strong>
      } },
    canEdit && { title: '', width: 100, render: (_, e) => (
      editing === e.employee_id
        ? <Space size="small">
            <Button size="small" type="primary" loading={saving} onClick={() => save(e)}>✓</Button>
            <Button size="small" onClick={() => setEditing(null)}>×</Button>
          </Space>
        : <Button size="small" onClick={() => startEdit(e)}>Урамш</Button>
    ) },
  ].filter(Boolean)

  return (
    <>
      <Table rowKey="id" size="small" columns={cols} dataSource={entries}
        pagination={{ pageSize: 30 }}
        locale={{ emptyText: 'Ажилтан алга. "Цалин тооцох" товчоор үүсгэнэ үү' }} />
      {editing !== null && (
        <div style={{ padding: 8, background: '#fafafa', marginTop: 4 }}>
          <Space>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>Тэмдэглэл:</span>
            <Input size="small" value={noteVal} onChange={e => setNoteVal(e.target.value)}
              placeholder="Урамшууллын шалтгаан (заавал биш)" style={{ width: 400 }} />
          </Space>
        </div>
      )}
    </>
  )
}
