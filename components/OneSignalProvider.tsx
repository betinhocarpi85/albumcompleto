'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { getUserId } from '@/lib/db'

declare global {
  interface Window {
    OneSignalDeferred?: ((os: any) => void | Promise<void>)[]
  }
}

export default function OneSignalProvider() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred ?? []
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId:                        'dadf445f-31b6-464b-b829-818baaf9f850',
        notifyButton:                 { enable: false },
        allowLocalhostAsSecureOrigin: true,
        autoResubscribe:              true,
        // Nenhum promptOptions = SDK não mostra nenhum prompt automático
      })

      // Vincula o usuário Supabase ao OneSignal (external_id)
      const uid = await getUserId()
      if (uid) {
        await OneSignal.login(uid).catch(() => {})
      }
    })
  }, [])

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  )
}
