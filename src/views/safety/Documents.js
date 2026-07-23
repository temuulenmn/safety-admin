import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Tag, Button, Modal, Input, Select, Space, Empty, Spin,
  Radio,
} from 'antd'
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons'
import api from 'src/services/api'

const CATEGORIES = [
  { key: '',            label: 'Бүгд' },
  { key: 'norm',        label: 'Норм' },
  { key: 'regulation',  label: 'Дүрэм/Хууль' },
  { key: 'instruction', label: 'Зааварчилгаа' },
]
const CAT_COLOR = { norm: 'blue', regulation: 'orange', instruction: 'cyan' }
const CAT_LABEL = { norm: 'Норм', regulation: 'Дүрэм', instruction: 'Зааварчилгаа' }

export default function Documents() {
  const [docs,      setDocs]      = useState([])
  const [workTypes, setWorkTypes] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [category,  setCategory]  = useState('')
  const [workType,  setWorkType]  = useState()
  const [search,    setSearch]    = useState('')
  const [detail,    setDetail]    = useState(null)

  const load = () => {
    setLoading(true)
    api.getDocuments({
      category: category || undefined, work_type: workType || undefined,
      search: search || undefined, limit: 200,
    }).then(r => setDocs(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(load, [category, workType])
  useEffect(() => { api.getDocWorkTypes().then(r => setWorkTypes(r.data || [])) }, [])

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Норм дүрэм ба зааварчилгааны сан</h4>

      <Card style={{ marginBottom: 16 }}>
        <Radio.Group value={category} onChange={e => setCategory(e.target.value)}
          buttonStyle="solid" style={{ marginBottom: 12 }}>
          {CATEGORIES.map(c => (
            <Radio.Button key={c.key} value={c.key}>{c.label}</Radio.Button>
          ))}
        </Radio.Group>
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search placeholder="Хайх — нэр, дугаар..." value={search}
              onChange={e => setSearch(e.target.value)} onSearch={load}
              enterButton allowClear />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select value={workType} onChange={setWorkType} allowClear
              placeholder="Бүх ажлын төрөл" style={{ width: '100%' }}
              options={workTypes.map(w => ({ value: w, label: w }))} />
          </Col>
        </Row>
      </Card>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> : (
        docs.length === 0 ? <Empty description="Баримт олдсонгүй" style={{ padding: 60 }} /> : (
          <Row gutter={[16, 16]}>
            {docs.map(d => (
              <Col key={d.id} xs={24} sm={12} lg={8}>
                <Card hoverable style={{ height: '100%' }} onClick={() => setDetail(d)}>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Tag color={CAT_COLOR[d.category]}>{CAT_LABEL[d.category]}</Tag>
                      {d.work_type && <Tag>{d.work_type}</Tag>}
                    </Space>
                  </div>
                  <h6 style={{ fontWeight: 600 }}>{d.title}</h6>
                  {d.doc_number && <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>📋 {d.doc_number}</div>}
                  <p style={{
                    color: '#8c8c8c', fontSize: 13, marginBottom: 12,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{d.description}</p>
                  <Button size="small" type="link" style={{ padding: 0 }}>Дэлгэрэнгүй →</Button>
                </Card>
              </Col>
            ))}
          </Row>
        )
      )}

      <Modal open={!!detail} onCancel={() => setDetail(null)} title={detail?.title}
        width={720} footer={<Button onClick={() => setDetail(null)}>Хаах</Button>}>
        {detail && (
          <>
            <Space wrap style={{ marginBottom: 12 }}>
              <Tag color={CAT_COLOR[detail.category]}>{CAT_LABEL[detail.category]}</Tag>
              {detail.work_type && <Tag>{detail.work_type}</Tag>}
              {detail.doc_number && <Tag>{detail.doc_number}</Tag>}
            </Space>
            {detail.description && <p style={{ color: '#595959' }}>{detail.description}</p>}
            {detail.content && (
              <div style={{
                border: '1px solid #f0f0f0', borderRadius: 6, padding: 12,
                background: '#fafafa', whiteSpace: 'pre-wrap',
              }}>{detail.content}</div>
            )}
            {detail.file_url && (
              <div style={{ marginTop: 12 }}>
                <Button type="primary" icon={<FileTextOutlined />}
                  href={detail.file_url} target="_blank" rel="noopener">
                  Файл нээх / татах
                </Button>
              </div>
            )}
            {!detail.content && !detail.file_url && (
              <div style={{ color: '#8c8c8c' }}>Дэлгэрэнгүй агуулга оруулаагүй байна.</div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
