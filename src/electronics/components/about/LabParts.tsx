import { motion, type MotionValue } from 'motion/react'

/* SVG drawings of the five parts in the hardware lab diagram.
   Each part is drawn in its own local coordinates (origin top-left);
   the diagram places it with a translate. Sizes are exported so the
   layouts can line wires up with the header pins. */

export const SIZE = {
  dht: { w: 90, h: 83 },
  pir: { w: 92, h: 79 },
  esp: { w: 139, h: 187 },
  relay: { w: 91, h: 108 },
  device: { w: 44, h: 44 },
} as const

const SIGNAL = '#b2ccd6'
const LED_ON = '#e4f7fa'

/* Shared gradients and filters, rendered once inside the diagram <defs>. */
export function LabDefs() {
  return (
    <>
      <pattern id="lab-microgrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M30 0 H0 V30" fill="none" stroke="#29323a" strokeWidth=".7" opacity=".5" />
      </pattern>
      <linearGradient id="lab-pcb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2b4b54" />
        <stop offset=".45" stopColor="#16303a" />
        <stop offset="1" stopColor="#0a1c24" />
      </linearGradient>
      <linearGradient id="lab-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f1d9a6" />
        <stop offset=".5" stopColor="#b98f52" />
        <stop offset="1" stopColor="#e2c48d" />
      </linearGradient>
      <linearGradient id="lab-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e1e5e5" />
        <stop offset=".22" stopColor="#a3adb2" />
        <stop offset=".52" stopColor="#5d6871" />
        <stop offset=".78" stopColor="#b2bcc0" />
        <stop offset="1" stopColor="#77838a" />
      </linearGradient>
      <linearGradient id="lab-steel-dark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a545b" />
        <stop offset="1" stopColor="#10171d" />
      </linearGradient>
      <linearGradient id="lab-dht" x1="0" y1="0" x2=".85" y2="1">
        <stop offset="0" stopColor="#8fb0bb" />
        <stop offset=".55" stopColor="#5a7c89" />
        <stop offset="1" stopColor="#36525e" />
      </linearGradient>
      <linearGradient id="lab-relay" x1="0" y1="0" x2=".9" y2="1">
        <stop offset="0" stopColor="#36698a" />
        <stop offset=".5" stopColor="#1f4a66" />
        <stop offset="1" stopColor="#11324a" />
      </linearGradient>
      <linearGradient id="lab-term" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3d4c55" />
        <stop offset=".5" stopColor="#2b373e" />
        <stop offset="1" stopColor="#1d262b" />
      </linearGradient>
      <radialGradient id="lab-screw" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#eef1f1" />
        <stop offset=".55" stopColor="#9aa5aa" />
        <stop offset="1" stopColor="#4b565d" />
      </radialGradient>
      <radialGradient id="lab-lens" cx="34%" cy="27%" r="80%">
        <stop offset="0" stopColor="#eef0ee" />
        <stop offset=".38" stopColor="#c3cacc" />
        <stop offset=".74" stopColor="#7b888e" />
        <stop offset="1" stopColor="#38424b" />
      </radialGradient>
      <linearGradient id="lab-lens-base" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9aa4a8" />
        <stop offset="1" stopColor="#4c575e" />
      </linearGradient>
      <radialGradient id="lab-halo">
        <stop offset="0" stopColor="#b0d3df" stopOpacity=".2" />
        <stop offset=".55" stopColor="#b0d3df" stopOpacity=".06" />
        <stop offset="1" stopColor="#b0d3df" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lab-led">
        <stop offset="0" stopColor="#e4f7fa" stopOpacity=".9" />
        <stop offset="1" stopColor="#b2ccd6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lab-fan-blur">
        <stop offset=".18" stopColor="#c8d4d9" stopOpacity="0" />
        <stop offset=".55" stopColor="#c8d4d9" stopOpacity=".2" />
        <stop offset="1" stopColor="#c8d4d9" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="lab-blade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#dfe6e9" />
        <stop offset="1" stopColor="#8d9ba2" />
      </linearGradient>
      <linearGradient id="lab-sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <filter id="lab-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="lab-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity=".75" />
      </filter>
      <filter id="lab-metal-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="3" stdDeviation="2.6" floodColor="#000" floodOpacity=".7" />
      </filter>
    </>
  )
}

function Led({ cx, cy, on, blink = false }: { cx: number; cy: number; on: boolean; blink?: boolean }) {
  return (
    <g className={blink ? 'lab-blink' : undefined}>
      <circle cx={cx} cy={cy} r={7} fill="url(#lab-led)" style={{ opacity: on ? 1 : 0, transition: 'opacity .35s' }} />
      <circle cx={cx} cy={cy} r={2.3} fill={on ? LED_ON : '#33505a'} stroke={on ? '#fff' : '#5b7680'} strokeWidth={0.5} style={{ transition: 'fill .25s' }} />
    </g>
  )
}

/** three header pads on one edge; the middle one is where the wire attaches */
function Header({ x, cy, gap = 7.5 }: { x: number; cy: number; gap?: number }) {
  return (
    <g>
      {[-1, 0, 1].map((i) => (
        <rect key={i} x={x} y={cy + i * gap - 2.5} width={7} height={5} rx={1} fill="url(#lab-gold)" stroke="#f3dcae" strokeWidth={0.3} />
      ))}
    </g>
  )
}

function Board({ w, h, stroke = '#55767f' }: { w: number; h: number; stroke?: string }) {
  return (
    <>
      <rect width={w} height={h} rx={8} fill="url(#lab-pcb)" stroke={stroke} strokeWidth={1.3} />
      <rect x={3.5} y={3.5} width={w - 7} height={h - 7} rx={5.5} fill="none" stroke="#fff" strokeOpacity={0.05} />
    </>
  )
}

/* DHT11 temperature + humidity module, header on the right edge (y 42) */
export function Dht11({ on }: { on: boolean }) {
  const cols = [33.6, 42, 50.4]
  const rows = [16.5, 24.5, 32.5, 40.5]
  return (
    <g>
      <g filter="url(#lab-shadow)">
        <Board w={90} h={83} />
      </g>
      <circle cx={10} cy={10} r={3.3} fill="#071116" stroke="#c9b27f" strokeOpacity={0.55} strokeWidth={1.2} />
      <path d="M9 70 H22 M66 10 H78 M9 22 V30" stroke="#8fb0b4" strokeOpacity={0.32} strokeWidth={0.8} fill="none" />
      {/* perforated housing */}
      <rect x={28} y={9} width={34} height={47} rx={3.5} fill="url(#lab-dht)" stroke="#adc6cf" strokeWidth={1.1} />
      <rect x={29.6} y={10.5} width={30.8} height={2.4} rx={1.2} fill="#fff" opacity={0.22} />
      {rows.map((y) =>
        cols.map((x) => (
          <g key={`${x}-${y}`}>
            <rect x={x - 2.8} y={y - 2.8} width={5.6} height={5.6} rx={1} fill="#18303b" />
            <rect x={x - 2.8} y={y + 2.1} width={5.6} height={0.8} fill="#a8c3cc" opacity={0.3} />
          </g>
        )),
      )}
      <rect x={28} y={49} width={34} height={7} rx={1.5} fill="#000" opacity={0.18} />
      {/* legs */}
      {[38, 44.4, 50.8].map((x) => (
        <rect key={x} x={x - 1.1} y={56} width={2.2} height={10} fill="url(#lab-gold)" />
      ))}
      <Header x={83} cy={42} />
      <Led cx={76} cy={71} on={on} />
    </g>
  )
}

/* HC-SR501 PIR module with Fresnel dome; header on either edge (y 43) */
export function Pir({ on, header = 'right' }: { on: boolean; header?: 'left' | 'right' }) {
  return (
    <g>
      <g filter="url(#lab-shadow)">
        <Board w={92} h={79} stroke="#5d808a" />
      </g>
      <path d="M8 66 H18 M74 12 H84" stroke="#8fb0b4" strokeOpacity={0.32} strokeWidth={0.8} fill="none" />
      <rect x={18} y={11} width={57} height={57} rx={6} fill="url(#lab-lens-base)" stroke="#b9c3c6" strokeWidth={0.8} />
      <circle cx={46.5} cy={39.5} r={25} fill="#0d171c" opacity={0.55} />
      <circle cx={46.5} cy={39.5} r={23.5} fill="url(#lab-lens)" stroke="#f3f4f1" strokeWidth={0.6} />
      <g stroke="#56646b" strokeWidth={0.55} fill="none" opacity={0.55}>
        <circle cx={46.5} cy={39.5} r={17.5} />
        <circle cx={46.5} cy={39.5} r={11.5} />
        <circle cx={46.5} cy={39.5} r={5.5} />
        <path d="M46.5 16 V63 M23 39.5 H70 M29.9 22.9 L63.1 56.1 M63.1 22.9 L29.9 56.1" opacity={0.6} />
      </g>
      <ellipse cx={38} cy={29} rx={8.5} ry={4.6} fill="#fff" opacity={0.42} transform="rotate(-32 38 29)" />
      <circle cx={46.5} cy={39.5} r={23.5} fill={SIGNAL} style={{ opacity: on ? 0.16 : 0, transition: 'opacity .4s' }} />
      <Header x={header === 'right' ? 85 : 0} cy={43} />
    </g>
  )
}

/* ESP32 dev board. Pins on both long edges, 14 per side at y = 14 + 11k. */
export function Esp32({
  scanX,
  led,
  showLabel = true,
  label,
  sub,
}: {
  scanX: MotionValue<number>
  led: 'off' | 'blink' | 'on'
  showLabel?: boolean
  label: string
  sub?: string
}) {
  const pins = Array.from({ length: 14 }, (_, k) => 14 + 11 * k)
  return (
    <g>
      <defs>
        <clipPath id="lab-can-clip">
          <rect x={27} y={37} width={85} height={93} rx={2.5} />
        </clipPath>
      </defs>
      <g filter="url(#lab-shadow)">
        <rect width={139} height={187} rx={9} fill="url(#lab-pcb)" stroke="#5f7a85" strokeWidth={1.4} />
      </g>
      <rect x={4} y={4} width={131} height={179} rx={6} fill="none" stroke="#fff" strokeOpacity={0.045} />
      {pins.map((y) => (
        <g key={y}>
          <rect x={-8} y={y} width={8.5} height={5} rx={1} fill="url(#lab-gold)" stroke="#f3dcae" strokeWidth={0.3} />
          <rect x={138.5} y={y} width={8.5} height={5} rx={1} fill="url(#lab-gold)" stroke="#f3dcae" strokeWidth={0.3} />
          <circle cx={7} cy={y + 2.5} r={2.1} fill="#0a1418" stroke="#c9a874" strokeOpacity={0.7} strokeWidth={0.9} />
          <circle cx={132} cy={y + 2.5} r={2.1} fill="#0a1418" stroke="#c9a874" strokeOpacity={0.7} strokeWidth={0.9} />
        </g>
      ))}
      {/* module: PCB antenna + RF shield */}
      <rect x={22} y={7} width={95} height={128} rx={3} fill="#0c191f" stroke="#3f5a64" strokeWidth={0.8} />
      <path
        d="M30 31 V14 H39 V27 H48 V14 H57 V27 H66 V14 H75 V27 H84 V14 H93 V27 H102 V14 H109 V31"
        stroke="#bb9b66"
        strokeOpacity={0.55}
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
      />
      <g filter="url(#lab-metal-shadow)">
        <rect x={27} y={37} width={85} height={93} rx={2.5} fill="url(#lab-steel)" stroke="#cdd4d7" strokeWidth={0.8} />
      </g>
      <rect x={30} y={40} width={79} height={87} rx={1.5} fill="url(#lab-steel-dark)" opacity={0.42} />
      <g stroke="#fff" strokeOpacity={0.055} strokeWidth={0.6}>
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M31 ${45 + i * 6.5} H108`} />
        ))}
      </g>
      <text x={69.5} y={52} textAnchor="middle" fontSize={6} letterSpacing={0.6} fill="#2f3a42" opacity={0.85} className="font-mono">
        ESP32-WROOM-32
      </text>
      <g clipPath="url(#lab-can-clip)">
        <g transform="skewX(-18)">
          <motion.rect y={37} width={24} height={93} fill="url(#lab-sheen)" style={{ x: scanX }} opacity={0.5} />
        </g>
      </g>
      {showLabel && (
        <g>
          <rect x={39.5} y={70} width={60} height={37} rx={2.5} fill="#24303a" opacity={0.94} />
          <text x={69.5} y={91} textAnchor="middle" fontSize={17} fontWeight={700} letterSpacing={-0.6} fill="#e8ecec">
            {label}
          </text>
          {sub && (
            <text x={69.5} y={101.5} textAnchor="middle" fontSize={6.8} letterSpacing={1} fill="#aebcc2" className="font-mono uppercase">
              {sub}
            </text>
          )}
        </g>
      )}
      {/* regulator, buttons, LED, USB */}
      <rect x={24} y={139} width={24} height={5} fill="url(#lab-steel)" opacity={0.8} />
      <rect x={22} y={143} width={28} height={19} rx={1.5} fill="#161d22" stroke="#4f636c" strokeWidth={0.7} />
      {[26.5, 34.5, 42.5].map((x) => (
        <rect key={x} x={x} y={162} width={3} height={4} fill="url(#lab-gold)" />
      ))}
      {[62, 89].map((x) => (
        <g key={x}>
          <rect x={x} y={146} width={17} height={14} rx={2} fill="#1a2227" stroke="#62757e" strokeWidth={0.7} />
          <circle cx={x + 8.5} cy={153} r={3.8} fill="#0d1215" stroke="#8a989f" strokeWidth={0.6} />
        </g>
      ))}
      <text x={70.5} y={168} textAnchor="middle" fontSize={4.6} fill="#8fb0b4" opacity={0.6} className="font-mono">EN</text>
      <text x={97.5} y={168} textAnchor="middle" fontSize={4.6} fill="#8fb0b4" opacity={0.6} className="font-mono">BOOT</text>
      <Led cx={118} cy={150} on={led !== 'off'} blink={led === 'blink'} />
      <rect x={58} y={176} width={23} height={14} rx={2.5} fill="url(#lab-steel)" stroke="#aab4b8" strokeWidth={0.6} />
      <rect x={62} y={180} width={15} height={5} rx={1} fill="#1f272c" />
    </g>
  )
}

/* Single-channel relay module: input header left (y 39.5), screw terminal right (y 52) */
export function Relay({ on }: { on: boolean }) {
  return (
    <g>
      <g filter="url(#lab-shadow)">
        <Board w={91} h={108} stroke="#678894" />
      </g>
      <circle cx={9} cy={99} r={3.3} fill="#071116" stroke="#c9b27f" strokeOpacity={0.55} strokeWidth={1.2} />
      <g transform="translate(-1 0)">
        <Header x={0} cy={39.5} />
      </g>
      <text x={11} y={58} fontSize={4.6} fill="#8fb0b4" opacity={0.6} className="font-mono">IN</text>
      {/* optocoupler */}
      <rect x={12} y={66} width={15} height={10} rx={1} fill="#13181b" stroke="#4a5a62" strokeWidth={0.6} />
      {[14.5, 21].map((x) => (
        <g key={x}>
          <rect x={x} y={63.5} width={2.2} height={2.6} fill="url(#lab-gold)" />
          <rect x={x} y={76} width={2.2} height={2.6} fill="url(#lab-gold)" />
        </g>
      ))}
      {/* relay cube, clicks down a touch when energised */}
      <motion.g animate={{ y: on ? [0, 0.9, 0] : 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
        <rect x={17} y={10} width={46} height={48} rx={3.5} fill="url(#lab-relay)" stroke="#94b4c7" strokeWidth={0.9} />
        <rect x={19} y={12} width={42} height={3} rx={1.5} fill="#fff" opacity={0.15} />
        <rect x={17} y={47} width={46} height={11} rx={3} fill="#000" opacity={0.18} />
        <text x={40} y={32} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#dde5e8">RELAY</text>
        <text x={40} y={42.5} textAnchor="middle" fontSize={7.5} fill="#a2b2ba">5 V</text>
      </motion.g>
      {/* terminal block */}
      <rect x={68} y={12} width={19} height={82} rx={2} fill="url(#lab-term)" stroke="#8e9da5" strokeWidth={0.8} />
      {[29, 52, 75].map((cy) => (
        <g key={cy}>
          <circle cx={77.5} cy={cy} r={6.2} fill="url(#lab-screw)" stroke="#c8d0d4" strokeWidth={0.5} />
          <path d={`M${74.4} ${cy - 3.1} L${80.6} ${cy + 3.1}`} stroke="#2b3337" strokeWidth={1.4} strokeLinecap="round" />
        </g>
      ))}
      <rect x={36} y={84} width={13} height={5} rx={1} fill="#c9b9a0" opacity={0.75} />
      <Led cx={14} cy={91} on={on} />
    </g>
  )
}

/* The appliance the relay switches: drawn as a fan that spins up when powered */
export function Device({ spin, blur }: { spin: MotionValue<number>; blur: MotionValue<number> }) {
  return (
    <g>
      <circle cx={22} cy={22} r={22} fill="#1a2329" stroke="#879ba4" strokeWidth={1.4} />
      <circle cx={22} cy={22} r={18.5} fill="none" stroke="#fff" strokeOpacity={0.07} />
      <motion.circle cx={22} cy={22} r={17} fill="url(#lab-fan-blur)" style={{ opacity: blur }} />
      <g transform="translate(22 22)">
        <motion.g style={{ rotate: spin }}>
          <circle r={17} fill="none" stroke="none" />
          {[0, 120, 240].map((a) => (
            <path
              key={a}
              transform={`rotate(${a})`}
              d="M0 0 C1.5 -9 6 -15.6 11 -14.6 C15 -13.6 12.6 -6 6.2 -2.6 C3.6 -1.1 1.6 -0.3 0 0Z"
              fill="url(#lab-blade)"
              opacity={0.85}
            />
          ))}
        </motion.g>
        <circle r={4} fill="#2e3e47" stroke="#ced9dd" strokeWidth={0.9} />
      </g>
    </g>
  )
}
