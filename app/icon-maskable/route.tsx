import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          background:     '#22c55e',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize:   '280px',
            fontWeight: 900,
            color:      'white',
            lineHeight: 1,
          }}
        >
          C
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
