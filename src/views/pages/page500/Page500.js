import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function Page500() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result status="500" title="500" subTitle="Серверийн алдаа. Түр хүлээгээд дахин оролдоно уу."
        extra={<Button type="primary" onClick={() => navigate('/dashboard')}>Нүүр рүү буцах</Button>} />
    </div>
  )
}
