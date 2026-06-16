// fh-icons.jsx — SVG icon set for the FocusHacker hero animation.

export const FH = {
  orange: '#FF6B35',
  orangeDeep: '#E8531C',
  blue: '#5B8DEF',
  blueDeep: '#3D6FD4',
  teal: '#4A9B6F',
  tealDeep: '#3C875E',
  red: '#E24B4A',
  ink: '#1d1d1f',
  inkSoft: '#3c3c43',
  menuGlyph: 'rgba(0,0,0,0.82)',
};

// ── macOS pointer ────────────────────────────────────────────────────────────
export function CursorArrow({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))' }}>
      <path d="M5 2.5 L5 19.5 L9.4 15.2 L12.4 21.4 L15.1 20.2 L12.1 14.2 L18.2 14.2 Z"
        fill="#000" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// ── FocusHacker mark: a focus/aperture ring ───────────────────────────────────
// state: 'idle' | 'active' | 'complete'. `pulse` 0..1 drives the active breathing.
export function FocusMark({ size = 17, state = 'idle', pulse = 0 }) {
  const stroke = state === 'idle' ? FH.menuGlyph : state === 'active' ? FH.orange : FH.teal;
  const cx = 12, cy = 12;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      {/* breathing halo while active */}
      {state === 'active' && (
        <circle cx={cx} cy={cy} r={10 + pulse * 3} fill="none" stroke={FH.orange}
          strokeWidth="1.4" opacity={0.45 * (1 - pulse)} />
      )}
      {/* outer ring */}
      <circle cx={cx} cy={cy} r="8.4" fill="none" stroke={stroke} strokeWidth="2" />
      {/* aperture ticks */}
      {state !== 'complete' && [0, 90, 180, 270].map((a) => {
        const rad = (a * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * 4.2, y1 = cy + Math.sin(rad) * 4.2;
        const x2 = cx + Math.cos(rad) * 7.4, y2 = cy + Math.sin(rad) * 7.4;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="2" strokeLinecap="round" />;
      })}
      {/* center */}
      {state === 'idle' && <circle cx={cx} cy={cy} r="1.7" fill={stroke} />}
      {state === 'active' && <circle cx={cx} cy={cy} r={2 + pulse * 0.6} fill={FH.orange} />}
      {state === 'complete' && (
        <path d="M8.2 12.2 L11 14.9 L16 9.3" fill="none" stroke={FH.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// App-tile version of the mark (rounded square) for notifications / dropdown / dock.
export function FocusTile({ size = 38, tone = 'orange', radius }) {
  const grad = tone === 'teal'
    ? `linear-gradient(160deg, ${FH.teal}, ${FH.tealDeep})`
    : tone === 'blue'
      ? `linear-gradient(160deg, ${FH.blue}, ${FH.blueDeep})`
      : tone === 'neutral'
        ? 'linear-gradient(160deg, #6e6e76, #4a4a52)'
        : `linear-gradient(160deg, ${FH.orange}, ${FH.orangeDeep})`;
  const r = radius != null ? radius : size * 0.255;
  return (
    <div style={{
      width: size, height: size, borderRadius: r, background: grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.18)',
      flexShrink: 0,
    }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.4" fill="none" stroke="#fff" strokeWidth="2" />
        {[0, 90, 180, 270].map((a) => {
          const rad = (a * Math.PI) / 180;
          const x1 = 12 + Math.cos(rad) * 4.2, y1 = 12 + Math.sin(rad) * 4.2;
          const x2 = 12 + Math.cos(rad) * 7.4, y2 = 12 + Math.sin(rad) * 7.4;
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2" strokeLinecap="round" />;
        })}
        <circle cx="12" cy="12" r="1.8" fill="#fff" />
      </svg>
    </div>
  );
}

// ── menubar system glyphs (SF-symbol-ish) ─────────────────────────────────────
const G = FH.menuGlyph;
export function AppleLogo({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={G}>
      <path d="M17.6 12.9c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.2-.1-2.2.7-2.8.7s-1.5-.7-2.4-.7c-1.3 0-2.4.7-3.1 1.9-1.3 2.3-.3 5.6 1 7.5.6.9 1.3 1.9 2.2 1.9.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6 1.5-.9 2.1-1.8c.4-.6.7-1.2.9-1.8-1.4-.6-2.3-1.9-2.3-3.3z" />
      <path d="M15.1 7.3c.5-.6.8-1.5.7-2.3-.8.1-1.7.6-2.2 1.2-.5.6-.9 1.4-.7 2.2.8.1 1.7-.5 2.2-1.1z" />
    </svg>
  );
}
export function WifiGlyph({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2.5 8.5C8 4 16 4 21.5 8.5" stroke={G} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.8 12C9.4 9 14.6 9 18.2 12" stroke={G} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 15.4c1.8-1.5 4.2-1.5 6 0" stroke={G} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="18.4" r="1.3" fill={G} />
    </svg>
  );
}
export function BatteryGlyph({ size = 24 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 30 18" fill="none">
      <rect x="1" y="3.5" width="23" height="11" rx="3" stroke={G} strokeWidth="1.4" opacity="0.5" />
      <rect x="3" y="5.5" width="17" height="7" rx="1.6" fill={G} />
      <path d="M26 7v4c1.1-.3 1.8-1 1.8-2S27.1 7.3 26 7z" fill={G} opacity="0.5" />
    </svg>
  );
}
export function SpotlightGlyph({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="10.5" cy="10.5" r="6.2" stroke={G} strokeWidth="1.8" />
      <line x1="15.2" y1="15.2" x2="20" y2="20" stroke={G} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
export function ControlCenterGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4" width="17" height="7" rx="3.5" stroke={G} strokeWidth="1.6" />
      <rect x="3.5" y="13" width="17" height="7" rx="3.5" stroke={G} strokeWidth="1.6" />
      <circle cx="8" cy="7.5" r="1.7" fill={G} />
      <circle cx="16" cy="16.5" r="1.7" fill={G} />
    </svg>
  );
}

// Traffic lights for windows
export function TrafficLights({ dim = false }) {
  const o = dim ? 0.4 : 1;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57', opacity: o }} />
      <span style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e', opacity: o }} />
      <span style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840', opacity: o }} />
    </div>
  );
}

// Flame for the streak — emoji or drawn glyph
export function Flame({ size = 30, emoji = true }) {
  if (emoji) return <span style={{ fontSize: size, lineHeight: 1 }}>🔥</span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="flm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB02E" />
          <stop offset="0.55" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#F03E2F" />
        </linearGradient>
      </defs>
      <path d="M13 2c.6 3.2-1.4 4.6-2.8 6.2C8.9 9.8 8 11.3 8 13a4 4 0 0 0 8 .2c0-1.1-.4-2-1-2.8 1.9.6 3 2.4 3 4.6a6 6 0 1 1-12 0c0-3 1.7-5 3.4-6.8C11.2 6.4 12.7 4.7 13 2z" fill="url(#flm)" />
    </svg>
  );
}

