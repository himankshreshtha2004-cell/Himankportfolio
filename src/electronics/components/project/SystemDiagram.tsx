import { useRef } from 'react'
import { useArchive } from '../../lib/scroll'
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import type { DiagramEdge, DiagramNode } from '../../data/types'

/* Technical blueprint. As the figure scrolls into view the drawing builds
   column by column — inputs, link, processing, outputs — and each connection
   draws in with its label. Small screens get a stacked version. */

const COL_X = [0, 300, 560, 880]
const COL_W = [200, 170, 230, 200]
const NODE_H = 64
const LINE_H = 21
const GAP = 22
const W = 1080
const COLS = ['Inputs', 'Link', 'Processing', 'Outputs']
const START = [0.02, 0.2, 0.38, 0.56] // scroll progress at which each column appears

type Placed = DiagramNode & { x: number; y: number; w: number; h: number }

function layout(nodes: DiagramNode[]) {
  const STEP = NODE_H + GAP
  const TOP = 18
  const coreH = (n: DiagramNode) => 56 + (n.lines?.length ?? 0) * LINE_H
  const rowsOf = (c: number) => nodes.filter((n) => n.col === c).map((n, i) => n.row ?? i)
  const maxRow = Math.max(0, ...[0, 1, 3].flatMap(rowsOf))
  const gridH = (maxRow + 1) * STEP - GAP
  const cores = nodes.filter((n) => n.col === 2)
  const coresH = cores.reduce((a, n) => a + coreH(n), 0) + Math.max(0, cores.length - 1) * GAP
  const H = Math.max(gridH, coresH) + TOP * 2
  const off = TOP + (H - TOP * 2 - gridH) / 2
  const placed: Placed[] = []
  ;[0, 1, 3].forEach((c) => {
    nodes.filter((n) => n.col === c).forEach((n, i) => {
      placed.push({ ...n, x: COL_X[c], y: off + (n.row ?? i) * STEP, w: COL_W[c], h: NODE_H })
    })
  })
  let y = TOP + (H - TOP * 2 - coresH) / 2
  cores.forEach((n) => {
    placed.push({ ...n, x: COL_X[2], y, w: COL_W[2], h: coreH(n) })
    y += coreH(n) + GAP
  })
  return { placed, H }
}

function geometry(a: Placed, b: Placed, fanOut: boolean) {
  if (a.col === b.col) {
    const x = a.x + a.w / 2
    return { d: `M${x} ${a.y + a.h} L${x} ${b.y}`, lx: x + 8, ly: (a.y + a.h + b.y) / 2 + 4, anchor: 'start' as const }
  }
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2
  const mx = (x1 + x2) / 2
  const d = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
  // label near the source exit, or near the target when one source fans out
  return fanOut
    ? { d, lx: x2 - 45, ly: y2 - 8, anchor: 'middle' as const }
    : { d, lx: x1 + 46, ly: y1 - 8, anchor: 'middle' as const }
}

export function SystemDiagram({ nodes, edges, caption, source }: { nodes: DiagramNode[]; edges: DiagramEdge[]; caption: string; source: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scroller } = useArchive()
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ['start 88%', 'center 42%'] })
  const progress = useTransform(scrollYProgress, (v) => (reduce ? 1 : v))
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const { placed, H } = layout(nodes)
  const byId = Object.fromEntries(placed.map((p) => [p.id, p]))
  const outCount = (id: string) => edges.filter((e) => e.from === id).length

  return (
    <figure ref={ref} className="metal-edge relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-ink2/90">
      {/* blueprint field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(169,184,198,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(169,184,198,0.045)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <Corners />

      <div className="relative p-4 sm:p-7">
        {/* desktop drawing */}
        <div className="hidden md:block">
          <div className="mb-3 grid font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute" style={{ gridTemplateColumns: COL_X.map((x, i) => `${((i < 3 ? COL_X[i + 1] : W) - x) / W}fr`).join(' ') }}>
            {COLS.map((c, i) => <ColLabel key={c} label={c} progress={progress} at={START[i]} />)}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`System diagram. ${caption}`}>
            <defs>
              <marker id="bp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 1 L9 5 L0 9" fill="none" stroke="#C4C6C8" strokeWidth="1.4" />
              </marker>
            </defs>
            {edges.map((e) => {
              const a = byId[e.from]
              const b = byId[e.to]
              if (!a || !b) return null
              const g = geometry(a, b, outCount(e.from) > 1)
              const from = START[b.col] - 0.06
              return <Edge key={`${e.from}-${e.to}`} edge={e} g={g} progress={progress} window={[from, from + 0.16]} />
            })}
            {placed.map((n) => <Node key={n.id} n={n} progress={progress} at={START[n.col]} />)}
          </svg>
        </div>

        {/* small screens */}
        <div className="md:hidden">
          {[0, 1, 2, 3].map((c) => {
            const ns = placed.filter((n) => n.col === c)
            if (!ns.length) return null
            const into = edges.filter((e) => ns.some((n) => n.id === e.to) && byId[e.from]?.col !== c && e.label).map((e) => e.label)
            return (
              <motion.div
                key={c}
                initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 }}
                animate={inView || reduce ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: reduce ? 0 : c * 0.2 }}
              >
                {c > 0 && (
                  <div className="my-2 flex items-center justify-center gap-2 text-silver/60">
                    <ArrowDown size={15} aria-hidden />
                    {into.length > 0 && <span className="font-mono text-[10.5px] text-mute">{[...new Set(into)].join(' · ')}</span>}
                  </div>
                )}
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{COLS[c]}</p>
                <div className={`grid gap-2 ${ns.length > 1 && c !== 2 ? 'grid-cols-2' : ''}`}>
                  {ns.map((n) => (
                    <div key={n.id} className={`rounded-xl border p-3 ${n.optional ? 'border-dashed border-white/20' : n.lines ? 'border-white/20 bg-graphite' : 'border-white/10 bg-ink'}`}>
                      <p className="text-[14px] font-medium text-paper">{n.label}</p>
                      {n.sub && <p className="mt-0.5 font-mono text-[11px] text-mute">{n.sub}</p>}
                      {n.lines && (
                        <ul className="mt-2 space-y-1 font-mono text-[11.5px] text-silver">
                          {n.lines.map((l) => <li key={l}>· {l}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* title block */}
        <figcaption className="mt-6 grid gap-3 border-t border-white/[0.07] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <span className="text-[13px] leading-relaxed text-mute">{caption}</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute/80 sm:text-right">{source}</span>
        </figcaption>
      </div>
    </figure>
  )
}

function ColLabel({ label, progress, at }: { label: string; progress: MotionValue<number>; at: number }) {
  const opacity = useTransform(progress, [at, at + 0.1], [0.25, 1])
  return <motion.span style={{ opacity }}>{label}</motion.span>
}

function Node({ n, progress, at }: { n: Placed; progress: MotionValue<number>; at: number }) {
  const opacity = useTransform(progress, [at, at + 0.12], [0, 1])
  const y = useTransform(progress, [at, at + 0.12], [12, 0])
  return (
    <motion.g style={{ opacity, y }}>
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={12} fill={n.lines ? '#1d2024' : '#141619'}
        stroke={n.optional || n.lines ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.11)'} strokeDasharray={n.optional ? '5 5' : undefined} />
      <text x={n.x + 16} y={n.y + 27} fill="#E8E8E6" fontSize={15.5} fontWeight={560} fontFamily="Geist Variable, sans-serif">{n.label}</text>
      {n.sub && <text x={n.x + 16} y={n.y + 47} fill="#92969C" fontSize={11.5} fontFamily="Geist Mono Variable, monospace">{n.sub}</text>}
      {n.lines?.map((l, i) => (
        <g key={l}>
          <circle cx={n.x + 19} cy={n.y + 55 + i * LINE_H} r={1.8} fill="#92969C" />
          <text x={n.x + 29} y={n.y + 59 + i * LINE_H} fill="#C4C6C8" fontSize={12} fontFamily="Geist Mono Variable, monospace">{l}</text>
        </g>
      ))}
    </motion.g>
  )
}

function Edge({
  edge, g, progress, window: [a, b],
}: {
  edge: DiagramEdge
  g: { d: string; lx: number; ly: number; anchor: 'start' | 'middle' }
  progress: MotionValue<number>
  window: [number, number]
}) {
  const pathLength = useTransform(progress, [a, b], [0, 1])
  const opacity = useTransform(progress, [a, a + 0.03], [0, 1])
  const labelOpacity = useTransform(progress, [b - 0.04, b + 0.04], [0, 1])
  const w = (edge.label?.length ?? 0) * 6.6 + 10
  return (
    <g>
      <motion.path
        d={g.d}
        fill="none"
        stroke={edge.dashed ? 'rgba(196,198,200,0.45)' : 'rgba(196,198,200,0.78)'}
        strokeWidth={1.3}
        strokeDasharray={edge.dashed ? '5 6' : undefined}
        markerEnd="url(#bp-arrow)"
        style={{ pathLength, opacity }}
      />
      {edge.label && (
        <motion.g style={{ opacity: labelOpacity }}>
          <rect x={g.anchor === 'middle' ? g.lx - w / 2 : g.lx - 4} y={g.ly - 11} width={w} height={15} rx={4} fill="#111316" />
          <text x={g.lx} y={g.ly} textAnchor={g.anchor} fill="#A9B8C6" fontSize={10.5} fontFamily="Geist Mono Variable, monospace">{edge.label}</text>
        </motion.g>
      )}
    </g>
  )
}

function Corners() {
  const c = 'absolute h-3 w-3 border-silver/30'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-3">
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}
