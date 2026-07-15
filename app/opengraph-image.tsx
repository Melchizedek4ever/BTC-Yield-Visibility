import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0A0C10',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F7931A',
              borderRadius: '50%',
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#545C6A', letterSpacing: 4 }}>
            STACKS BITCOIN YIELD INTELLIGENCE
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', fontSize: 74, fontWeight: 700, color: '#ECEEF3', letterSpacing: -2 }}>
            BTC Yield Visibility
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#8B93A3', maxWidth: 900 }}>
            Risk-adjusted Bitcoin yield intelligence for the Stacks ecosystem — explainable scoring, not just an APY table.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, borderTop: '1px solid #232933', paddingTop: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 16, color: '#545C6A', letterSpacing: 2 }}>RISK ENGINE</div>
            <div style={{ display: 'flex', fontSize: 22, color: '#ECEEF3' }}>Explainable, per-factor</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 16, color: '#545C6A', letterSpacing: 2 }}>SCORING</div>
            <div style={{ display: 'flex', fontSize: 22, color: '#ECEEF3' }}>Real yield vs. emissions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 16, color: '#545C6A', letterSpacing: 2 }}>ECOSYSTEM</div>
            <div style={{ display: 'flex', fontSize: 22, color: '#ECEEF3' }}>Stacks / Bitcoin L2</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
