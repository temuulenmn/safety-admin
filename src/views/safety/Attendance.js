import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Select, DatePicker,
  Space, Tabs, message, InputNumber,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { pageInfo } from 'src/utils/pagination'
import dayjs from 'dayjs'

export default function Attendance() {
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [tab,     setTab]     = useState('today')
  const [today,   setToday]   = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(false)
  const [emps,    setEmps]    = useState([])

  const [range, setRange] = useState([dayjs(), dayjs()])
  const [logs,        setLogs]        = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPage,    setLogsPage]    = useState({ current: 1, pageSize: 25, total: 0 })

  const [sumYear,  setSumYear]  = useState(dayjs().year())
  const [sumMonth, setSumMonth] = useState(dayjs().month() + 1)

  const [ciModal,  setCiModal]  = useState(false)
  const [ciForm]   = Form.useForm()
  const [ciSaving, setCiSaving] = useState(false)

  useEffect(() => {
    api.getEmployees({ status: 'active', limit: 500 }).then(r => setEmps(r.data || []))
    loadToday()
  }, [])

  const loadToday = () => {
    setLoading(true)
    api.getTodayAttendance().then(r => setToday(r.data || [])).finally(() => setLoading(false))
  }

  const loadLogs = useCallback((page = 1, limit = 25) => {
    setLogsLoading(true)
    api.getAttendance({
      page, limit,
      date_from: range[0].format('YYYY-MM-DD'),
      date_to:   range[1].format('YYYY-MM-DD'),
      project_id: currentProjectId || undefined,
    }).then(r => {
      setLogs(r.data || [])
      setLogsPage(pageInfo(r, page, limit))
    }).finally(() => setLogsLoading(false))
  }, [range, currentProjectId])
  useEffect(() => { if (tab === 'logs') loadLogs(1, logsPage.pageSize) /* eslint-disable-next-line */ }, [tab, range, currentProjectId])

  const loadSummary = useCallback(() => {
    setLoading(true)
    api.getAttendanceSummary({ year: sumYear, month: sumMonth })
      .then(r => setSummary(r.data || [])).finally(() => setLoading(false))
  }, [sumYear, sumMonth])
  useEffect(() => { if (tab === 'summary') loadSummary() }, [tab, loadSummary])

  const checkIn = async () => {
    try {
      const v = await ciForm.validateFields()
      setCiSaving(true)
      await api.checkIn({ employee_id: v.employee_id, source: 'manual' })
      setCiModal(false); loadToday(); message.success('Ирц бүртгэгдлээ')
    } catch (e) { if (e?.errorFields) return }
    finally { setCiSaving(false) }
  }

  const fmt = (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'

  const todayCols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department', render: v => v || '—' },
    { title: 'Ирсэн', dataIndex: 'check_in', width: 150, render: fmt },
    { title: 'Гарсан', dataIndex: 'check_out', width: 150,
      render: v => v ? fmt(v) : <Tag color="orange">Гараагүй</Tag> },
    { title: 'Цаг', dataIndex: 'work_hours', width: 70, render: v => v ?? '—' },
    { title: 'Эх', dataIndex: 'source', width: 110,
      render: v => <Tag color="cyan">{v}</Tag> },
  ]

  const logCols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Хэлтэс', dataIndex: 'department', width: 130, render: v => v || '—' },
    { title: 'Ирсэн', dataIndex: 'check_in', width: 150, render: fmt },
    { title: 'Гарсан', dataIndex: 'check_out', width: 150, render: v => v ? fmt(v) : '—' },
    { title: 'Цаг', dataIndex: 'work_hours', width: 70 },
    { title: 'Төсөл', dataIndex: 'project_name', width: 150, render: v => v || '—' },
    { title: 'Эх сурвалж', dataIndex: 'source', width: 110 },
  ]

  const sumCols = [
    { title: 'Код', dataIndex: 'emp_code', width: 100 },
    { title: 'Нэр', dataIndex: 'full_name' },
    { title: 'Ажилласан өдөр', dataIndex: 'total_days', align: 'right' },
    { title: 'Нийт цаг', dataIndex: 'total_hours', align: 'right',
      render: v => Number(v || 0).toFixed(1) },
    { title: 'Дундаж цаг', dataIndex: 'avg_hours', align: 'right',
      render: v => Number(v || 0).toFixed(1) },
  ]

  const tabItems = [
    { key: 'today', label: 'Өнөөдөр', children: (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#8c8c8c' }}>Өнөөдөр ирсэн: <strong>{today.length}</strong></span>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { ciForm.resetFields(); setCiModal(true) }}>Ирц тэмдэглэх</Button>
            <Button icon={<ReloadOutlined />} onClick={loadToday}>Шинэчлэх</Button>
          </Space>
        </div>
        <Card>
          <Table rowKey={(r, i) => r.id || i} size="middle" loading={loading}
            columns={todayCols} dataSource={today}
            pagination={{ pageSize: 25 }} locale={{ emptyText: 'Өгөгдөл байхгүй' }} />
        </Card>
      </>
    ) },
    { key: 'logs', label: 'Лог', children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Space wrap>
            <DatePicker.RangePicker value={range} onChange={v => v && setRange(v)}
              format="YYYY-MM-DD" allowClear={false} />
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => loadLogs(1, logsPage.pageSize)}>Хайх</Button>
          </Space>
        </Card>
        <Card>
          <Table rowKey={(r, i) => r.id || i} size="middle" loading={logsLoading}
            columns={logCols} dataSource={logs}
            pagination={{ ...logsPage, onChange: (p, s) => loadLogs(p, s) }} />
        </Card>
      </>
    ) },
    { key: 'summary', label: 'Тайлан', children: (
      <>
        <Card style={{ marginBottom: 12 }}>
          <Space wrap>
            <InputNumber value={sumYear} onChange={setSumYear} placeholder="Жил" />
            <Select value={sumMonth} onChange={setSumMonth} style={{ width: 140 }}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}-р сар` }))} />
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadSummary}>Харах</Button>
          </Space>
        </Card>
        <Card>
          <Table rowKey={(r, i) => r.id || i} size="middle" loading={loading}
            columns={sumCols} dataSource={summary}
            pagination={{ pageSize: 25 }} locale={{ emptyText: 'Өгөгдөл байхгүй' }} />
        </Card>
      </>
    ) },
  ]

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Ирц</h4>
      <Tabs activeKey={tab} onChange={setTab} items={tabItems} />

      <Modal open={ciModal} onOk={checkIn} onCancel={() => setCiModal(false)}
        title="Ирц тэмдэглэх" confirmLoading={ciSaving}
        okText="Тэмдэглэх" cancelText="Болих" destroyOnClose>
        <Form form={ciForm} layout="vertical" requiredMark={false}>
          <Form.Item name="employee_id" label="Ажилтан" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" placeholder="-- Сонгох --"
              options={emps.map(e => ({ value: e.id, label: `${e.emp_code} — ${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
