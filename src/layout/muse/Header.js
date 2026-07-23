import React, { useEffect, useState } from 'react'
import { Row, Col, Breadcrumb, Button, Dropdown, Select } from 'antd'
import { MenuOutlined, UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import api from 'src/services/api'

// Map path → visible title + section (breadcrumb parent).
const TITLES = {
  '/dashboard': 'Хянах самбар',
  '/projects': 'Төсөл / Объект',
  '/kpi': 'KPI',
  '/employees': 'Ажилтнууд',
  '/departments': 'Хэлтсүүд',
  '/attendance': 'Ирц',
  '/schedules': 'Ажлын хуваарь',
  '/payroll': 'Цалин',
  '/rfid': 'RFID',
  '/ppe': 'Хамгаалах хэрэгсэл',
  '/training': 'Аюулгүйн сургалт',
  '/clothing': 'Хувцас захиалга',
  '/site-access': 'Хандалтын дүрэм',
  '/danger-zones': 'Аюултай бүс',
  '/morning-inspection': 'Өглөөний шалгалт',
  '/documents': 'Норм дүрэм / Заавар',
  '/materials': 'Материалын тооцоо',
  '/tools': 'Багаж хэрэгсэл',
  '/violations': 'Зөрчил / Торгууль',
  '/penalty-fund': 'Торгуулийн сан',
  '/brigades': 'Бригадууд',
  '/brigade-contracts': 'Бригадын гэрээ',
  '/marketplace': 'Барааны каталог',
  '/marketplace/orders': 'Миний захиалгууд',
}
const sectionFor = (p) => {
  if (p.startsWith('/brigade')) return 'Бригад'
  if (p.startsWith('/marketplace')) return 'Маркетплейс'
  if (['/employees','/departments','/attendance','/schedules','/payroll'].some(x=>p.startsWith(x))) return 'Хүний нөөц'
  if (p.startsWith('/projects') || p.startsWith('/kpi') || p.startsWith('/dashboard')) return 'Ерөнхий'
  return 'Аюулгүй байдал'
}

export default function Header({ onOpenDrawer }) {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const dispatch = useDispatch()
  const currentProjectId = useSelector(s => s.currentProjectId)
  const [projects, setProjects] = useState([])
  const [me, setMe] = useState(null)

  useEffect(() => {
    api.getProjects().then(r => setProjects(r.data || [])).catch(() => {})
    api.me().then(r => setMe(r.data)).catch(() => {})
  }, [])

  const title = TITLES[pathname] || 'Хуудас'
  const section = sectionFor(pathname)

  const logout = () => {
    dispatch({ type: 'logout' })
    nav('/login', { replace: true })
  }

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: me ? `${me.first_name || ''} ${me.last_name || ''}`.trim() || me.username : 'Профайл', disabled: true },
      { type: 'divider' },
      { key: 'logout',  icon: <LogoutOutlined />, label: 'Гарах', onClick: logout },
    ],
  }

  return (
    <>
      <Row gutter={[24, 0]} align="middle" style={{ width: '100%' }}>
        <Col xs={24} md={12}>
          <div className="ant-page-header-heading">
            <Breadcrumb style={{ marginBottom: 4 }}>
              <Breadcrumb.Item>{section}</Breadcrumb.Item>
              <Breadcrumb.Item>{title}</Breadcrumb.Item>
            </Breadcrumb>
            <span className="ant-page-header-heading-title" style={{ fontWeight: 700, fontSize: 20 }}>{title}</span>
          </div>
        </Col>
        <Col xs={24} md={12} className="header-control" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <Select
            size="middle"
            style={{ minWidth: 220 }}
            value={currentProjectId || ''}
            onChange={(v) => dispatch({ type: 'setProject', currentProjectId: v })}
            options={[
              { value: '', label: '🏢 Бүх төсөл' },
              ...projects.map(p => ({ value: String(p.id), label: `📍 ${p.name}` })),
            ]}
          />
          <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" icon={<UserOutlined style={{ fontSize: 18 }} />}>
              {me?.username || 'Хэрэглэгч'}
            </Button>
          </Dropdown>
          <Button type="text" className="sidebar-toggler d-md-none" onClick={onOpenDrawer}
            icon={<MenuOutlined style={{ fontSize: 18 }} />} />
        </Col>
      </Row>
    </>
  )
}
