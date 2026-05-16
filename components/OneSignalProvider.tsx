'use client'

import { useEffect } from 'react'
import { getUserId } from '@/lib/db'

declare global {
  interface Window {
    OneSignalDeferred?: ((os: any) => void | Promise<void>)[]
    _oneSignalLoaded?: boolean
  }
}

// Carrega o SDK do OneSignal de forma lazy (só quando chamado)
export async function loadOneSignal(): Promise<void> {
  if (window._oneSignalLoaded) return
  window._oneSignalLoaded = true

  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.async = true
    script.onload = async () => {
      window.OneSignalDeferred = window.OneSignalDeferred ?? []
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        await OneSignal.init({
          appId:                        'dadf445f-31b6-464b-b829-818baaf9f850',
          notifyButton:                 { enable: false },
          allowLocalhostAsSecureOrigin: true,
          autoResubscribe:              true,
        })
        // Vincula usuário Supabase
        const uid = await getUserId()
        if (uid) await OneSignal.login(uid).catch(() => {})
        resolve()
      })
    }
    document.head.appendChild(script)
  })
}

export default function OneSignalProvider() {
  useEffect(() => {
    // Só inicializa se já tiver permissão (usuário que já aceitou antes)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      loadOneSignal()
    }
  }, [])

  return null
}
