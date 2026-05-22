import React from 'react'
import { CNavItem } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { CNavTitle } from '@coreui/react'
import {
  cilSpeedometer, cilPeople, cilBuilding, cilClock, cilCalendar,
  cilMoney, cilBadge, cilShieldAlt, cilEducation, cilLayers, cilLockLocked,
  cilCart, cilList, cilHandPointUp, cilWarning, cilBank,
  cilGroup, cilFile, cilBurn, cilCheckCircle, cilBook,
  cilCalculator, cilChartPie, cilLocationPin,
} from '@coreui/icons'

const _nav = [
  {
    component: CNavItem,
    name: 'Хянах самбар',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Төсөл / Объект',
    to: '/projects',
    icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'KPI',
    to: '/kpi',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Ажилтнууд',
    to: '/employees',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Хэлтсүүд',
    to: '/departments',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Ирц',
    to: '/attendance',
    icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Ажлын хуваарь',
    to: '/schedules',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Цалин',
    to: '/payroll',
    icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'RFID',
    to: '/rfid',
    icon: <CIcon icon={cilBadge} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Хамгаалах хэрэгсэл',
    to: '/ppe',
    icon: <CIcon icon={cilShieldAlt} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Аюулгүйн сургалт',
    to: '/training',
    icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Хувцас захиалга',
    to: '/clothing',
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Хандалтын дүрэм',
    to: '/site-access',
    icon: <CIcon icon={cilLockLocked} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Аюултай бүс',
    to: '/danger-zones',
    icon: <CIcon icon={cilBurn} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Өглөөний шалгалт',
    to: '/morning-inspection',
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Норм дүрэм / Заавар',
    to: '/documents',
    icon: <CIcon icon={cilBook} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Материалын тооцоо',
    to: '/materials',
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Багаж хэрэгсэл',
    to: '/tools',
    icon: <CIcon icon={cilHandPointUp} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Зөрчил / Торгууль',
    to: '/violations',
    icon: <CIcon icon={cilWarning} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Торгуулийн сан',
    to: '/penalty-fund',
    icon: <CIcon icon={cilBank} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Бригадууд',
  },
  {
    component: CNavItem,
    name: 'Бригадууд',
    to: '/brigades',
    icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Бригадын гэрээ',
    to: '/brigade-contracts',
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Маркетплейс',
  },
  {
    component: CNavItem,
    name: 'Барааны каталог',
    to: '/marketplace',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Миний захиалгууд',
    to: '/marketplace/orders',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
]

export const getFilteredNavigation = () => _nav

export default _nav
