import React, { useEffect, useState } from 'react'
import { Menu } from 'antd'
import { NavLink, useLocation } from 'react-router-dom'
import api from 'src/services/api'
import { icons } from './icons'

const COLOR = '#5856d6'
const BRAND = '/icon.jpg'   // served from public/

// ── Navigation tree ─────────────────────────────────────────────────
// Same domain grouping as the old sidebar; each entry has an icon key
// from ./icons and a translated label. `section: '...'` inserts a header row.
const nav = [
  { to: '/dashboard',        label: 'Хянах самбар',       icon: 'dashboard' },
  { to: '/projects',         label: 'Төсөл / Объект',    icon: 'location' },
  { to: '/kpi',              label: 'KPI',                icon: 'chart' },

  { section: 'ХҮНИЙ НӨӨЦ' },
  { to: '/employees',        label: 'Ажилтнууд',         icon: 'users' },
  { to: '/departments',      label: 'Хэлтсүүд',          icon: 'building' },
  { to: '/attendance',       label: 'Ирц',                icon: 'clock' },
  { to: '/schedules',        label: 'Ажлын хуваарь',     icon: 'calendar' },
  { to: '/payroll',          label: 'Цалин',              icon: 'money' },

  { section: 'АЮУЛГҮЙ БАЙДАЛ' },
  { to: '/rfid',             label: 'RFID',               icon: 'badge' },
  { to: '/ppe',              label: 'Хамгаалах хэрэгсэл', icon: 'shield' },
  { to: '/worker-clothing',  label: 'Хувцасны RFID',      icon: 'badge' },
  { to: '/training',         label: 'Аюулгүйн сургалт',   icon: 'book' },
  { to: '/clothing',         label: 'Хувцас захиалга',    icon: 'layers' },
  { to: '/site-access',      label: 'Хандалтын дүрэм',    icon: 'lock' },
  { to: '/danger-zones',     label: 'Аюултай бүс',        icon: 'fire' },
  // ⏸ Өглөөний шалгалт — түр хассан (2026-08-31).
  // Ажилтан талбайд орохдоо хаалганы RFID уншигчаар ХХХ-ээ бүрэн
  // шалгуулдаг тул өглөөний тусдаа шалгалт давхардаж байна. Backend,
  // өгөгдөл, дэлгэц бүгд байрандаа — дахин нээхэд эдгээр мөрийг сэргээнэ.
  // { to: '/morning-inspection', label: 'Өглөөний шалгалт', icon: 'check' },
  { to: '/documents',        label: 'Норм дүрэм / Заавар', icon: 'file' },
  { to: '/materials',        label: 'Материалын тооцоо',  icon: 'calc' },
  { to: '/tools',            label: 'Багаж хэрэгсэл',    icon: 'wrench' },
  { to: '/violations',       label: 'Зөрчил / Торгууль',  icon: 'warning' },
  { to: '/penalty-fund',     label: 'Торгуулийн сан',    icon: 'bank' },

  { section: 'ХУУЛИЙН ЗААЛТ' },
  { to: '/accidents',           label: 'Үйлдвэрлэлийн осол', icon: 'ambulance' },
  { to: '/health-checks',       label: 'Эрүүл мэндийн үзлэг', icon: 'heart' },
  { to: '/insurance',           label: 'Даатгал',             icon: 'shield' },
  { to: '/osh-committee',       label: 'Аюулгүйн зөвлөл',    icon: 'group' },
  { to: '/chemicals',           label: 'Химийн бодис',        icon: 'warning' },
  { to: '/fire-safety',         label: 'Галын аюулгүй',       icon: 'fire' },
  { to: '/risk-assessments',    label: 'Эрсдэлийн үнэлгээ',   icon: 'chart' },
  { to: '/detox-rations',       label: 'Хор саармагжуулах',   icon: 'heart' },
  { to: '/tool-inspections',    label: 'Багажийн шалгалт',    icon: 'wrench' },
  { to: '/osh-budget',          label: '1.5% төсөв',           icon: 'bank' },
  { to: '/training-compliance', label: 'Сургалтын нийцэл',    icon: 'book' },
  { to: '/notifications',       label: 'Мэдэгдэл (Email/SMS)', icon: 'file' },

  { section: 'БРИГАД' },
  { to: '/brigades',         label: 'Бригадууд',         icon: 'group' },
  { to: '/brigade-contracts', label: 'Бригадын гэрээ',   icon: 'file' },

  { section: 'МАРКЕТПЛЕЙС' },
  { to: '/marketplace',      label: 'Барааны каталог',   icon: 'cart' },
  { to: '/marketplace/orders', label: 'Миний захиалгууд', icon: 'list' },
  { section: 'ТОХИРГОО' },
  { to: '/users',            label: 'Хэрэглэгчид',        icon: 'users' },
  { to: '/billing',          label: 'Захиалга, төлбөр',   icon: 'money' },
]

export default function Sidenav({ color = COLOR }) {
  const { pathname } = useLocation()
  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  // Header project-scope selector state is separate; here we just render nav.
  const items = nav.map((it, i) =>
    it.section
      ? { key: `s-${i}`, className: 'menu-item-header', label: it.section, disabled: true }
      : {
          key: it.to,
          label: (
            <NavLink to={it.to}>
              <span className="icon" style={{ background: isActive(it.to) ? color : '' }}>
                {icons[it.icon]?.(isActive(it.to) ? '#fff' : color)}
              </span>
              <span className="label">{it.label}</span>
            </NavLink>
          ),
        }
  )

  return (
    <>
      <div className="brand" style={{ display:'flex', alignItems:'center', gap:10 }}>
        <img src={BRAND} alt="Safety" style={{ width:32, height:32, borderRadius:8 }} />
        <span style={{ fontWeight:700, fontSize:15, color:'#141414' }}>Аюулгүй ажиллагаа</span>
      </div>
      <hr />
      <Menu theme="light" mode="inline" items={items} selectedKeys={[pathname]} />
    </>
  )
}
