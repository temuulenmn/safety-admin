import React, { useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CBadge, CSpinner, CRow, CCol,
  CFormInput, CFormSelect, CFormLabel, CFormTextarea,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CForm,
} from '@coreui/react'
import api from 'src/services/api'

const fmtMNT = (n) => Number(n||0).toLocaleString('mn-MN') + '₮'

export default function Catalog() {
  const [items,     setItems]     = useState([])
  const [cats,      setCats]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('')
  const [cart,      setCart]      = useState([]) // [{item, size, quantity}]
  const [cartOpen,  setCartOpen]  = useState(false)
  const [note,      setNote]      = useState('')
  const [placing,   setPlacing]   = useState(false)
  const [success,   setSuccess]   = useState(null)
  const [picking,   setPicking]   = useState(null) // item being added to cart

  const load = () => {
    setLoading(true)
    api.getMarketCatalog({ search: search || undefined, category: category || undefined, limit: 100 })
      .then(r => setItems(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [category])
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
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Барааны каталог</h4>
        <CButton color="primary" onClick={() => setCartOpen(true)} disabled={!cart.length}>
          🛒 Сагс ({cart.length})
        </CButton>
      </div>

      <CCard className="mb-3">
        <CCardBody>
          <CRow className="g-2">
            <CCol sm={4}>
              <CFormInput placeholder="Хайх..." value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()} />
            </CCol>
            <CCol sm={3}>
              <CFormSelect value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Бүх ангилал</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </CFormSelect>
            </CCol>
            <CCol sm={2}><CButton color="secondary" variant="outline" onClick={load}>Хайх</CButton></CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? <div className="py-4 text-center"><CSpinner /></div> : (
        <CRow className="g-3">
          {items.map(it => (
            <CCol key={it.id} sm={6} md={4} lg={3}>
              <CCard className="h-100">
                <div style={{
                  height: 160, background: it.image_url
                    ? `url(${it.image_url}) center/cover no-repeat`
                    : '#e9ecef',
                }} />
                <CCardBody className="d-flex flex-column">
                  <div className="text-medium-emphasis small">{it.category||'—'}</div>
                  <div className="fw-semibold mb-1">{it.name}</div>
                  <div className="small text-medium-emphasis mb-2" style={{
                    display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'
                  }}>{it.description}</div>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="fw-bold fs-5 text-primary">{fmtMNT(it.unit_price)}</span>
                    <CBadge color={it.in_stock > 0 ? 'success' : 'secondary'}>
                      {it.in_stock > 0 ? `${it.in_stock} ш` : 'Дууссан'}
                    </CBadge>
                  </div>
                  <CButton size="sm" color="primary" className="mt-2"
                    disabled={it.in_stock <= 0} onClick={() => setPicking(it)}>
                    + Сагсанд
                  </CButton>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
          {items.length === 0 && (
            <CCol xs={12} className="text-center text-medium-emphasis py-5">
              Бараа алга
            </CCol>
          )}
        </CRow>
      )}

      {/* Add to cart modal */}
      <CModal visible={!!picking} onClose={() => setPicking(null)}>
        <CModalHeader><CModalTitle>{picking?.name}</CModalTitle></CModalHeader>
        <CModalBody>
          {picking && <AddToCartForm item={picking} onAdd={addToCart} onCancel={() => setPicking(null)} />}
        </CModalBody>
      </CModal>

      {/* Cart modal */}
      <CModal visible={cartOpen} onClose={() => setCartOpen(false)} size="lg">
        <CModalHeader><CModalTitle>Захиалгын сагс</CModalTitle></CModalHeader>
        <CModalBody>
          {cart.length === 0 ? (
            <div className="text-center text-medium-emphasis py-3">Сагс хоосон</div>
          ) : (
            <>
              <CTable small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Бараа</CTableHeaderCell>
                    <CTableHeaderCell>Хэмжээ</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Тоо</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Үнэ</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Дүн</CTableHeaderCell>
                    <CTableHeaderCell></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {cart.map((l, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell>{l.item.name}</CTableDataCell>
                      <CTableDataCell>{l.size||'—'}</CTableDataCell>
                      <CTableDataCell className="text-end">{l.quantity}</CTableDataCell>
                      <CTableDataCell className="text-end">{fmtMNT(l.item.unit_price)}</CTableDataCell>
                      <CTableDataCell className="text-end fw-semibold">
                        {fmtMNT(Number(l.item.unit_price) * l.quantity)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton size="sm" color="danger" variant="outline" onClick={() => removeCart(i)}>X</CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  <CTableRow>
                    <CTableDataCell colSpan={4} className="text-end fw-bold">Нийт</CTableDataCell>
                    <CTableDataCell className="text-end fw-bold fs-5">{fmtMNT(total)}</CTableDataCell>
                    <CTableDataCell></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
              <CForm className="mt-2">
                <CFormLabel>Тэмдэглэл</CFormLabel>
                <CFormTextarea rows={2} value={note} onChange={e => setNote(e.target.value)} />
              </CForm>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCartOpen(false)}>Хаах</CButton>
          <CButton color="primary" onClick={placeOrder} disabled={!cart.length || placing}>
            {placing ? <CSpinner size="sm" /> : 'Захиалга өгөх'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Success modal */}
      <CModal visible={!!success} onClose={() => setSuccess(null)}>
        <CModalHeader><CModalTitle>Захиалга илгээгдлээ ✓</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Захиалгын дугаар: <code>{success?.order_number}</code></p>
          <p>Нийт дүн: <strong>{fmtMNT(success?.total_amount)}</strong></p>
          <p className="text-medium-emphasis small mb-0">Системийн админы баталгаажуулалтыг хүлээж байна.</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={() => setSuccess(null)}>Ок</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

function AddToCartForm({ item, onAdd, onCancel }) {
  const [size, setSize] = useState((item.sizes||[])[0] || '')
  const [qty,  setQty]  = useState(1)
  return (
    <>
      <CRow className="g-3">
        {(item.sizes||[]).length > 0 && (
          <CCol sm={6}>
            <CFormLabel>Хэмжээ</CFormLabel>
            <CFormSelect value={size} onChange={e => setSize(e.target.value)}>
              {(item.sizes||[]).map(s => <option key={s} value={s}>{s}</option>)}
            </CFormSelect>
          </CCol>
        )}
        <CCol sm={6}>
          <CFormLabel>Тоо ширхэг</CFormLabel>
          <CFormInput type="number" min={1} max={item.in_stock} value={qty}
            onChange={e => setQty(e.target.value)} />
        </CCol>
        <CCol sm={12}>
          <div className="text-medium-emphasis small">Нэгж үнэ: {fmtMNT(item.unit_price)}</div>
          <div className="fw-bold fs-5">Дүн: {fmtMNT(Number(item.unit_price) * (Number(qty)||0))}</div>
        </CCol>
      </CRow>
      <div className="text-end mt-3">
        <CButton color="secondary" className="me-2" onClick={onCancel}>Болих</CButton>
        <CButton color="primary" onClick={() => onAdd(item, size, qty)}>+ Нэмэх</CButton>
      </div>
    </>
  )
}
