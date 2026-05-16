import { ImageResponse } from 'next/og'

export const size        = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          background:      '#22c55e',
          borderRadius:    '96px',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <div
          style={{
            fontFamily:  'serif',
            fontSize:    '320px',
            fontWeight:  900,
            color:       'white',
            lineHeight:  1,
            marginTop:   '16px',
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  )
}
