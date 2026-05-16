import { ImageResponse } from 'next/og'

export const size        = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
          gap:            '12px',
        }}
      >
        {/* Nome principal */}
        <div
          style={{
            fontFamily:    'sans-serif',
            fontSize:      '68px',
            fontWeight:    900,
            color:         '#22c55e',
            letterSpacing: '-1px',
            lineHeight:    1,
          }}
        >
          Completando
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize:   '26px',
            fontWeight: 500,
            color:      '#94a3b8',
            letterSpacing: '0.5px',
          }}
        >
          Troque e venda figurinhas
        </div>

        {/* Barra verde decorativa */}
        <div
          style={{
            marginTop:    '20px',
            width:        '120px',
            height:       '6px',
            background:   '#22c55e',
            borderRadius: '3px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
