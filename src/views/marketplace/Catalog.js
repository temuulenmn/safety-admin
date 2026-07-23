import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Tag, Button, Modal, Form, Input, Select, InputNumber,
  Table, Space, Empty, Spin, Result, Badge, message,
} from 'antd'
import { ShoppingCartOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import api from 'src/services/api'

const fmtMNT = (n) => Number(n || 0).toLocaleString('mn-MN') + '₮'

export default function Catalog() {
  const [items,    setItems]    = useState([])
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState()
  const [cart,     setCart]     = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [note,     setNote]     = useState('')
  const [placing,  setPlacing]  = useState(false)
  const [success,  setSuccess]  = useState(null)
  const [picking,  setPicking]  = useState(null)

  const load = () => {
    setLoading(true)
    api.getMarketCatalog({ search: search || undefined, category: category || undefined, limit: 100 })
      .then(r => setItems(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [category])
  useEffect(() => { api.getMarketCategories().then(r => setCats(r.data || [])) }, [])

  const addToCart = (item, size, quantity) => {
    setCart(c => [...c, { item, size, quantity: Number(quantity) || 1 }])
    setPicking(null)
  }
  const removeCart = (i) => setCart(c => c.filter((_, idx) => idx !== i))

  const total = cart.reduce((s, l) => s + Number(l.item.unit_price) * l.quantity, 0)

  const placeOrder = async () => {
    if (!cart.length) return
    setPlacing(true)
    try {
      const r = await api.createMarketOrder({
        items: cart.map(l => ({ item_id: l.item.id, size: l.size, quantity: l.quantity })),
        note: note || null,
      })
      setSuccess(r.data)
      setCart([]); setNote(''); setCartOpen(false)
    } finally { setPlacing(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Барааны каталог</h4>
        <Badge count={cart.length}>
          <Button type="primary" icon={<ShoppingCartOutlined />}
            onClick={() => setCartOpen(true)} disabled={!cart.length}>Сагс</Button>
        </Badge>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={10}>
            <Input.Search placeholder="Хайх..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={load}
              allowClear enterButton />
          </Col>
          <Col xs={24} sm={6}>
            <Select value={category} onChange={setCategory} allowClear
              placeholder="Бүх ангилал" style={{ width: '100%' }}
              options={cats.map(c => ({ value: c, label: c }))} />
          </Col>
        </Row>
      </Card>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> : (
        items.length === 0 ? <Empty description="Бараа алга" style={{ padding: 60 }} /> : (
          <Row gutter={[16, 16]}>
            {items.map(it => (
              <Col key={it.id} xs={24} sm={12} md={8} lg={6}>
                <Card hoverable style={{ height: '100%' }}
                  cover={
                    <div style={{
                      height: 160,
                      background: it.image_url ? `url(${it.image_url}) center/cover no-repeat` : '#f0f0f0',
                    }} />
                  }
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 160px)' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{it.category || '—'}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{it.name}</div>
                  <div style={{
                    color: '#8c8c8c', fontSize: 12, marginBottom: 8,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{it.description}</div>
                  <div style={{
                    marginTop: 'auto',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#1890ff' }}>{fmtMNT(it.unit_price)}</span>
                    <Tag color={it.in_stock > 0 ? 'success' : 'default'}>
                      {it.in_stock > 0 ? `${it.in_stock} ш` : 'Дууссан'}
                    </Tag>
                  </div>
                  <Button size="small" type="primary" icon={<PlusOutlined />}
                    style={{ marginTop: 8 }}
                    disabled={it.in_stock <= 0} onClick={() => setPicking(it)}>
                    Сагсанд
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )
      )}

      <Modal open={!!picking} onCancel={() => setPicking(null)}
        title={picking?.name} footer={null} destroyOnClose>
        {picking && <AddToCartForm item={picking} onAdd={addToCart} onCancel={() => setPicking(null)} />}
      </Modal>

      <Modal open={cartOpen} onCancel={() => setCartOpen(false)} width={720}
        title="Захиалгын сагс"
        footer={
          <Space>
            <Button onClick={() => setCartOpen(false)}>Хаах</Button>
            <Button type="primary" onClick={placeOrder} loading={placing} disabled={!cart.length}>
              Захиалга өгөх
            </Button>
          </Space>
        }>
        {cart.length === 0 ? <Empty description="Сагс хоосон" /> : (
          <>
            <Table rowKey={(_, i) => i} size="small" pagination={false}
              columns={[
                { title: 'Бараа', render: (_, l) => l.item.name },
                { title: 'Хэмжээ', render: (_, l) => l.size || '—' },
                { title: 'Тоо', align: 'right', dataIndex: 'quantity' },
                { title: 'Үнэ', align: 'right', render: (_, l) => fmtMNT(l.item.unit_price) },
                { title: 'Дүн', align: 'right',
                  render: (_, l) => <strong>{fmtMNT(Number(l.item.unit_price) * l.quantity)}</strong> },
                { title: '', width: 50, render: (_, __, i) => (
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeCart(i)} />
                ) },
              ]}
              dataSource={cart}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right"><strong>Нийт</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong style={{ fontSize: 16 }}>{fmtMNT(total)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                </Table.Summary.Row>
              )} />
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 4 }}>Тэмдэглэл</div>
              <Input.TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!success} onCancel={() => setSuccess(null)}
        footer={<Button type="primary" onClick={() => setSuccess(null)}>Ок</Button>}>
        <Result status="success" title="Захиалга илгээгдлээ" subTitle={
          <>
            <div>Захиалгын дугаар: <code>{success?.order_number}</code></div>
            <div>Нийт дүн: <strong>{fmtMNT(success?.total_amount)}</strong></div>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
              Системийн админы баталгаажуулалтыг хүлээж байна.
            </div>
          </>
        } />
      </Modal>
    </div>
  )
}

function AddToCartForm({ item, onAdd, onCancel }) {
  const [size, setSize] = useState((item.sizes || [])[0])
  const [qty,  setQty]  = useState(1)
  return (
    <Form layout="vertical" requiredMark={false}>
      <Row gutter={12}>
        {(item.sizes || []).length > 0 && (
          <Col span={12}>
            <Form.Item label="Хэмжээ">
              <Select value={size} onChange={setSize}
                options={(item.sizes || []).map(s => ({ value: s, label: s }))} />
            </Form.Item>
          </Col>
        )}
        <Col span={12}>
          <Form.Item label="Тоо ширхэг">
            <InputNumber value={qty} onChange={setQty} min={1} max={item.in_stock} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <div style={{ color: '#8c8c8c', fontSize: 12 }}>Нэгж үнэ: {fmtMNT(item.unit_price)}</div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Дүн: {fmtMNT(Number(item.unit_price) * (Number(qty) || 0))}</div>
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Space>
          <Button onClick={onCancel}>Болих</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onAdd(item, size, qty)}>Нэмэх</Button>
        </Space>
      </div>
    </Form>
  )
}
