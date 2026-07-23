import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Row, Col, Typography, Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import api from 'src/services/api'

const { Title, Text } = Typography

// Muse-style split login. Left = form, right = brand gradient.
export default function Login() {
  const nav = useNavigate()
  const dispatch = useDispatch()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { localStorage.clear() }, [])

  const onFinish = async ({ username, password }) => {
    setErr(''); setBusy(true)
    try {
      const r = await api.login({ username, password })
      dispatch({ type: 'login', token: r.data.token, user: r.data.user })
      if (r.data.user?.first_name) localStorage.setItem('first_name', r.data.user.first_name)
      nav('/dashboard', { replace: true })
    } catch (e) {
      setErr(e?.response?.data?.message || 'Нэвтрэх нэр эсвэл нууц үг буруу байна')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Row style={{ minHeight: '100vh', margin: 0 }}>
        {/* Left — form */}
        <Col xs={24} lg={12} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', padding: 40,
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <SafetyOutlined style={{ fontSize: 56, color: '#5856d6', marginBottom: 12 }} />
              <Title level={3} style={{ marginBottom: 4, color: '#1a1f36', fontWeight: 700 }}>
                Тавтай морилно уу
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Аюулгүй ажиллагааны удирдлагын систем
              </Text>
            </div>
            {err && <Alert type="error" message={err} style={{ marginBottom: 16 }} closable onClose={() => setErr('')} />}
            <Form onFinish={onFinish} layout="vertical" requiredMark={false}>
              <Form.Item label={<b>Нэвтрэх нэр</b>} name="username"
                rules={[{ required: true, message: 'Нэвтрэх нэр шаардлагатай' }]}>
                <Input size="large" prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="username эсвэл email"
                  style={{ borderRadius: 8, height: 48 }} />
              </Form.Item>
              <Form.Item label={<b>Нууц үг</b>} name="password"
                rules={[{ required: true, min: 6, message: 'Нууц үг 6+ тэмдэгт' }]}>
                <Input.Password size="large" prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="••••••••"
                  style={{ borderRadius: 8, height: 48 }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={busy}
                style={{
                  background: 'linear-gradient(135deg, #5856d6 0%, #722ed1 100%)',
                  border: 'none', height: 48, borderRadius: 8,
                  fontWeight: 600, fontSize: 15,
                }}>
                Нэвтрэх
              </Button>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                © {new Date().getFullYear()} Safety System
              </Text>
            </div>
          </div>
        </Col>

        {/* Right — brand */}
        <Col xs={0} lg={12} style={{
          background: 'linear-gradient(135deg, #5856d6 0%, #722ed1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 40, color: '#fff',
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <SafetyOutlined style={{ fontSize: 96, marginBottom: 24, opacity: 0.9 }} />
            <Title level={2} style={{ color: '#fff', marginBottom: 16, fontWeight: 700 }}>
              Барилгын аюулгүй ажиллагаа
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.7 }}>
              Ажилтан, ХХХ, багаж, аюултай бүсийн RFID-д суурилсан бүх нийтийн хяналт.
              Real-time notification, төслийн KPI, автомат тайлан.
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  )
}
