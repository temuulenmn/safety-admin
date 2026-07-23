import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import routes from '../routes'

const AppContent = () => (
  <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>}>
    <Routes>
      {routes.map((route, idx) =>
        route.element && (
          <Route key={idx} path={route.path} exact={route.exact}
            name={route.name} element={<route.element />} />
        )
      )}
      <Route path="/" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </Suspense>
)

export default React.memo(AppContent)
