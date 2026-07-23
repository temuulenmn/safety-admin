import React, { useState } from 'react'
import { Layout, Drawer, Affix } from 'antd'
import { useLocation } from 'react-router-dom'
import Sidenav from './Sidenav'
import Header from './Header'
import Footer from './Footer'

const { Header: AntHeader, Content, Sider } = Layout

// Muse-style dashboard shell: fixed sider, sticky header, content area.
// Drawer for mobile — opens via Header's hamburger button.
export default function Main({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidenavColor] = useState('#5856d6')
  const { pathname } = useLocation()

  return (
    <Layout className={`layout-dashboard ${pathname === '/profile' ? 'layout-profile' : ''}`}>
      {/* Mobile drawer */}
      <Drawer
        title={false}
        placement="left"
        closable={false}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={250}
        className="drawer-sidebar"
      >
        <Layout className="layout-dashboard">
          <Sider trigger={null} width={250} theme="light" className="sider-primary ant-layout-sider-primary">
            <Sidenav color={sidenavColor} />
          </Sider>
        </Layout>
      </Drawer>

      {/* Desktop sider */}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        trigger={null}
        width={250}
        theme="light"
        className="sider-primary ant-layout-sider-primary"
        style={{ background: 'transparent' }}
      >
        <Sidenav color={sidenavColor} />
      </Sider>

      <Layout>
        <Affix>
          <AntHeader className="ant-header-fixed">
            <Header onOpenDrawer={() => setDrawerOpen(true)} />
          </AntHeader>
        </Affix>
        <Content className="content-ant">{children}</Content>
        <Footer />
      </Layout>
    </Layout>
  )
}
