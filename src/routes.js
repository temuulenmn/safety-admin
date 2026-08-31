import React from 'react'

const Dashboard    = React.lazy(() => import('./views/dashboard/Dashboard'))
const Employees    = React.lazy(() => import('./views/safety/Employees'))
const Departments  = React.lazy(() => import('./views/safety/Departments'))
const Attendance   = React.lazy(() => import('./views/safety/Attendance'))
const Schedules    = React.lazy(() => import('./views/safety/Schedules'))
const Payroll      = React.lazy(() => import('./views/safety/Payroll'))
const Rfid         = React.lazy(() => import('./views/safety/Rfid'))
const Ppe          = React.lazy(() => import('./views/safety/Ppe'))
const WorkerClothing = React.lazy(() => import('./views/safety/WorkerClothing'))
const Users        = React.lazy(() => import('./views/safety/Users'))
const Billing      = React.lazy(() => import('./views/safety/Billing'))
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
const Insurance      = React.lazy(() => import('./views/safety/Insurance'))
const Accidents      = React.lazy(() => import('./views/safety/Accidents'))
const HealthChecks   = React.lazy(() => import('./views/safety/HealthChecks'))
const OshCommittee   = React.lazy(() => import('./views/safety/OshCommittee'))
const Chemicals      = React.lazy(() => import('./views/safety/Chemicals'))
const FireSafety     = React.lazy(() => import('./views/safety/FireSafety'))
const RiskAssessments = React.lazy(() => import('./views/safety/RiskAssessments'))
const DetoxRations   = React.lazy(() => import('./views/safety/DetoxRations'))
const ToolInspections = React.lazy(() => import('./views/safety/ToolInspections'))
const OshBudget      = React.lazy(() => import('./views/safety/OshBudget'))
const TrainingCompliance = React.lazy(() => import('./views/safety/TrainingCompliance'))
const Notifications  = React.lazy(() => import('./views/safety/Notifications'))

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
  { path: '/worker-clothing', name: 'Ажлын хувцасны RFID', element: WorkerClothing },
  { path: '/users',        name: 'Хэрэглэгчид',        element: Users },
  { path: '/billing',      name: 'Захиалга, төлбөр',   element: Billing },
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
  { path: '/insurance',           name: 'Даатгал',            element: Insurance },
  { path: '/accidents',           name: 'Үйлдвэрлэлийн осол', element: Accidents },
  { path: '/health-checks',       name: 'Эрүүл мэндийн үзлэг', element: HealthChecks },
  { path: '/osh-committee',       name: 'Аюулгүйн зөвлөл',    element: OshCommittee },
  { path: '/chemicals',           name: 'Химийн бодис',        element: Chemicals },
  { path: '/fire-safety',         name: 'Галын аюулгүй байдал', element: FireSafety },
  { path: '/risk-assessments',    name: 'Эрсдэлийн үнэлгээ',   element: RiskAssessments },
  { path: '/detox-rations',       name: 'Хор саармагжуулах',   element: DetoxRations },
  { path: '/tool-inspections',    name: 'Багажийн шалгалт',    element: ToolInspections },
  { path: '/osh-budget',          name: '1.5% төсөв',           element: OshBudget },
  { path: '/training-compliance', name: 'Сургалтын нийцэл',   element: TrainingCompliance },
  { path: '/notifications',       name: 'Мэдэгдэл',              element: Notifications },
]

export default routes
