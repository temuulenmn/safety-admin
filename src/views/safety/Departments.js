import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import api from 'src/services/api'
import { useCrud } from 'src/hooks/useCrud'

export default function Departments() {
  const [employees, setEmployees] = useState([])

  const crud = useCrud({
    list:   () => api.getDepartments(),
    create: (d) => api.createDepartment(d),
    update: (id, d) => api.updateDepartment(id, d),
    remove: (id) => api.deleteDepartment(id),
    toForm: (r) => ({ name: r.name, location: r.location || '', manager_id: r.manager_id || undefined }),
  })

  useEffect(() => {
    api.getEmployees({ limit: 500 }).then(r => setEmployees(r.data || [])).catch(() => {})
  }, [])

  const cols = [
    { title: '#', width: 60, render: (_, __, i) => i + 1 },
    { title: 'Нэр', dataIndex: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Байрлал', dataIndex: 'location', render: v => v || '—' },
    { title: 'Менежер', dataIndex: 'manager_name', render: v => v || '—' },
    { title: 'Үйлдэл', width: 120, render: (_, r) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => crud.openEdit(r)} />
        <Popconfirm title="Хэлтсийг устгах уу?" onConfirm={() => crud.destroy(r.id)} okText="Тийм" cancelText="Үгүй">
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Хэлтсүүд</h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => crud.openCreate()}>Нэмэх</Button>
      </div>
      <Card>
        <Table {...crud.tableProps} size="middle" columns={cols}
          locale={{ emptyText: 'Хэлтэс алга' }} />
      </Card>

      <Modal {...crud.modalProps} title={crud.editing ? 'Хэлтэс засах' : 'Хэлтэс нэмэх'}>
        <Form {...crud.formProps} requiredMark={false}>
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
