import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import api from 'src/services/api'

export default function Departments() {
  const [rows,      setRows]      = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [form]      = Form.useForm()
  const [editing,   setEditing]   = useState(null)
  const [saving,    setSaving]    = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.getDepartments(), api.getEmployees({ limit: 500 })])
      .then(([d, e]) => { setRows(d.data || []); setEmployees(e.data || []) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModal(true) }
  const openEdit = (r) => {
    setEditing(r.id)
    form.setFieldsValue({ name: r.name, location: r.location || '', manager_id: r.manager_id || undefined })
    setModal(true)
  }
  const save = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      editing ? await api.updateDepartment(editing, v) : await api.createDepartment(v)
      setModal(false); load(); message.success('Хадгалагдлаа')
    } catch (e) { if (e?.errorFields) return }
    finally { setSaving(false) }
  }
  const remove = async (id) => { await api.deleteDepartment(id); load(); message.success('Устгагдлаа') }

  const cols = [
    { title: '#', width: 60, render: (_, __, i) => i + 1 },
    { title: 'Нэр', dataIndex: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Байрлал', dataIndex: 'location', render: v => v || '—' },
    { title: 'Менежер', dataIndex: 'manager_name', render: v => v || '—' },
    { title: 'Үйлдэл', width: 120, render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        <Popconfirm title="Хэлтсийг устгах уу?" onConfirm={() => remove(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Хэлтсүүд</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Нэмэх</Button>
      </div>
      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          locale={{ emptyText: 'Хэлтэс алга' }} />
      </Card>

      <Modal
        title={editing ? 'Хэлтэс засах' : 'Хэлтэс нэмэх'}
        open={modal} onOk={save} onCancel={() => setModal(false)}
        okText="Хадгалах" cancelText="Болих" confirmLoading={saving} destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="location" label="Байрлал"><Input /></Form.Item>
          <Form.Item name="manager_id" label="Менежер">
            <Select allowClear placeholder="-- Сонгох --"
              options={employees.map(e => ({ value: e.id, label: `${e.last_name} ${e.first_name}` }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
