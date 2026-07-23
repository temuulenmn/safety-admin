import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Row, Col, Card, Statistic, Tag, Progress, Spin, Empty, Alert, Button, Space } from 'antd'
import {
  TeamOutlined, ClockCircleOutlined, ScanOutlined, SafetyCertificateOutlined,
  BookOutlined, StopOutlined, QuestionCircleOutlined, ShoppingCartOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import api from 'src/services/api'

const StatCard = ({ title, value, sub, color = '#5856d6', icon }) => (
  <Card>
    <Statistic
      title={<span style={{ color: '#8c8c8c' }}>{title}</span>}
      value={value ?? 0}
      prefix={icon && <span style={{ color, marginRight: 8 }}>{icon}</span>}
      valueStyle={{ color, fontWeight: 700 }}
    />
    {sub && <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </Card>
)

export default function Dashboard() {
  const [data,       setData]       = useState(null)
  const [trend,      setTrend]      = useState([])
  const [denied,     setDenied]     = useState([])
  const [compliance, setCompliance] = useState([])
  const [law,        setLaw]        = useState({ ins: null, acc: null, hc: null })
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboardOverview(),
      api.getAttendanceTrend({ days: 14 }),
      api.getRfidDeniedReasons({ days: 7 }),
      api.getTrainingCompliance(),
      api.getInsuranceStats().catch(() => ({ data: null })),
      api.getAccidentStats().catch(() => ({ data: null })),
      api.getHealthCheckStats().catch(() => ({ data: null })),
    ]).then(([ov, tr, dn, cp, ins, acc, hc]) => {
      setData(ov.data); setTrend(tr.data); setDenied(dn.data); setCompliance(cp.data)
      setLaw({ ins: ins.data, acc: acc.data, hc: hc.data })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const uncovered = law.ins ? Math.max(0, (law.ins.high_risk_workers || 0) - (law.ins.insured_workers || 0)) : 0
  const alerts = []
  if (uncovered > 0) alerts.push({
    type: 'error', to: '/insurance',
    msg: `${uncovered} эрсдэлт ажилтан даатгалгүй`,
    hint: 'ХАБЭА 28.4 — 36 сарын цалингийн даатгал заавал' })
  if (law.acc?.unreported_severe > 0) alerts.push({
    type: 'error', to: '/accidents',
    msg: `${law.acc.unreported_severe} хүнд/нас барсан осол улсын байцаагчид мэдэгдээгүй`,
    hint: 'ХАБЭА 24-25 — 24 цагийн дотор мэдэгдэх ёстой' })
  if (law.hc?.overdue > 0) alerts.push({
    type: 'warning', to: '/health-checks',
    msg: `${law.hc.overdue} ажилтны эрүүл мэндийн үзлэгийн хугацаа хэтэрсэн`,
    hint: 'ХАБЭА 13.2 — хугацаат үзлэг заавал' })
  if (law.ins?.expiring_soon > 0) alerts.push({
    type: 'info', to: '/insurance',
    msg: `${law.ins.expiring_soon} даатгал 30 хоногт дуусах гэж байна`,
    hint: 'Полисыг сунгах шаардлагатай' })

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>

  const emp  = data?.employees  || {}
  const att  = data?.attendance || {}
  const rfid = data?.rfid       || {}
  const ppe  = data?.ppe        || {}
  const tr   = data?.training   || {}

  return (
    <div>
      {alerts.length > 0 && (
        <Card style={{ marginBottom: 16, borderLeft: '4px solid #cf1322' }} bodyStyle={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <WarningOutlined style={{ color: '#cf1322', fontSize: 18 }} />
            <strong>ХАБЭА хууль — Анхаарах зүйлс ({alerts.length})</strong>
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size={6}>
            {alerts.map((a, i) => (
              <Alert key={i} type={a.type} showIcon message={a.msg} description={a.hint}
                action={<Link to={a.to}><Button size="small" type="primary">Засах →</Button></Link>} />
            ))}
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} xl={6}>
          <StatCard title="Нийт ажилтан" value={emp.total} icon={<TeamOutlined />}
            sub={`Идэвхтэй: ${emp.active} · Чөлөөт: ${emp.on_leave}`} color="#5856d6" />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard title="Өнөөдөр ирсэн" value={att.today_present} icon={<ClockCircleOutlined />}
            sub={`Дундаж цаг: ${att.avg_hours ?? 0}ц`} color="#52c41a" />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard title="RFID скан (өнөөдөр)" value={rfid.today_scans} icon={<ScanOutlined />}
            color="#1890ff"
            sub={<><Tag color="success">{rfid.granted} зөвшөөрсөн</Tag>
              <Tag color="error">{rfid.denied} татгалзсан</Tag></>} />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard title="ХХХ нийцэл (өнөөдөр)"
            value={`${ppe.compliance_pct ?? 0}%`}
            icon={<SafetyCertificateOutlined />}
            sub={`${ppe.complete_checks ?? 0}/${ppe.total_checks ?? 0} шалгалт`}
            color="#faad14" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} xl={6}>
          <StatCard title="Хүчинтэй сургалт" value={tr.valid} icon={<BookOutlined />}
            sub={`Дуусах дөхсөн: ${tr.expiring_soon}`} color="#1890ff" />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard title="Дууссан сургалт" value={tr.expired} icon={<StopOutlined />} color="#cf1322" />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard title="Аваагүй сургалт" value={tr.not_taken} icon={<QuestionCircleOutlined />} color="#8c8c8c" />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard title="Хүлээгдэж буй захиалга"
            value={data?.clothing?.pending_orders} icon={<ShoppingCartOutlined />} color="#faad14" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Ирцийн чиг хандлага (14 хоног)">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" name="Ирсэн" stroke="#5856d6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="RFID татгалзсан (7 хоног)">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={denied} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="access_result" type="category" width={140} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Тоо" fill="#cf1322" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="Хэлтсүүдийн сургалтын нийцэл" style={{ marginTop: 16 }}>
        {compliance.length === 0 && <Empty description="Мэдээлэл байхгүй" />}
        {compliance.map((d) => {
          const total = Number(d.valid) + Number(d.non_compliant)
          const pct   = total > 0 ? Math.round((d.valid / total) * 100) : 0
          const color = pct >= 80 ? '#52c41a' : pct >= 50 ? '#faad14' : '#cf1322'
          return (
            <div key={d.department} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{d.department}</span>
                <span style={{ color: '#8c8c8c' }}>{d.valid}/{total} — {pct}%</span>
              </div>
              <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
            </div>
          )
        })}
      </Card>
    </div>
  )
}
