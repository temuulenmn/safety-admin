import React, { useEffect, useState, useCallback } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, Space,
  Alert, Popconfirm, message, Row, Col, Divider,
} from 'antd'
import { PlusOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import dayjs from 'dayjs'

// Компанийн систем хэрэглэгчид. Ажилтан (employees) биш — эдгээр нь
// админ панелд нэвтэрдэг данснууд.
const ROLE_LABEL = {
  admin: 'Админ', manager: 'Менежер', staff: 'Ажилтан', super_admin: 'Супер админ',
}
const ROLE_COLOR = { admin: 'red', manager: 'blue', staff: 'default', super_admin: 'magenta' }
const ROLE_HELP = {
  admin: 'Бүх эрх — хуулийн баримт устгах, тохиргоо өөрчлөх',
  manager: 'Үйл ажиллагааны бичлэг удирдах, хуваарь, багаж, зөрчил',
  staff: 'Харах ба бүртгэх. Устгах эрхгүй.',
}

export default function Users() {
  const [rows,    setRows]    = useState([])
  const [me,      setMe]      = useState(null)
  const [loading, setLoading] = useState(true)

  const [modal,   setModal]   = useState(false)
  const [form]    = Form.useForm()
  const [saving,  setSaving]  = useState(false)

  const [pwModal, setPwModal] = useState(false)
  const [pwForm]  = Form.useForm()
  const [pwSaving,setPwSaving]= useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.getUsers()
      .then(r => setRows(r.data || []))
      .catch(e => message.error(e?.response?.data?.message || 'Ачаалахад алдаа гарлаа'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])
  useEffect(() => { api.getMe().then(r => setMe(r.data)).catch(() => {}) }, [])

  const create = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      await api.createUser(v)
      message.success(`${v.username} үүслээ`)
      setModal(false); load()
    } catch (e) {
      if (e?.errorFields) return
      const m = e?.response?.data?.message || ''
      message.error(/duplicate|unique|аль хэдийн/i.test(m) ? 'Энэ нэвтрэх нэр эсвэл имэйл ашиглагдсан байна' : (m || 'Үүсгэхэд алдаа гарлаа'))
    } finally { setSaving(false) }
  }

  const toggle = async (u) => {
    try {
      await api.toggleUser(u.id)
      message.success(u.is_active ? `${u.username} идэвхгүй болов` : `${u.username} идэвхжлээ`)
      load()
    } catch (e) { message.error(e?.response?.data?.message || 'Өөрчлөхөд алдаа гарлаа') }
  }

  const changePassword = async () => {
    try {
      const v = await pwForm.validateFields()
      setPwSaving(true)
      await api.changePassword({ current_password: v.current_password, new_password: v.new_password })
      message.success('Нууц үг солигдлоо')
      setPwModal(false); pwForm.resetFields()
    } catch (e) {
      if (e?.errorFields) return
      message.error(e?.response?.data?.message || 'Нууц үг солиход алдаа гарлаа')
    } finally { setPwSaving(false) }
  }

  const cols = [
    { title: 'Нэвтрэх нэр', dataIndex: 'username', width: 180,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          {(r.first_name || r.last_name) && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.last_name} {r.first_name}</div>
          )}
        </div>
      ) },
    { title: 'Имэйл', dataIndex: 'email', width: 220, render: v => v || '—' },
    { title: 'Эрх', dataIndex: 'role', width: 130,
      render: v => <Tag color={ROLE_COLOR[v] || 'default'}>{ROLE_LABEL[v] || v}</Tag> },
    { title: 'Сүүлд нэвтэрсэн', dataIndex: 'last_login', width: 160,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : <span style={{ color: '#bfbfbf' }}>хэзээ ч</span> },
    { title: 'Төлөв', dataIndex: 'is_active', width: 110,
      render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Идэвхтэй' : 'Идэвхгүй'}</Tag> },
    { title: '', width: 130, render: (_, r) => (
      me?.id === r.id
        ? <span style={{ fontSize: 12, color: '#8c8c8c' }}>та өөрөө</span>
        : (
          <Popconfirm
            title={r.is_active ? `${r.username}-ийн хандалтыг хаах уу?` : `${r.username}-ийг идэвхжүүлэх үү?`}
            okText="Тийм" cancelText="Үгүй" onConfirm={() => toggle(r)}>
            <Button size="small" danger={r.is_active}>
              {r.is_active ? 'Хаах' : 'Идэвхжүүлэх'}
            </Button>
          </Popconfirm>
        )
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Системийн хэрэглэгчид</h4>
        <Space>
          <Button icon={<KeyOutlined />} onClick={() => { setPwModal(true); pwForm.resetFields() }}>
            Нууц үг солих
          </Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); form.setFieldsValue({ role: 'staff' }); setModal(true) }}>
            Хэрэглэгч нэмэх
          </Button>
        </Space>
      </div>

      <Alert type="info" showIcon icon={<UserOutlined />} style={{ marginBottom: 16 }}
        message="Эдгээр нь админ панелд нэвтрэх данснууд"
        description="Талбайн ажилчид энд бүртгэгддэггүй — тэд «Ажилтнууд» цэснээс PIN авч гар утасны аппликейшнаар нэвтэрнэ." />

      <Card size="small">
        <Table rowKey="id" size="small" loading={loading} columns={cols} dataSource={rows}
          pagination={false} scroll={{ x: 900 }} />
      </Card>

      <Modal open={modal} onOk={create} onCancel={() => setModal(false)} confirmLoading={saving}
        title="Шинэ хэрэглэгч" okText="Үүсгэх" cancelText="Болих" width={520}>
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="username" label="Нэвтрэх нэр"
                rules={[
                  { required: true, message: 'Нэвтрэх нэр оруулна уу' },
                  { pattern: /^[a-zA-Z0-9._-]{3,40}$/, message: '3–40 тэмдэгт, латин үсэг/тоо' },
                ]}>
                <Input autoComplete="off" placeholder="жишээ: hse_barilga" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Эрх" rules={[{ required: true }]}>
                <Select options={['admin', 'manager', 'staff'].map(v => ({ value: v, label: ROLE_LABEL[v] }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item shouldUpdate={(a, b) => a.role !== b.role} noStyle>
                {({ getFieldValue }) => (
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: -12, marginBottom: 16 }}>
                    {ROLE_HELP[getFieldValue('role')] || ''}
                  </div>
                )}
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="email" label="Имэйл"
                rules={[{ required: true, message: 'Имэйл оруулна уу' }, { type: 'email', message: 'Имэйл буруу байна' }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="password" label="Нууц үг"
                rules={[{ required: true, message: 'Нууц үг оруулна уу' }, { min: 8, message: 'Дор хаяж 8 тэмдэгт' }]}>
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={pwModal} onOk={changePassword} onCancel={() => setPwModal(false)} confirmLoading={pwSaving}
        title="Өөрийн нууц үг солих" okText="Солих" cancelText="Болих" width={440}>
        <Form form={pwForm} layout="vertical">
          <Form.Item name="current_password" label="Одоогийн нууц үг" rules={[{ required: true, message: 'Оруулна уу' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="new_password" label="Шинэ нууц үг"
            rules={[{ required: true, message: 'Оруулна уу' }, { min: 8, message: 'Дор хаяж 8 тэмдэгт' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="confirm" label="Давтан оруулах" dependencies={['new_password']}
            rules={[
              { required: true, message: 'Давтан оруулна уу' },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || getFieldValue('new_password') === v ? Promise.resolve() : Promise.reject(new Error('Нууц үг таарахгүй байна')),
              }),
            ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
