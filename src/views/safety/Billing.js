import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Statistic, Alert, Progress, Space, Empty, message, Descriptions,
} from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

const PLAN_LABEL  = { starter: 'Эхлэл', professional: 'Мэргэжлийн', enterprise: 'Байгууллага' }
const SUB_LABEL   = { trial: 'Туршилт', active: 'Идэвхтэй', suspended: 'Түдгэлзсэн', cancelled: 'Цуцлагдсан' }
const SUB_COLOR   = { trial: 'blue', active: 'success', suspended: 'orange', cancelled: 'red' }
const INV_LABEL   = { draft: 'Ноорог', sent: 'Илгээсэн', paid: 'Төлсөн', overdue: 'Хугацаа хэтэрсэн', cancelled: 'Цуцлагдсан' }
const INV_COLOR   = { draft: 'default', sent: 'blue', paid: 'success', overdue: 'red', cancelled: 'default' }

const mnt = (v) => `${Number(v || 0).toLocaleString('mn-MN')}₮`

export default function Billing() {
  const [billing,  setBilling]  = useState(null)
  const [sub,      setSub]      = useState(null)
  const [invoices, setInvoices] = useState([])
  const [plans,    setPlans]    = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.getBilling(), api.getSubscription(), api.getInvoices(), api.getPlans(),
    ]).then(([b, s, i, p]) => {
      if (b.status === 'fulfilled') setBilling(b.value.data)
      if (s.status === 'fulfilled') setSub(s.value.data)
      if (i.status === 'fulfilled') setInvoices(i.value.data || [])
      if (p.status === 'fulfilled') setPlans(p.value.data || [])
      if ([b, s, i, p].every(r => r.status === 'rejected')) {
        message.error('Төлбөрийн мэдээлэл ачаалахад алдаа гарлаа')
      }
    }).finally(() => setLoading(false))
  }, [])

  // max_employees = -1 → хязгааргүй
  const cap     = billing?.max_employees ?? sub?.max_employees ?? null
  const used    = billing?.employee_count ?? null
  const unlimited = cap === -1 || cap === null
  const pct     = unlimited || !used ? 0 : Math.round((used / cap) * 100)
  const nearCap = !unlimited && pct >= 85

  const unpaid = invoices.filter(i => ['sent', 'overdue'].includes(i.status))
  const overdue = invoices.filter(i => i.status === 'overdue')

  const cols = [
    { title: 'Нэхэмжлэх', dataIndex: 'invoice_number', width: 170,
      render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: 'Дүн', dataIndex: 'amount', width: 130, align: 'right',
      render: (v, r) => `${Number(v).toLocaleString('mn-MN')}${r.currency === 'MNT' ? '₮' : ' ' + r.currency}` },
    { title: 'Төлөх хугацаа', dataIndex: 'due_date', width: 130,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Төлсөн', dataIndex: 'paid_at', width: 130,
      render: v => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
    { title: 'Төлөв', dataIndex: 'status', width: 140,
      render: v => <Tag color={INV_COLOR[v] || 'default'}>{INV_LABEL[v] || v}</Tag> },
  ]

  return (
    <div>
      <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>Захиалга, төлбөр</h4>

      {overdue.length > 0 && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }}
          message={`${overdue.length} нэхэмжлэхийн хугацаа хэтэрсэн`}
          description={`Нийт ${mnt(overdue.reduce((s, i) => s + Number(i.amount), 0))}. Үйлчилгээ түдгэлзэхээс өмнө төлнө үү.`} />
      )}
      {nearCap && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Багцын ажилтны хязгаарт ойрхон байна"
          description={`${used}/${cap} ажилтан бүртгэгдсэн. Хязгаар хүрэхэд шинэ ажилтан нэмэх боломжгүй болно.`} />
      )}

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small" loading={loading}>
            <Statistic title="Багц" valueStyle={{ fontSize: 22 }}
              value={PLAN_LABEL[billing?.plan_name || sub?.plan_name] || billing?.plan_name || sub?.plan_name || '—'} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={loading}>
            <Statistic title="Сарын төлбөр" valueStyle={{ fontSize: 22 }}
              value={billing?.price_monthly ?? sub?.price_monthly ?? 0}
              formatter={v => mnt(v)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={loading}>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>Ажилтны хязгаар</div>
            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>
              {used ?? '—'} {unlimited ? '' : `/ ${cap}`}
            </div>
            {!unlimited && used != null && (
              <Progress percent={pct} size="small" showInfo={false}
                strokeColor={pct >= 100 ? '#cf1322' : pct >= 85 ? '#faad14' : '#52c41a'}
                style={{ marginTop: 6, marginBottom: 0 }} />
            )}
            {unlimited && <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 6 }}>хязгааргүй</div>}
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" loading={loading}>
            <Statistic title="Төлөгдөөгүй" value={unpaid.reduce((s, i) => s + Number(i.amount), 0)}
              formatter={v => mnt(v)} valueStyle={{ fontSize: 22, color: unpaid.length ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} lg={10}>
          <Card size="small" title={<Space><WalletOutlined />Захиалгын мэдээлэл</Space>} loading={loading}
            style={{ marginBottom: 12 }}>
            {sub ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Төлөв">
                  <Tag color={SUB_COLOR[sub.status] || 'default'}>{SUB_LABEL[sub.status] || sub.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Одоогийн үе">
                  {sub.current_period_start ? dayjs(sub.current_period_start).format('YYYY-MM-DD') : '—'}
                  {' → '}
                  {sub.current_period_end ? dayjs(sub.current_period_end).format('YYYY-MM-DD') : '—'}
                </Descriptions.Item>
                {sub.trial_ends_at && (
                  <Descriptions.Item label="Туршилт дуусах">
                    {dayjs(sub.trial_ends_at).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Ажилтны дээд тоо">
                  {sub.max_employees === -1 ? 'Хязгааргүй' : sub.max_employees}
                </Descriptions.Item>
              </Descriptions>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Идэвхтэй захиалга алга" />}
          </Card>

          <Card size="small" title="Боломжит багцууд" loading={loading}>
            {plans.length ? (
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {plans.map(p => {
                  const current = (sub?.plan_name || billing?.plan_name) === p.name
                  return (
                    <div key={p.id} style={{
                      border: `1px solid ${current ? '#1677ff' : '#f0f0f0'}`,
                      background: current ? '#f0f7ff' : undefined,
                      borderRadius: 6, padding: '10px 12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {PLAN_LABEL[p.name] || p.name}
                          {current && <Tag color="blue" style={{ marginLeft: 8 }}>Одоогийн</Tag>}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {p.max_employees === -1 ? 'Хязгааргүй ажилтан' : `${p.max_employees} хүртэл ажилтан`}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{mnt(p.price_monthly)}<span style={{ fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>/сар</span></div>
                    </div>
                  )
                })}
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                  Багц солих бол үйлчилгээ үзүүлэгчтэй холбогдоно уу.
                </div>
              </Space>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Багц олдсонгүй" />}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card size="small" title={`Нэхэмжлэх (${invoices.length})`} loading={loading}>
            {invoices.length ? (
              <Table rowKey="id" size="small" columns={cols} dataSource={invoices}
                pagination={{ pageSize: 12, showSizeChanger: false }} scroll={{ x: 700 }} />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нэхэмжлэх алга" />}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
