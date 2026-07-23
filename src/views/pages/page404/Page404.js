import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function Page404() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result status="404" title="404" subTitle="Уучлаарай, таны хайсан хуудас олдсонгүй."
        extra={<Button type="primary" onClick={() => navigate('/dashboard')}>Нүүр рүү буцах</Button>} />
    </div>
  )
}
