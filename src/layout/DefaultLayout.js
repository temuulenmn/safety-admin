import React from 'react'
import Main from './muse/Main'
import AppContent from '../components/AppContent'
import InstallPwaButton from '../components/InstallPwaButton'

// Muse (antd) shell wrapping the existing route content. Individual page
// components can stay CoreUI while we convert them one at a time — they
// render inside the antd <Content> without breaking.
const DefaultLayout = () => (
  <Main>
    <AppContent />
    <InstallPwaButton />
  </Main>
)

export default DefaultLayout
