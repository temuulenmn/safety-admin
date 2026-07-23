import React, { useEffect, useState } from 'react'
import { Modal, Button, Spin, Alert, Space } from 'antd'
import api from 'src/services/api'
import dayjs from 'dayjs'

const qrUrl = (payload) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(payload)}`

export default function EmployeeQrModal({ employee, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await api.getEmployeeQrToken(employee.id); setData(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [employee.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const regenerate = async () => {
    setRegenerating(true)
    try { const r = await api.issueEmployeeQr(employee.id); setData(r.data) }
    finally { setRegenerating(false) }
  }

  return (
    <Modal open onCancel={onClose} width={480}
      title={`QR-ээр нэвтрэх — ${employee.last_name} ${employee.first_name}`}
      footer={
        <Space>
          {data && (
            <Button danger onClick={regenerate} loading={regenerating}>Шинээр үүсгэх</Button>
          )}
          <Button onClick={onClose}>Хаах</Button>
        </Space>
      }>
      <div style={{ textAlign: 'center' }}>
        {loading ? <Spin /> : !data ? (
          <>
            <p style={{ color: '#8c8c8c' }}>Энэ ажилтанд QR үүсгээгүй байна.</p>
            <Button type="primary" onClick={regenerate} loading={regenerating}>QR үүсгэх</Button>
          </>
        ) : (
          <>
            <img src={qrUrl(data.qr_payload)} alt="QR"
              style={{ maxWidth: 280, width: '100%', border: '4px solid #fff', borderRadius: 8 }} />
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              Дуусах: <b>{dayjs(data.expires_at).format('YYYY-MM-DD HH:mm')}</b>
              {data.used_at && <> · Сүүлд ашигласан: {dayjs(data.used_at).format('MM-DD HH:mm')}</>}
            </div>
            <details style={{ marginTop: 8, fontSize: 12, textAlign: 'left' }}>
              <summary style={{ color: '#8c8c8c', cursor: 'pointer' }}>Токен (нөөц)</summary>
              <code style={{ wordBreak: 'break-all' }}>{data.token}</code>
            </details>
            <Alert type="info" style={{ marginTop: 12, textAlign: 'left' }}
              message="Ажилтан утсандаа Safety Worker апп нээж, 'QR-ээр нэвтрэх' дараад энэ кодыг уншуулна. Утсаа сольсон тохиолдолд шинээр үүсгэж болно." />
          </>
        )}
      </div>
    </Modal>
  )
}
