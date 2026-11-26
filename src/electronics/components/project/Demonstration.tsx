import { useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Clapperboard } from 'lucide-react'
import type { Project, Stage, VideoSource } from '../../data/types'
import { VideoPlayer } from './VideoPlayer'
import { easeOut } from '../../lib/motion'

type TabKey = 'explained' | 'inAction'
const TABS: { key: TabKey; num: string; label: string }[] = [
  { key: 'explained', num: '01', label: 'Explained' },
  { key: 'inAction', num: '02', label: 'In action' },
]

/* Two-video demonstration: an AI explainer and the real prototype footage.
   Switching tabs pauses the other video. Stages highlight by time only when
   a stage has a verified `at` timestamp in the data. */
export function Demonstration({ project }: { project: Project }) {
  const { media, stages } = project
  const firstWithVideo: TabKey = media.explained.src ? 'explained' : 'inAction'
  const [tab, setTab] = useState<TabKey>(firstWithVideo)
  const [time, setTime] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onTabKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    setTab(TABS[next].key)
    tabRefs.current[next]?.focus()
  }

  const timed = tab === 'explained' && stages.some((s) => typeof s.at === 'number')
  const activeStage = timed
    ? stages.reduce((acc, s, i) => (typeof s.at === 'number' && time >= s.at ? i : acc), -1)
    : -1
  const portrait = media[tab].orientation === 'portrait' && !!media[tab].src

  return (
    <div className="metal-edge rounded-[20px] border border-white/[0.07] bg-ink2/90 p-3 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-4 sm:px-1">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-mute">{project.shortTitle} · System demonstration</p>
        </div>
        <div role="tablist" aria-label="Demonstration videos" className="flex rounded-xl border border-white/[0.07] bg-ink p-1">
          {TABS.map((t, i) => {
            const on = tab === t.key
            return (
              <button
                key={t.key}
                ref={(el) => { tabRefs.current[i] = el }}
                role="tab"
                id={`tab-${project.slug}-${t.key}`}
                aria-selected={on}
                aria-controls={`panel-${project.slug}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => onTabKey(e, i)}
                className="relative rounded-[9px] px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.12em] sm:px-4"
              >
                {on && (
                  <motion.span layoutId={`demo-tab-${project.slug}`} className="absolute inset-0 rounded-[9px] border border-white/[0.14] bg-graphite" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                )}
                <span className={`relative transition-colors duration-200 ${on ? 'text-paper' : 'text-mute hover:text-paper'}`}>
                  {t.num} <span className="text-white/25">/</span> {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={`grid gap-4 ${portrait ? 'md:grid-cols-[minmax(0,380px)_1fr]' : ''}`}>
        <div id={`panel-${project.slug}`} role="tabpanel" aria-labelledby={`tab-${project.slug}-${tab}`} className="relative min-w-0">
          {/* both players stay mounted so switching keeps their position; the hidden one is paused */}
          {TABS.map((t) => {
            const src: VideoSource = media[t.key]
            const on = t.key === tab
            return (
              <motion.div
                key={t.key}
                initial={false}
                animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.985 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className={on ? 'relative' : 'pointer-events-none absolute inset-0 invisible'}
                aria-hidden={!on}
              >
                {src.src ? (
                  <VideoPlayer source={{ ...src, src: src.src }} label={`${project.shortTitle} ${t.label}`} active={on} onTime={t.key === 'explained' ? setTime : undefined} />
                ) : (
                  <PendingVideo note={src.pendingNote} />
                )}
              </motion.div>
            )
          })}
        </div>

        <StageList stages={stages} active={activeStage} timed={timed} wide={!portrait} />
      </div>
    </div>
  )
}

function PendingVideo({ note }: { note?: string }) {
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[14px] border border-dashed border-white/[0.12] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.02)_0_14px,transparent_14px_28px)]">
      <div className="max-w-[40ch] px-6 text-center">
        <Clapperboard className="mx-auto text-mute" size={24} strokeWidth={1.5} />
        <p className="mt-3 text-[15px] font-medium text-paper">Explainer video coming soon</p>
        {note && <p className="mt-1 text-[13.5px] text-mute">{note}</p>}
        <p className="mt-3 inline-block rounded-md border border-dashed border-placeholder/50 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-placeholder">
          Video A placeholder
        </p>
      </div>
    </div>
  )
}

function StageList({ stages, active, timed, wide }: { stages: Stage[]; active: number; timed: boolean; wide: boolean }) {
  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-ink/60 p-4">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">Operating stages</p>
      <ol className={`mt-3 grid gap-1 ${wide ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
        {stages.map((s, i) => {
          const on = i === active
          return (
            <li key={s.title} className="relative rounded-lg px-3 py-2.5">
              <AnimatePresence>
                {on && (
                  <motion.span layoutId="stage-hl" className="absolute inset-0 rounded-lg bg-graphite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                )}
              </AnimatePresence>
              <div className="relative flex gap-3">
                <span className={`tabular mt-[2px] font-mono text-[11px] ${on ? 'text-paper' : 'text-mute'}`}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className={`text-[14px] font-medium ${on ? 'text-paper' : 'text-paper/90'}`}>{s.title}</p>
                  <p className="text-[13px] leading-snug text-mute">{s.detail}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      {!timed && <p className="mt-3 px-3 text-[12px] leading-snug text-mute/80">Stages from the research report. They will follow the explainer video once its timings are added.</p>}
    </div>
  )
}
