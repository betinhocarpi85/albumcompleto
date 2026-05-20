'use client'
import dynamic from 'next/dynamic'

// Wrapper client component para poder usar ssr:false dentro de Server Component layout
const PushPrompt = dynamic(() => import('./PushPrompt'), { ssr: false })
export default PushPrompt
