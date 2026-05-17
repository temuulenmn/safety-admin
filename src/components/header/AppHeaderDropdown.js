import React from 'react'
import {
  CAvatar, CDropdown, CDropdownDivider, CDropdownHeader,
  CDropdownItem, CDropdownMenu, CDropdownToggle,
} from '@coreui/react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useDispatch } from 'react-redux'

const AppHeaderDropdown = () => {
  const dispatch = useDispatch()

  const logout = () => {
    dispatch({ type: 'logout' })
    window.location.href = '/#/login'
  }

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  })()
  const displayName = user.username || user.full_name || 'Хэрэглэгч'

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar color="primary" textColor="white" size="md">
          {displayName.charAt(0).toUpperCase()}
        </CAvatar>
      </CDropdownToggle>

      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          <CIcon icon={cilUser} className="me-1" /> {displayName}
        </CDropdownHeader>
        <CDropdownDivider />
        <CDropdownItem onClick={logout} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Системээс гарах
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
