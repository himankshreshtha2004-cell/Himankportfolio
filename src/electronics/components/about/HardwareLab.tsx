import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { about, type LabPart, type PartId, type StageKey } from '../../data/about'
import { navigate } from '../../lib/router'
import { easeOut } from '../../lib/motion'
import { Device, Dht11, Esp32, LabDefs, Pir, Relay, SIZE } from './LabParts'
import { TALL, WIDE, type LabLayout, type WireKey } from './layouts'
import { T, clamp, stageAt, tourAt, win, type Stage } from './timeline'

const lab = about.lab
const STAGE_NUM: Record<StageKey, number> = { sense: 1, decide: 2, respond: 3 }

/* ── wires ─────────────────────────────────────────────────────────────── */

function Wire({
  d,
  draw,
  pulse,
  dim,
}: {
  d: string
  draw: MotionValue<number>
  pulse: MotionValue<number>
  dim: boolean
}) {
  const ref = useRef<SVGPathElement>(null)
  const len = useRef(0)
  useLayoutEffect(() => {
    len.current = ref.current?.getTotalLength() ?? 0
  }, [d])
  const at = (p: number) => (ref.current && p >= 0 ? ref.current.getPointAtLength(len.current * p) : { x: -99, y: -99 })
  const hx = useTransform(pulse, (p) => at(p).x)
  const hy = useTransform(pulse, (p) => at(p).y)
  const headOpacity = useTransform(pulse, (p) => (p < 0 ? 0 : p < 0.08 ? p / 0.08 : p > 0.93 ? (1 - p) / 0.07 : 1))
  const TAIL = 0.24
  const tailLength = useTransform(pulse, (p) => (p <= 0 ? 0 : Math.min(p, TAIL)))
  const tailOffset = useTransform(pulse, (p) => Math.max(0, p - TAIL))
  const litOpacity = useTransform(draw, (v) => (v > 0.002 ? 0.94 : 0))

  return (
    <g style={{ opacity: dim ? 0.26 : 1, transition: 'opacity .35s var(--ease-out)' }}>
      <path d={d} fill="none" stroke="#0e1519" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#38444d" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path
        ref={ref}
        d={d}
        fill="none"
        stroke="#b2ccd6"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#lab-glow)"
        style={{ pathLength: draw, opacity: litOpacity }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#eefbfd"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#lab-glow)"
        style={{ pathLength: tailLength, pathOffset: tailOffset, opacity: headOpacity }}
      />
      <motion.circle r={3.7} fill="#f2fdff" filter="url(#lab-glow)" style={{ x: hx, y: hy, opacity: headOpacity }} />
    </g>
  )
}

function Via({ x, y, at, draw }: { x: number; y: number; at: number; draw: MotionValue<number> }) {
  const fill = useTransform(draw, (v) => (v >= at ? '#cfe2e8' : '#43515b'))
  const glow = useTransform(draw, (v) => (v >= at ? 1 : 0))
  return (
    <g>
      <motion.circle cx={x} cy={y} r={6} fill="url(#lab-led)" style={{ opacity: glow }} />
      <motion.circle cx={x} cy={y} r={3} style={{ fill }} stroke="#0e1519" strokeWidth={1} />
    </g>
  )
}

/* ── parts ─────────────────────────────────────────────────────────────── */

function PartNode({
  id,
  layout,
  active,
  dim,
  tipId,
  onEnter,
  onLeave,
  onToggle,
  children,
}: {
  id: PartId
  layout: LabLayout
  active: boolean
  dim: boolean
  tipId: string
  onEnter: (id: PartId) => void
  onLeave: (id: PartId) => void
  onToggle: (id: PartId) => void
  children: ReactNode
}) {
  const part = lab.parts[id]
  const [x, y] = layout.parts[id]
  const landscape = id === 'esp' && layout.espLandscape
  const w = landscape ? SIZE.esp.h : SIZE[id].w
  const h = landscape ? SIZE.esp.w : SIZE[id].h
  const showLabels = id !== 'esp'
  const labelY = h + 20

  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(id)
    } else if (e.key === 'Escape') {
      ;(e.currentTarget as SVGGElement).blur()
    }
  }

  return (
    <g transform={`translate(${x} ${y})`}>
      <g
        className={`lab-node ${active ? 'is-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`${part.title}. ${part.description}`}
        aria-describedby={active ? tipId : undefined}
        style={{ opacity: dim ? 0.3 : 1 }}
        onPointerEnter={(e: PointerEvent) => e.pointerType !== 'touch' && onEnter(id)}
        onPointerLeave={(e: PointerEvent) => e.pointerType !== 'touch' && onLeave(id)}
        onFocus={() => onEnter(id)}
        onBlur={() => onLeave(id)}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(id)
        }}
        onKeyDown={onKey}
      >
        {/* generous hit area */}
        <rect x={-10} y={-10} width={w + 20} height={h + (showLabels ? 58 : 20)} fill="transparent" />
        <rect className="lab-ring" x={-7} y={-7} width={w + 14} height={h + 14} rx={11} fill="none" stroke="#b2ccd6" strokeWidth={1.2} strokeDasharray="3 3" />
        <g className="lab-lift">{children}</g>
        {showLabels && (
          <g className="font-mono uppercase" textAnchor="middle">
            <text x={w / 2} y={labelY} fontSize={layout.label} letterSpacing={1.4} className="lab-label">
              {part.label}
            </text>
            {part.sub && (
              <text x={w / 2} y={labelY + layout.dim + 5} fontSize={layout.dim} letterSpacing={1} fill="#7f8b93">
                {part.sub}
              </text>
            )}
          </g>
        )}
      </g>
    </g>
  )
}

/* ── tooltip, kept inside the diagram ──────────────────────────────────── */

function Tip({
  id,
  part,
  anchor,
  layout,
  boxW,
}: {
  id: string
  part: LabPart
  anchor: LabLayout['tips'][PartId]
  layout: LabLayout
  boxW: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !boxW) return
    const k = boxW / layout.w
    const boxH = layout.h * k
    const tw = el.offsetWidth
    const th = el.offsetHeight
    const left = anchor.x * k - anchor.ax * tw
    const top = anchor.y * k - anchor.ay * th
    setPos({
      left: Math.max(-4, Math.min(boxW - tw + 4, left)),
      top: Math.max(-8, Math.min(boxH - th + 8, top)),
    })
  }, [anchor, boxW, layout])

  return (
    <div ref={ref} className="absolute" style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}>
      <motion.div
        id={id}
        role="tooltip"
        className="lab-tip w-[min(236px,62vw)]"
        initial={{ opacity: 0, y: anchor.ay === 1 ? 8 : -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: easeOut } }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
        style={{ transformOrigin: `${anchor.ax * 100}% ${anchor.ay * 100}%` }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.11em] text-[#9aabb4]">{part.kicker}</p>
        <p className="mt-2 text-[16px] font-semibold tracking-[-0.01em] text-[#eef1f2]">{part.title}</p>
        <p className="mt-1.5 text-[12px] leading-[1.5] text-[#a2adb3]">{part.description}</p>
        <ul className="mt-3 space-y-1 border-t border-white/[0.08] pt-2.5 font-mono text-[10.5px] tracking-[0.02em] text-[#c3d2d8]">
          {part.specs.map((sp) => (
            <li key={sp} className="flex items-baseline gap-2">
              <span className="h-[3px] w-[3px] shrink-0 -translate-y-[2px] rounded-full bg-[#b2ccd6]" />
              {sp}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}

/* ── the panel ─────────────────────────────────────────────────────────── */

export function HardwareLab({
  clock,
  focus,
  replay,
  onReplay,
  onPartStage,
}: {
  clock: MotionValue<number>
  /** stage picked from the SENSE / DECIDE / RESPOND row */
  focus: StageKey | null
  replay: number
  onReplay: () => void
  /** reports the stage of the part being inspected, to light the row */
  onPartStage: (s: StageKey | null) => void
}) {
  const reduce = useReducedMotion()
  const tipId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const inView = useInView(panelRef)

  /* layout follows the diagram's own width */
  const [layout, setLayout] = useState<LabLayout>(WIDE)
  const [boxW, setBoxW] = useState(0)
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setLayout(e.contentRect.width < 430 ? TALL : WIDE)
      setBoxW(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* discrete states derived from the clock */
  const [stage, setStage] = useState<Stage>('pre')
  const [tour, setTour] = useState<PartId | null>(null)
  const [relayOn, setRelayOn] = useState(false)
  const [fanOn, setFanOn] = useState(false)
  const [done, setDone] = useState(false)
  const sync = (t: number) => {
    setStage(stageAt(t))
    setTour(tourAt(t))
    setRelayOn(t >= T.actA[1])
    setFanOn(t >= T.actB[1])
    setDone(t >= T.END - 0.05)
  }
  useMotionValueEvent(clock, 'change', sync)
  useEffect(() => sync(clock.get()), []) // eslint-disable-line react-hooks/exhaustive-deps

  /* user inspection */
  const [hover, setHover] = useState<PartId | null>(null)
  const [pinned, setPinned] = useState<PartId | null>(null)
  const [engaged, setEngaged] = useState(false)
  useEffect(() => {
    if (replay) {
      setEngaged(false)
      setPinned(null)
    }
  }, [replay])
  const userPart = hover ?? pinned
  const shown: PartId | null = userPart ?? (engaged || reduce ? null : tour)
  const partStage = userPart ? lab.parts[userPart].stage : null
  useEffect(() => onPartStage(partStage), [partStage, onPartStage])
  const emphasis: StageKey | null = focus ?? partStage

  const enter = (id: PartId) => {
    setEngaged(true)
    setHover(id)
  }
  const leave = (id: PartId) => setHover((h) => (h === id ? null : h))
  const toggle = (id: PartId) => {
    setEngaged(true)
    setPinned((p) => (p === id ? null : id))
  }

  /* looping pulse used when a stage is emphasised */
  const loop = useMotionValue(-1)
  const emph = useMotionValue(0)
  useEffect(() => {
    emph.set(emphasis ? STAGE_NUM[emphasis] : 0)
    if (!emphasis || reduce) {
      loop.set(-1)
      return
    }
    loop.set(0)
    const c = animate(loop, 1, { duration: 1.3, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatDelay: 0.3 })
    return () => {
      c.stop()
      loop.set(-1)
    }
  }, [emphasis, reduce, loop, emph])

  /* wire drawing and pulses */
  const senseDraw = useTransform(clock, (t) => win(T.sense, t))
  const actADraw = useTransform(clock, (t) => win(T.actA, t))
  const actBDraw = useTransform(clock, (t) => win(T.actB, t))
  const tl = (v: number) => (v > 0.03 && v < 0.985 ? v : -1)
  const sensePulse = useTransform([senseDraw, loop, emph], ([a, l, e]: number[]) => (e === 1 && l >= 0 ? l : tl(a)))
  const actAPulse = useTransform([actADraw, loop, emph], ([a, l, e]: number[]) =>
    e === 3 && l >= 0 ? (l < 0.5 ? l * 2 : -1) : tl(a),
  )
  const actBPulse = useTransform([actBDraw, loop, emph], ([a, l, e]: number[]) =>
    e === 3 && l >= 0 ? (l >= 0.5 ? (l - 0.5) * 2 : -1) : tl(a),
  )
  const draws: Record<WireKey, MotionValue<number>> = { senseA: senseDraw, senseB: senseDraw, actA: actADraw, actB: actBDraw }
  const pulses: Record<WireKey, MotionValue<number>> = { senseA: sensePulse, senseB: sensePulse, actA: actAPulse, actB: actBPulse }

  /* decide: halo, ripples and a sweep across the RF shield */
  const haloOpacity = useTransform(clock, (t) => win(T.decide, t) * 0.72)
  const ripple = (offset: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTransform([clock, loop, emph], ([t, l, e]: number[]) => {
      if (e === 2 && l >= 0) return (l + offset) % 1
      const q = (t - T.decide[0] - offset * 0.9) / 1.05
      return q > 0 && q < 1 ? q : -1
    })
  const r1 = ripple(0)
  const r2 = ripple(0.45)
  const rR1 = useTransform(r1, (q) => 70 + Math.max(q, 0) * 78)
  const rO1 = useTransform(r1, (q) => (q < 0 ? 0 : (1 - q) * 0.42))
  const rR2 = useTransform(r2, (q) => 70 + Math.max(q, 0) * 78)
  const rO2 = useTransform(r2, (q) => (q < 0 ? 0 : (1 - q) * 0.42))
  const scanX = useTransform([clock, loop, emph], ([t, l, e]: number[]) =>
    e === 2 && l >= 0 ? l * 160 : clamp((t - T.decide[0]) / 1.05) * 160,
  )

  /* respond: the fan spins up once the relay closes */
  const spin = useMotionValue(0)
  const blur = useMotionValue(0)
  const speed = useRef(0)
  const fanTarget = reduce ? 0 : emphasis === 'respond' ? 640 : fanOn ? 300 : 0
  useAnimationFrame((_, delta) => {
    if (!inView && speed.current === 0) return
    const target = inView ? fanTarget : 0
    speed.current += (target - speed.current) * Math.min(1, delta / 520)
    if (Math.abs(speed.current) < 0.5 && target === 0) speed.current = 0
    spin.set((spin.get() + (speed.current * delta) / 1000) % 360)
    blur.set(Math.min(1, speed.current / 520))
  })

  /* ghost cursor for the inspect tour */
  const cursorOn = !reduce && !engaged && tour !== null && !userPart
  const cx = useSpring(50, { stiffness: 70, damping: 17, mass: 0.9 })
  const cy = useSpring(50, { stiffness: 70, damping: 17, mass: 0.9 })
  const wasOn = useRef(false)
  useEffect(() => {
    const pt = tour ? layout.cursor[tour] : null
    if (pt) {
      const x = (pt[0] / layout.w) * 100
      const y = (pt[1] / layout.h) * 100
      if (!wasOn.current) {
        cx.jump(x - 6)
        cy.jump(y + 10)
      }
      cx.set(x)
      cy.set(y)
    }
    wasOn.current = cursorOn
  }, [tour, layout, cursorOn, cx, cy])
  const cLeft = useTransform(cx, (v) => `${v}%`)
  const cTop = useTransform(cy, (v) => `${v}%`)

  const progress = useTransform(clock, (t) => clamp(t / T.progress))

  const dimPart = (id: PartId) => emphasis !== null && lab.parts[id].stage !== emphasis
  const dimWire = (k: WireKey) => emphasis !== null && emphasis !== (k.startsWith('sense') ? 'sense' : 'respond')
  const statusKey: Stage = emphasis ?? stage
  const running = stage !== 'pre' && stage !== 'online' && !emphasis
  const espLed = emphasis === 'decide' || stage === 'decide' ? 'blink' : stage === 'respond' || stage === 'online' ? 'on' : 'off'
  const sensing = stage === 'sense' || emphasis === 'sense'
  const tip = shown ? lab.parts[shown] : null
  const tipPos = shown ? layout.tips[shown] : null

  /* graphite sheen that follows the pointer */
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = panelRef.current
    if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  const k = boxW ? boxW / layout.w : 1
  const fit: LabLayout = { ...layout, label: Math.max(layout.label, 10.5 / k), dim: Math.max(layout.dim, 8.6 / k) }
  const espW = layout.espLandscape ? SIZE.esp.h : SIZE.esp.w
  const espH = layout.espLandscape ? SIZE.esp.w : SIZE.esp.h

  return (
    <div>
      <div ref={panelRef} onPointerMove={onMove} className="lab-rim group/lab relative rounded-[16px] p-px">
        <div className="lab-panel relative overflow-hidden rounded-[15px]">
          <div aria-hidden className="lab-sheen pointer-events-none absolute inset-0 z-[1]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-500 group-hover/lab:opacity-100 lab-follow" />

          {/* header */}
          <div className="relative z-[2] flex min-h-[58px] items-center justify-between gap-4 border-b border-[#303940] bg-gradient-to-b from-[rgba(45,53,58,0.42)] to-[rgba(12,16,20,0.15)] px-4 py-3 sm:min-h-[64px] sm:px-6">
            <div className="min-w-0 font-mono uppercase">
              <p className="truncate text-[10.5px] tracking-[0.13em] text-[#c7d1d6] sm:text-[11px]">{lab.title}</p>
              <p className="mt-1 hidden truncate text-[10px] tracking-[0.1em] text-[#7f8a91] min-[420px]:block">{lab.subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#a3b6bc]">
              <span className={`lab-dot ${running ? 'is-running' : ''}`} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={statusKey}
                  initial={{ opacity: 0, y: 4, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
                  transition={{ duration: 0.18, ease: easeOut }}
                >
                  {lab.status[statusKey]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* diagram */}
          <div className="relative z-[2] px-2 pb-1 pt-3 sm:px-[18px] sm:pt-[18px]">
            <div
              ref={boxRef}
              className="relative mx-auto"
              style={{ aspectRatio: `${layout.w} / ${layout.h}`, maxWidth: layout.name === 'tall' ? 460 : undefined }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setEngaged(true)}
            >
              <svg
                viewBox={`0 0 ${layout.w} ${layout.h}`}
                className="absolute inset-0 h-full w-full overflow-visible"
                role="group"
                aria-label="Concept diagram of the Smart Home system: a DHT11 and an HC-SR501 sensor feed an ESP32, which drives a relay that switches an appliance. Select a part for details."
                onClick={() => setPinned(null)}
              >
                <defs>
                  <LabDefs />
                </defs>
                <rect width={layout.w} height={layout.h} fill="url(#lab-microgrid)" opacity={0.5} />
                <path d={layout.corners} stroke="#3b474e" strokeWidth={1} fill="none" opacity={0.7} />
                <g className="font-mono uppercase" fontSize={fit.dim + 1} letterSpacing={1.4}>
                  <text x={layout.text.system[0]} y={layout.text.system[1]} fill="#93a2ab">
                    {lab.systemLabel}
                  </text>
                  <text x={layout.text.scale[0]} y={layout.text.scale[1]} textAnchor="end" fill="#6f7c84" fontSize={fit.dim}>
                    {layout.text.compact ? `${lab.figure} · ${lab.scaleNote.split('/').pop()?.trim()}` : lab.scaleNote}
                  </text>
                  <text x={layout.text.foot[0]} y={layout.text.foot[1]} fill="#6f7c84" fontSize={fit.dim}>
                    {lab.footnote}
                  </text>
                  {!layout.text.compact && (
                    <text x={layout.text.fig[0]} y={layout.text.fig[1]} textAnchor="end" fill="#6f7c84" fontSize={fit.dim}>
                      {lab.figure}
                    </text>
                  )}
                </g>

                {/* decide: halo + ripples */}
                <motion.circle cx={layout.halo[0]} cy={layout.halo[1]} r={layout.name === 'tall' ? 120 : 150} fill="url(#lab-halo)" style={{ opacity: haloOpacity }} />
                <motion.circle
                  cx={layout.halo[0]}
                  cy={layout.halo[1]}
                  r={layout.name === 'tall' ? 120 : 150}
                  fill="url(#lab-halo)"
                  initial={false}
                  animate={{ opacity: emphasis === 'decide' ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
                <motion.circle cx={layout.halo[0]} cy={layout.halo[1]} fill="none" stroke="#b2ccd6" strokeWidth={1} r={rR1} style={{ opacity: rO1 }} />
                <motion.circle cx={layout.halo[0]} cy={layout.halo[1]} fill="none" stroke="#b2ccd6" strokeWidth={1} r={rR2} style={{ opacity: rO2 }} />

                {/* wires */}
                {(Object.keys(layout.wires) as WireKey[]).map((k) => (
                  <Wire key={`${layout.name}-${k}`} d={layout.wires[k]} draw={draws[k]} pulse={pulses[k]} dim={dimWire(k)} />
                ))}
                {(Object.keys(layout.vias) as WireKey[]).map((k) =>
                  layout.vias[k]!.map(([x, y, at]) => <Via key={`${layout.name}-${k}-${x}-${y}`} x={x} y={y} at={at} draw={draws[k]} />),
                )}

                {/* parts */}
                <PartNode id="dht" layout={fit} active={shown === 'dht'} dim={dimPart('dht')} tipId={tipId} onEnter={enter} onLeave={leave} onToggle={toggle}>
                  <Dht11 on={sensing || shown === 'dht'} />
                </PartNode>
                <PartNode id="pir" layout={fit} active={shown === 'pir'} dim={dimPart('pir')} tipId={tipId} onEnter={enter} onLeave={leave} onToggle={toggle}>
                  <Pir on={sensing || shown === 'pir'} header={layout.pirHeader} />
                </PartNode>
                <PartNode id="esp" layout={fit} active={shown === 'esp'} dim={dimPart('esp')} tipId={tipId} onEnter={enter} onLeave={leave} onToggle={toggle}>
                  {layout.espLandscape ? (
                    <>
                      <g transform={`translate(0 ${SIZE.esp.w}) rotate(-90)`}>
                        <Esp32 scanX={scanX} led={espLed} showLabel={false} label={lab.parts.esp.label} />
                      </g>
                      <rect x={espW / 2 - 33} y={espH / 2 - 18} width={66} height={36} rx={2.5} fill="#24303a" opacity={0.94} />
                      <text x={espW / 2} y={espH / 2 + 3} textAnchor="middle" fontSize={17} fontWeight={700} letterSpacing={-0.6} fill="#e8ecec">
                        {lab.parts.esp.label}
                      </text>
                      <text x={espW / 2} y={espH / 2 + 13.5} textAnchor="middle" fontSize={6.8} letterSpacing={1} fill="#aebcc2" className="font-mono uppercase">
                        {lab.parts.esp.sub}
                      </text>
                    </>
                  ) : (
                    <Esp32 scanX={scanX} led={espLed} label={lab.parts.esp.label} sub={lab.parts.esp.sub} />
                  )}
                </PartNode>
                <PartNode id="relay" layout={fit} active={shown === 'relay'} dim={dimPart('relay')} tipId={tipId} onEnter={enter} onLeave={leave} onToggle={toggle}>
                  <Relay on={relayOn || emphasis === 'respond'} />
                </PartNode>
                <PartNode id="device" layout={fit} active={shown === 'device'} dim={dimPart('device')} tipId={tipId} onEnter={enter} onLeave={leave} onToggle={toggle}>
                  <Device spin={spin} blur={blur} />
                </PartNode>
              </svg>

              {/* tooltip */}
              <div className="pointer-events-none absolute inset-0 z-10">
                <AnimatePresence>
                  {tip && tipPos && shown && (
                    <Tip key={`${shown}-${layout.name}`} id={tipId} part={tip} anchor={tipPos} layout={layout} boxW={boxW} />
                  )}
                </AnimatePresence>

                {/* ghost cursor */}
                <motion.div
                  aria-hidden
                  className="lab-cursor absolute"
                  style={{ left: cLeft, top: cTop }}
                  initial={false}
                  animate={{ opacity: cursorOn ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span
                    key={tour ?? 'none'}
                    className="block h-full w-full rounded-full"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1, 0.78, 1] }}
                    transition={{ duration: 0.9, times: [0, 0.55, 0.7, 1] }}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="relative z-[2] flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#303940] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#95a1a7] sm:min-h-[58px] sm:px-6 sm:text-[11px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={statusKey}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18, ease: easeOut }}
              >
                {lab.flow[statusKey]}
              </motion.span>
            </AnimatePresence>
            <span className="flex items-center gap-1">
              <button
                onClick={onReplay}
                disabled={!done && !reduce}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[#95a1a7] transition-[color,opacity] duration-200 hover:text-paper disabled:pointer-events-none disabled:opacity-35"
                aria-label="Replay the signal flow"
              >
                <RotateCcw size={12} strokeWidth={1.8} />
                <span className="hidden sm:inline">Replay</span>
              </button>
              <span className="text-white/15">/</span>
              <button
                onClick={() => navigate(`work-${lab.source.slug}`)}
                className="group/src flex h-8 items-center gap-1 rounded-lg px-2 text-[#95a1a7] transition-colors duration-200 hover:text-paper"
                title={`This diagram is drawn from ${lab.source.label}`}
              >
                {lab.source.label.split('·')[0].trim()}
                <ArrowUpRight size={13} className="transition-transform duration-200 ease-out group-hover/src:-translate-y-0.5 group-hover/src:translate-x-0.5" />
              </button>
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-[3] h-[2px] bg-[#252d33]">
            <motion.div className="h-full origin-left bg-[#c0d3da]" style={{ scaleX: progress, opacity: done ? 0.45 : 1 }} />
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4 px-0.5 pt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#7b868e] sm:text-[11px]">
        <span>{lab.tagline}</span>
        <span className="shrink-0">
          <span className="[@media(hover:none)]:hidden">Hover to inspect</span>
          <span className="hidden [@media(hover:none)]:inline">Tap to inspect</span> ↗
        </span>
      </div>
    </div>
  )
}
