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
const Brigades       = React.lazy(() => import('./views/safety/Brigades'))
const BrigadeContracts = React.lazy(() => import('./views/safety/BrigadeContracts'))
const DangerZones    = React.lazy(() => import('./views/safety/DangerZones'))
const MorningInspection = React.lazy(() => import('./views/safety/MorningInspection'))
const Documents      = React.lazy(() => import('./views/safety/Documents'))
const MarketCatalog  = React.lazy(() => import('./views/marketplace/Catalog'))
const MarketOrders   = React.lazy(() => import('./views/marketplace/Orders'))
const Materials      = React.lazy(() => import('./views/safety/Materials'))
const Kpi            = React.lazy(() => import('./views/safety/Kpi'))
const Projects       = React.lazy(() => import('./views/safety/Projects'))
const ProjectOverview = React.lazy(() => import('./views/safety/ProjectOverview'))

const routes = [
  { path: '/',             exact: true, name: 'Нүүр' },
  { path: '/dashboard',    name: 'Хянах самбар',      element: Dashboard },
  { path: '/projects',     name: 'Төсөл / Объект',    element: Projects },
  { path: '/projects/:id', name: 'Төслийн дэлгэрэнгүй', element: ProjectOverview },
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
  { path: '/brigades',          name: 'Бригадууд',        element: Brigades },
  { path: '/brigade-contracts', name: 'Бригадын гэрээ',   element: BrigadeContracts },
  { path: '/danger-zones',      name: 'Аюултай бүс',      element: DangerZones },
  { path: '/morning-inspection',name: 'Өглөөний шалгалт', element: MorningInspection },
  { path: '/documents',         name: 'Норм дүрэм',       element: Documents },
  { path: '/materials',         name: 'Материалын тооцоо', element: Materials },
  { path: '/kpi',               name: 'KPI',              element: Kpi },
  { path: '/marketplace',         name: 'Барааны каталог',   element: MarketCatalog },
  { path: '/marketplace/orders',  name: 'Миний захиалгууд',  element: MarketOrders },
]

export default routes
