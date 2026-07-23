import React from 'react'
import { Layout, Row, Col } from 'antd'

const { Footer: AntFooter } = Layout

export default function Footer() {
  return (
    <AntFooter style={{ background: '#fafafa' }}>
      <Row className="just" align="middle">
        <Col xs={24} md={12} lg={12}>
          <div className="copyright">
            © {new Date().getFullYear()} <a href="#">Safety System</a> — Барилгын аюулгүй ажиллагааны удирдлагын систем
          </div>
        </Col>
      </Row>
    </AntFooter>
  )
}
