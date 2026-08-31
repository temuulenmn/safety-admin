import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import mnMN from 'antd/es/locale/mn_MN'
import dayjs from 'dayjs'
import 'dayjs/locale/mn'

import 'antd/dist/antd.min.css'
import './assets/muse/main.css'
import './assets/muse/responsive.css'
import App from './App'
import store from './store'
import { registerPWA } from './utils/pwa'

// Систем бүхэлдээ монгол хэл дээр байтал огноо сонгогч, хуудаслалт, шүүлтүүр
// зэрэг antd-ийн бэлэн бичвэрүүд англиар («Select date», «No data») гарч
// байсан. Хэлний багцыг нэг дор тохируулна.
//   • ConfigProvider — antd-ийн бичвэрүүд
//   • dayjs.locale   — хуанлийн сар / гаригийн нэр
dayjs.locale('mn')

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ConfigProvider locale={mnMN}>
      <App />
    </ConfigProvider>
  </Provider>,
)

registerPWA()
