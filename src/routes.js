import React from 'react'

const Dashboard    = React.lazy(() => import('./views/dashboard/Dashboard'))
const Employees    = React.lazy(() => import('./views/safety/Employees'))
const Departments  = React.lazy(() => import('./views/safety/Departments'))
const Attendance   = React.lazy(() => import('./views/safety/Attendance'))
const Schedules    = React.lazy(() => import('./views/safety/Schedules'))
const Payroll      = React.lazy(() => import('./views/safety/Payroll'))
const Rfid         = React.lazy(() => import('./views/safety/Rfid'))
const Ppe          = React.lazy(() => import('./views/safety/Ppe'))
const Training     = React.lazy(() => import('./views/safety/Training'))
const Clothing       = React.lazy(() => import('./views/safety/Clothing'))
const SiteAccess     = React.lazy(() => import('./views/safety/SiteAccess'))
const Tools          = React.lazy(() => import('./views/safety/Tools'))
const Violations     = React.lazy(() => import('./views/safety/Violations'))
const PenaltyFund    = React.lazy(() => import('./views/safety/PenaltyFund'))
const MarketCatalog  = React.lazy(() => import('./views/marketplace/Catalog'))
const MarketOrders   = React.lazy(() => import('./views/marketplace/Orders'))

const routes = [
  { path: '/',             exact: true, name: 'Нүүр' },
  { path: '/dashboard',    name: 'Хянах самбар',      element: Dashboard },
  { path: '/employees',    name: 'Ажилтнууд',         element: Employees },
  { path: '/departments',  name: 'Хэлтсүүд',         element: Departments },
  { path: '/attendance',   name: 'Ирц',               element: Attendance },
  { path: '/schedules',    name: 'Ажлын хуваарь',     element: Schedules },
  { path: '/payroll',      name: 'Цалин',             element: Payroll },
  { path: '/rfid',         name: 'RFID',              element: Rfid },
  { path: '/ppe',          name: 'Хамгаалах хэрэгсэл', element: Ppe },
  { path: '/training',     name: 'Аюулгүйн сургалт', element: Training },
  { path: '/clothing',     name: 'Хувцас захиалга',   element: Clothing },
  { path: '/site-access',  name: 'Хандалтын дүрэм',  element: SiteAccess },
  { path: '/tools',        name: 'Багаж хэрэгсэл',   element: Tools },
  { path: '/violations',   name: 'Зөрчил/Торгууль',  element: Violations },
  { path: '/penalty-fund', name: 'Торгуулийн сан',   element: PenaltyFund },
  { path: '/marketplace',         name: 'Барааны каталог',   element: MarketCatalog },
  { path: '/marketplace/orders',  name: 'Миний захиалгууд',  element: MarketOrders },
]

export default routes
