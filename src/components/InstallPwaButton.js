import React, { useEffect, useState } from 'react'
import { Button, Space } from 'antd'
import { onInstallable, isStandalone } from 'src/utils/pwa'

const DISMISS_KEY = 'pwa_install_dismissed'

export default function InstallPwaButton() {
  const [promptFn, setPromptFn] = useState(null)
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1' || isStandalone(),
  )

  useEffect(() => onInstallable((prompt) => setPromptFn(() => prompt)), [])

  if (!promptFn || dismissed) return null

  const install = async () => {
    const outcome = await promptFn()
    if (outcome === 'accepted') setDismissed(true)
  }
  const later = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 2000,
      background: '#fff', border: '1px solid #f0f0f0',
      borderRadius: 12, padding: 12, boxShadow: '0 4px 20px rgba(0,0,0,.15)',
      maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontWeight: 600 }}>📱 Аппаар суулгах</div>
      <div style={{ fontSize: 13, color: '#8c8c8c' }}>
        Утсандаа суулгаад хурдан нээж, notification хүлээж авна уу.
      </div>
      <Space style={{ justifyContent: 'flex-end' }}>
        <Button size="small" onClick={later}>Дараа</Button>
        <Button size="small" type="primary" onClick={install}>Суулгах</Button>
      </Space>
    </div>
  )
}
