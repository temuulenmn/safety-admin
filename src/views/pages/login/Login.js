import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  CButton, CCard, CCardBody, CCardGroup, CCol, CContainer,
  CForm, CFormInput, CInputGroup, CInputGroupText, CRow, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import api from 'src/services/api'

const Login = () => {
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => { localStorage.clear() }, [])

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('Нэвтрэх нэр болон нууц үгээ оруулна уу'); return }
    setLoading(true); setError('')
    try {
      const res = await api.login({ username, password })
      dispatch({ type: 'login', token: res.data.token, user: res.data.user })
      navigate('/')
    } catch {
      setError('Нэвтрэх нэр эсвэл нууц үг буруу байна')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6} lg={5}>
            <CCard className="p-4 shadow">
              <CCardBody>
                <CForm onSubmit={handleSignIn}>
                  <div className="text-center mb-4">
                    <h2 className="fw-bold">Safety ERP</h2>
                    <p className="text-medium-emphasis">Баrilga Uul Uурхай ХХК</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2 mb-3">{error}</div>
                  )}

                  <CInputGroup className="mb-3">
                    <CInputGroupText><CIcon icon={cilUser} /></CInputGroupText>
                    <CFormInput
                      placeholder="Нэвтрэх нэр"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText><CIcon icon={cilLockLocked} /></CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Нууц үг"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </CInputGroup>

                  <CButton color="primary" className="w-100 py-2" type="submit" disabled={loading}>
                    {loading ? <><CSpinner size="sm" className="me-2" />Нэвтэрч байна...</> : 'Нэвтрэх'}
                  </CButton>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
