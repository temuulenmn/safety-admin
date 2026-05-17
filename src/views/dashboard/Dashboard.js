import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner, CBadge, CProgress,
} from '@coreui/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import api from 'src/services/api'

const StatCard = ({ title, value, sub, color = 'primary' }) => (
  <CCard className="mb-3 h-100">
    <CCardBody>
      <div className="text-medium-emphasis small fw-semibold text-uppercase mb-1">{title}</div>
      <div className={`fs-2 fw-bold text-${color}`}>{value ?? <CSpinner size="sm" />}</div>
      {sub && <div className="text-medium-emphasis small mt-1">{sub}</div>}
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const [data,       setData]       = useState(null)
  const [trend,      setTrend]      = useState([])
  const [denied,     setDenied]     = useState([])
  const [compliance, setCompliance] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboardOverview(),
      api.getAttendanceTrend({ days: 14 }),
      api.getRfidDeniedReasons({ days: 7 }),
      api.getTrainingCompliance(),
    ]).then(([ov, tr, dn, cp]) => {
      setData(ov.data)
      setTrend(tr.data)
      setDenied(dn.data)
      setCompliance(cp.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-5"><CSpinner color="primary" /></div>

  const emp  = data?.employees  || {}
  const att  = data?.attendance || {}
  const rfid = data?.rfid       || {}
  const ppe  = data?.ppe        || {}
  const tr   = data?.training   || {}

  return (
    <div className="p-3">
      <h4 className="mb-4 fw-bold">Хянах самбар</h4>

      <CRow className="g-3 mb-3">
        <CCol sm={6} xl={3}>
          <StatCard title="Нийт ажилтан" value={emp.total}
            sub={`Идэвхтэй: ${emp.active} | Чөлөөт: ${emp.on_leave}`} color="primary" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard title="Өнөөдөр ирсэн" value={att.today_present}
            sub={`Дундаж цаг: ${att.avg_hours ?? 0}ц`} color="success" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard title="RFID скан (өнөөдөр)" value={rfid.today_scans}
            sub={
              <>
                <CBadge color="success" className="me-1">{rfid.granted} зөвшөөрсөн</CBadge>
                <CBadge color="danger">{rfid.denied} татгалзсан</CBadge>
              </>
            } />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard title="ХХХ нийцэл (өнөөдөр)"
            value={`${ppe.compliance_pct ?? 0}%`}
            sub={`${ppe.complete_checks ?? 0}/${ppe.total_checks ?? 0} шалгалт`}
            color="warning" />
        </CCol>
      </CRow>

      <CRow className="g-3 mb-3">
        <CCol sm={6} xl={3}>
          <StatCard title="Хүчинтэй сургалт" value={tr.valid}
            sub={`Дуусах дөхсөн: ${tr.expiring_soon}`} color="info" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard title="Дууссан сургалт" value={tr.expired} color="danger" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard title="Аваагүй сургалт" value={tr.not_taken} color="secondary" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatCard title="Хүлээгдэж буй захиалга"
            value={data?.clothing?.pending_orders} color="warning" />
        </CCol>
      </CRow>

      <CRow className="g-3">
        <CCol lg={8}>
          <CCard>
            <CCardHeader className="fw-semibold">Ирцийн чиг хандлага (14 хоног)</CCardHeader>
            <CCardBody>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" name="Ирсэн" stroke="#321fdb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard>
            <CCardHeader className="fw-semibold">RFID татгалзсан (7 хоног)</CCardHeader>
            <CCardBody>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={denied} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="access_result" type="category" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Тоо" fill="#e55353" />
                </BarChart>
              </ResponsiveContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="mt-3">
        <CCardHeader className="fw-semibold">Хэлтсүүдийн сургалтын нийцэл</CCardHeader>
        <CCardBody>
          {compliance.length === 0 && <p className="text-medium-emphasis mb-0">Мэдээлэл байхгүй</p>}
          {compliance.map((d) => {
            const total = Number(d.valid) + Number(d.non_compliant)
            const pct   = total > 0 ? Math.round((d.valid / total) * 100) : 0
            return (
              <div key={d.department} className="mb-2">
                <div className="d-flex justify-content-between small mb-1">
                  <span>{d.department}</span>
                  <span className="text-medium-emphasis">{d.valid}/{total} — {pct}%</span>
                </div>
                <CProgress
                  value={pct}
                  color={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'}
                  height={8}
                />
              </div>
            )
          })}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default Dashboard
