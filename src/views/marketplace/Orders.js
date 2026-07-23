import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Table, Tag, Button, Modal, Select, Space, Descriptions,
  Alert, Popconfirm, message,
} from 'antd'
import api from 'src/services/api'
import dayjs from 'dayjs'

const STATUS_COLOR = { pending: 'orange', approved: 'cyan', shipped: 'blue', delivered: 'success', cancelled: 'default' }
const STATUS_LABEL = { pending: 'Хүлээгдэж буй', approved: 'Батлагдсан', shipped: 'Илгээгдсэн', delivered: 'Хүргэгдсэн', cancelled: 'Цуцлагдсан' }
const fmtMNT = (n) => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function Orders() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState()
  const [detail,  setDetail]  = useState(null)
  const [acting,  setActing]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getMarketOrders({ status: status || undefined, limit: 200 })
      .then(r => setRows(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [status])

  const openDetail = (id) => api.getMarketOrder(id).then(r => setDetail(r.data))

  const cancel = async (id) => {
    setActing(id)
    try {
      await api.cancelMarketOrder(id); load()
      if (detail?.id === id) openDetail(id)
      message.success('Цуцлагдлаа')
    } finally { setActing(null) }
  }

  const cols = [
    { title: '№', dataIndex: 'order_number', render: v => <code>{v}</code> },
    { title: 'Бараа', dataIndex: 'item_count' },
    { title: 'Дүн', dataIndex: 'total_amount', render: v => <strong>{fmtMNT(v)}</strong> },
    { title: 'Огноо', dataIndex: 'ordered_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag> },
    { title: '', width: 100, render: (_, r) => (
      r.status === 'pending' && (
        <Popconfirm title="Цуцлах уу?" onConfirm={(e) => { e.stopPropagation(); cancel(r.id) }}
          onCancel={e => e.stopPropagation()} okText="Тийм" cancelText="Үгүй">
          <Button size="small" danger loading={acting === r.id} onClick={e => e.stopPropagation()}>Цуцлах</Button>
        </Popconfirm>
      )
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Миний захиалгууд</h4>
        <Select value={status} onChange={setStatus} allowClear
          placeholder="Бүх төлөв" style={{ width: 220 }}
          options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
      </div>

      <Card>
        <Table rowKey="id" size="middle" loading={loading}
          columns={cols} dataSource={rows}
          pagination={{ pageSize: 20 }} locale={{ emptyText: 'Захиалга алга' }}
          onRow={(r) => ({ onClick: () => openDetail(r.id), style: { cursor: 'pointer' } })} />
      </Card>

      <Modal open={!!detail} onCancel={() => setDetail(null)} width={720}
        title={detail && `Захиалга #${detail.order_number}`}
        footer={
          <Space>
            {detail?.status === 'pending' && (
              <Popconfirm title="Захиалга цуцлах уу?" onConfirm={() => cancel(detail.id)} okText="Тийм" cancelText="Үгүй">
                <Button danger>Захиалга цуцлах</Button>
              </Popconfirm>
            )}
            <Button onClick={() => setDetail(null)}>Хаах</Button>
          </Space>
        }>
        {detail && (
          <>
            <Row style={{ marginBottom: 12 }}>
              <Col span={16}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>Захиалсан</div>
                <div>{detail.ordered_by_name} | {dayjs(detail.ordered_at).format('YYYY-MM-DD HH:mm')}</div>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Tag color={STATUS_COLOR[detail.status]} style={{ fontSize: 14, padding: '4px 10px' }}>
                  {STATUS_LABEL[detail.status]}
                </Tag>
              </Col>
            </Row>
            {detail.note && (
              <Alert type="info" style={{ marginBottom: 12 }}
                message="Тэмдэглэл" description={detail.note} />
            )}
            <Table rowKey="id" size="small" pagination={false} bordered
              columns={[
                { title: 'Бараа', dataIndex: 'item_name' },
                { title: 'Хэмжээ', dataIndex: 'size', render: v => v || '—' },
                { title: 'Тоо', dataIndex: 'quantity', align: 'right' },
                { title: 'Үнэ', dataIndex: 'unit_price', align: 'right', render: v => fmtMNT(v) },
                { title: 'Дүн', dataIndex: 'subtotal', align: 'right',
                  render: v => <strong>{fmtMNT(v)}</strong> },
              ]}
              dataSource={detail.items || []}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right"><strong>Нийт дүн</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong style={{ fontSize: 16 }}>{fmtMNT(detail.total_amount)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )} />
          </>
        )}
      </Modal>
    </div>
  )
}
