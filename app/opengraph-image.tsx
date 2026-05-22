import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  const imgData = readFileSync(join(process.cwd(), 'public', 'icon-512.png'))
  const base64  = `data:image/png;base64,${imgData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          background:      '#ffffff',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={base64} width={500} height={500} alt="Completando" />
      </div>
    ),
    { ...size }
  )
}
