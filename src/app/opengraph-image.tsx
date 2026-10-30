import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Mehfil (महफ़िल) — Celebration Planning with Mathematical Integrity'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#FFF8EE',
          padding: '80px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Subtle festive background accents */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 480,
            height: 480,
            borderRadius: '50%',
            backgroundColor: '#F7C873',
            opacity: 0.25,
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: 200,
            width: 420,
            height: 420,
            borderRadius: '50%',
            backgroundColor: '#F2A7B8',
            opacity: 0.2,
            filter: 'blur(70px)',
          }}
        />

        {/* Top Header / Brand Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#3A2442',
              color: '#FFF8EE',
              padding: '8px 24px',
              borderRadius: '9999px',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            महफ़िल · MEHFIL
          </div>
          <div
            style={{
              color: '#3A2442',
              opacity: 0.7,
              fontSize: '20px',
              fontFamily: 'sans-serif',
            }}
          >
            Words from models · Numbers from code
          </div>
        </div>

        {/* Main Title & Hero Messaging */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '960px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#3A2442',
              letterSpacing: '-0.02em',
            }}
          >
            Celebration planning with mathematical integrity.
          </div>
          <div
            style={{
              fontSize: '26px',
              color: '#3A2442',
              opacity: 0.85,
              lineHeight: 1.4,
              fontFamily: 'sans-serif',
            }}
          >
            An intelligent workspace for weddings and milestone celebrations where budgets,
            timelines, and vendor quotes re-balance dynamically in integer paise.
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontFamily: 'sans-serif',
            fontSize: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(58, 36, 66, 0.06)',
              color: '#3A2442',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(58, 36, 66, 0.12)',
            }}
          >
            Zero Floating-Point Drift (INR Paise)
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(58, 36, 66, 0.06)',
              color: '#3A2442',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(58, 36, 66, 0.12)',
            }}
          >
            Protected Moment 40% Floor
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(58, 36, 66, 0.06)',
              color: '#3A2442',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(58, 36, 66, 0.12)',
            }}
          >
            Quarantined Vendor Quote Checking
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

