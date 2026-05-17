import { legacy_createStore as createStore } from 'redux'

const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
})()

const initialState = {
  sidebarShow: true,
  theme: 'light',
  user: storedUser,
  token: localStorage.getItem('token') || null,
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    case 'login':
      localStorage.setItem('token', rest.token)
      localStorage.setItem('user', JSON.stringify(rest.user))
      return { ...state, token: rest.token, user: rest.user }
    case 'logout':
      localStorage.clear()
      return { ...state, token: null, user: null }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
