import { useId, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

/* Chrome-rimmed black document folder, drawn in a 680 × 470 box.
   Glossy black panels with a polished, rounded chrome bevel on every edge and a
   little visible thickness below each panel. The back panel carries a tab on
   the right; the front cover steps up a third of the way along.

   cover:   0 closed · 1 tab lifted (the cover peels off its tab) · 2 open
   Pointer: restrained 3D tilt, a small magnetic pull toward the cursor, and
   reflections (face sheen and chrome rim) that slide with it. Touch and
   reduced motion skip all of it. */

export const FOLDER_BACK =
  'M4 70 Q4 46 28 46 L430 46 C452 46 458 10 482 10 L652 10 Q676 10 676 34 L676 444 Q676 466 654 466 L26 466 Q4 466 4 444 Z'
export const FOLDER_FRONT =
  'M10 128 Q10 104 34 104 L198 104 C222 104 226 76 250 76 L646 76 Q670 76 670 100 L670 446 Q670 468 648 468 L32 468 Q10 468 10 446 Z'

export type CoverState = 0 | 1 | 2

/* polished chrome: alternating bright and dark bands, like a mirror rim
   reflecting a studio */
const CHROME = [
  [0, '#fbfbfc'], [0.07, '#b9bcc0'], [0.15, '#3b3d41'], [0.23, '#0c0d0f'], [0.33, '#d7d9dc'],
  [0.41, '#ffffff'], [0.5, '#8d9095'], [0.6, '#1b1c1f'], [0.71, '#73767b'], [0.81, '#f0f1f3'],
  [0.91, '#44464a'], [1, '#aaadb1'],
] as const

function ChromeStops() {
  return <>{CHROME.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</>
}

export function MetalFolder({
  cover,
  openAngle = -40,
  interactive,
  size = 'lg',
  coverContent,
  inside,
  tabLabel,
  onActivate,
  ariaLabel,
  className = '',
}: {
  cover: CoverState
  openAngle?: number
  interactive: boolean
  size?: 'lg' | 'sm'
  coverContent: ReactNode
  inside?: ReactNode
  tabLabel?: ReactNode
  onActivate?: () => void
  ariaLabel: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const live = interactive && !reduce

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const hover = useMotionValue(0)
  const sp = { stiffness: 170, damping: 20, mass: 0.7 }
  const pull = size === 'lg' ? 14 : 9
  const rotY = useSpring(useTransform(px, (v) => v * (size === 'lg' ? 10 : 12)), sp)
  const rotX = useSpring(useTransform(py, (v) => -v * (size === 'lg' ? 7 : 9)), sp)
  const magX = useSpring(useTransform(px, (v) => v * pull), sp)
  const magY = useSpring(useTransform([py, hover], (v: number[]) => v[0] * pull * 0.7 - v[1] * 6), sp)
  const sheenX = useSpring(useTransform(px, (v) => 300 + v * 560), sp)
  const sheenY = useSpring(useTransform(py, (v) => 250 + v * 400), sp)
  const sheenO = useSpring(useTransform(hover, (v) => 0.35 + v * 0.65), sp)
  // the chrome reflections slide along the rim as the folder turns
  const rimShift = useSpring(useTransform(px, (v) => v * 170), sp)
  const rimT = useTransform(rimShift, (v) => `translate(${v} ${v * 0.45})`)
  const shadowScale = useSpring(useTransform(hover, (v) => 1 + v * 0.07), sp)
  const shadowX = useSpring(useTransform(px, (v) => v * -pull * 1.6), sp)

  const reset = () => {
    px.set(0)
    py.set(0)
    hover.set(0)
  }
  if (!live && hover.get() !== 0) reset()

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!live || e.pointerType === 'touch' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set(Math.max(-0.6, Math.min(0.6, (e.clientX - r.left) / r.width - 0.5)))
    py.set(Math.max(-0.6, Math.min(0.6, (e.clientY - r.top) / r.height - 0.5)))
    hover.set(1)
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate || !interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  }

  const angle = cover === 2 ? openAngle : cover === 1 ? -7 : 0
  const lift = cover === 1 ? '-1.6%' : '0%'
  const id = (k: string) => `${k}${uid}`

  /* one chrome bevel: dark outer edge, mirror band, thin specular core */
  const bevel = (d: string, w = 1) => (
    <>
      <path d={d} fill="none" stroke="#020203" strokeWidth={11 * w} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={`url(#${id('chr')})`} strokeWidth={7.5 * w} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={`url(#${id('spc')})`} strokeWidth={1.7 * w} strokeLinejoin="round" />
    </>
  )

  return (
    <div className={`relative w-full [container-type:inline-size] ${className}`} style={{ perspective: size === 'lg' ? 1700 : 1200 }}>
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute left-[8%] right-[8%] rounded-[50%] bg-black ${size === 'lg' ? '-bottom-[8%] h-[16%] blur-2xl' : '-bottom-[7%] h-[14%] blur-xl'}`}
        style={{ scaleX: shadowScale, x: shadowX }}
      />
      <motion.div
        ref={ref}
        role={onActivate ? 'button' : undefined}
        tabIndex={onActivate && interactive ? 0 : -1}
        aria-label={ariaLabel}
        aria-expanded={onActivate ? cover > 0 : undefined}
        onClick={() => interactive && onActivate?.()}
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className={`relative aspect-[680/470] w-full rounded-[22px] outline-none ${interactive && onActivate ? 'cursor-pointer' : ''} focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[12px] focus-visible:outline-silver/70`}
        style={{ rotateX: rotX, rotateY: rotY, x: magX, y: magY, transformStyle: 'preserve-3d' }}
      >
        {/* shared paint for this folder */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <motion.linearGradient id={id('chr')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="680" y2="470" spreadMethod="reflect" gradientTransform={rimT}>
              <ChromeStops />
            </motion.linearGradient>
            <linearGradient id={id('chrD')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="680" y2="470">
              <stop offset="0" stopColor="#6c6f73" />
              <stop offset="0.5" stopColor="#202124" />
              <stop offset="1" stopColor="#55585c" />
            </linearGradient>
            <linearGradient id={id('spc')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="0.3" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.55)" />
            </linearGradient>
            <linearGradient id={id('bk')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#161719" />
              <stop offset="0.25" stopColor="#0b0b0c" />
              <stop offset="1" stopColor="#050506" />
            </linearGradient>
            <linearGradient id={id('bkHi')} gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="150">
              <stop offset="0" stopColor="rgba(255,255,255,0)" />
              <stop offset="0.35" stopColor="rgba(255,255,255,0.16)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id={id('fr')} gradientUnits="userSpaceOnUse" x1="40" y1="470" x2="640" y2="90">
              <stop offset="0" stopColor="#4a4c50" />
              <stop offset="0.38" stopColor="#1d1e21" />
              <stop offset="0.7" stopColor="#0c0c0e" />
              <stop offset="1" stopColor="#070708" />
            </linearGradient>
            <radialGradient id={id('rf')}>
              <stop offset="0" stopColor="rgba(255,255,255,0.11)" />
              <stop offset="0.55" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id={id('sh')}>
              <stop offset="0" stopColor="rgba(240,243,247,0.2)" />
              <stop offset="1" stopColor="rgba(240,243,247,0)" />
            </radialGradient>
            <linearGradient id={id('gl')} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(255,255,255,0)" />
              <stop offset="0.5" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <clipPath id={id('cf')}>
              <path d={FOLDER_FRONT} />
            </clipPath>
            <clipPath id={id('cb')}>
              <path d={FOLDER_BACK} />
            </clipPath>
          </defs>
        </svg>

        {/* back panel with its thickness */}
        <svg viewBox="0 0 680 470" className="absolute inset-0 z-0 h-full w-full overflow-visible" aria-hidden>
          <g transform="translate(0 7)">
            <path d={FOLDER_BACK} fill="#050506" />
            <path d={FOLDER_BACK} fill="none" stroke={`url(#${id('chrD')})`} strokeWidth="7" />
          </g>
          <path d={FOLDER_BACK} fill={`url(#${id('bk')})`} />
          <g clipPath={`url(#${id('cb')})`}>
            <rect x="0" y="40" width="680" height="120" fill={`url(#${id('bkHi')})`} />
          </g>
          {bevel(FOLDER_BACK)}
        </svg>
        {tabLabel && (
          <div className="pointer-events-none absolute right-[6.5%] top-[4.2%] z-0 font-mono text-[clamp(7px,1.6cqw,11px)] uppercase tracking-[0.16em] text-silver/75">
            {tabLabel}
          </div>
        )}

        {/* layered files sit between the back panel and the cover */}
        <div className="absolute inset-0 z-[1]" style={{ transform: 'translateZ(1px)', transformStyle: 'preserve-3d' }}>
          {inside}
        </div>

        {/* front cover, hinged on its bottom edge */}
        <motion.div
          className="absolute inset-0 z-[2]"
          style={{ transformOrigin: '50% 99.4%', transformStyle: 'preserve-3d', z: 2 }}
          initial={false}
          animate={{ rotateX: angle, y: lift }}
          transition={
            cover === 2
              ? { type: 'spring', stiffness: 95, damping: 15, mass: 1.05 }
              : cover === 1
                ? { type: 'spring', stiffness: 320, damping: 22 }
                : { type: 'spring', stiffness: 150, damping: 21 }
          }
        >
          <svg viewBox="0 0 680 470" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <g transform="translate(0 8)">
              <path d={FOLDER_FRONT} fill="#040405" />
              <path d={FOLDER_FRONT} fill="none" stroke={`url(#${id('chrD')})`} strokeWidth="7.5" />
            </g>
            <path d={FOLDER_FRONT} fill={`url(#${id('fr')})`} />
            <g clipPath={`url(#${id('cf')})`}>
              <ellipse cx="110" cy="440" rx="420" ry="300" fill={`url(#${id('rf')})`} />
              <motion.ellipse rx="320" ry="220" fill={`url(#${id('sh')})`} cx={sheenX} cy={sheenY} style={{ opacity: sheenO }} />
            </g>
            {bevel(FOLDER_FRONT)}
            {/* a glint runs along the tab edge as the cover lifts */}
            <motion.path
              d="M198 104 C222 104 226 76 250 76 L470 76"
              fill="none"
              stroke={`url(#${id('gl')})`}
              strokeWidth="3"
              initial={false}
              animate={{ opacity: cover >= 1 ? 1 : 0, pathLength: cover >= 1 ? 1 : 0.2 } as never}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 select-none">{coverContent}</div>

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: 'inset(16% 1% 0 1% round 18px)' }}
            initial={false}
            animate={{ backgroundColor: cover === 2 ? 'rgba(3,3,4,0.45)' : 'rgba(3,3,4,0)' }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
