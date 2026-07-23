import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import 'antd/dist/antd.min.css'
import './assets/muse/main.css'
import './assets/muse/responsive.css'
import App from './App'
import store from './store'
import { registerPWA } from './utils/pwa'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)

registerPWA()
