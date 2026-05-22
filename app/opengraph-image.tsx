import { ImageResponse } from 'next/og'

export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          background:     '#ffffff',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '16px',
        }}
      >
        {/* Nome principal */}
        <div
          style={{
            fontFamily:    'sans-serif',
            fontSize:      '120px',
            fontWeight:    900,
            color:         '#22c55e',
            letterSpacing: '-2px',
            lineHeight:    1,
          }}
        >
          Completando
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily:    'sans-serif',
            fontSize:      '44px',
            fontWeight:    500,
            color:         '#94a3b8',
            letterSpacing: '0.5px',
          }}
        >
          Troque e venda figurinhas
        </div>

        {/* Barra verde decorativa */}
        <div
          style={{
            marginTop:    '24px',
            width:        '200px',
            height:       '8px',
            background:   '#22c55e',
            borderRadius: '4px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
