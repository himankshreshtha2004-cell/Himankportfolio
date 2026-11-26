import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { ArrowDownRight, X } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { MetalFolder, type CoverState } from './MetalFolder'
import { LayeredFile, ProjectFolder, layoutSpring, type ArchivePhase } from './ProjectFiles'
import { navigate } from '../lib/router'
import { easeOut } from '../lib/motion'

const durations: Record<string, string> = { 'smart-home': '2:23', 'smart-kitchen': '1:50' }

/* 01 Identity screen → 02 Archive entrance → 03 Project explorer.
   Opening: the cover peels off its tab (lifting), swings open in 3D while the
   project files rise and fan out (opening), then the files become the two
   project folders of the explorer (open). */
export function Hero({
  intro,
  openSignal,
  onArchiveChange,
}: {
  intro: boolean
  openSignal: number
  onArchiveChange: (open: boolean) => void
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<ArchivePhase>('closed')
  const timers = useRef<number[]>([])
  const trayRef = useRef<HTMLDivElement>(null)

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, reduce ? 0 : ms))
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const open = useCallback(() => {
    if (phase !== 'closed') return
    clearTimers()
    onArchiveChange(true)
    setPhase('lifting')
    later(170, () => setPhase('opening'))
    later(820, () => setPhase('open'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduce, onArchiveChange])

  const close = useCallback(() => {
    if (phase !== 'open') return
    clearTimers()
    onArchiveChange(false)
    setPhase('closing')
    later(620, () => setPhase('closed'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduce, onArchiveChange])

  useEffect(() => () => clearTimers(), [])

  const lastSignal = useRef(openSignal)
  useEffect(() => {
    if (openSignal !== lastSignal.current) {
      lastSignal.current = openSignal
      open()
    }
  }, [openSignal, open])

  useEffect(() => {
    if (phase !== 'open') return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => trayRef.current?.focus({ preventScroll: true }), 400)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [phase, close])

  const explorer = phase === 'open'
  const cover: CoverState = phase === 'closed' ? 0 : phase === 'lifting' ? 1 : 2
  const d = (s: number) => (intro && !reduce ? s : 0)
  const nameWords = profile.name.split(' ')

  return (
    <section id="home" aria-label="Introduction" data-esc-busy={explorer ? "" : undefined} className="relative flex min-h-[calc(100svh-130px)] flex-col items-center px-4 pb-16 pt-28 sm:px-8 sm:pt-32">
      <LayoutGroup>
        <div className="relative w-full max-w-[1080px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {!explorer ? (
              /* 01 — identity */
              <motion.div
                key="identity"
                className="mx-auto text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut, delay: 0.1 } }}
                exit={{ opacity: 0, y: -18, filter: 'blur(4px)', transition: { duration: 0.3, ease: easeOut } }}
              >
                <h1 className="text-[clamp(52px,9.4vw,136px)] font-semibold leading-[0.9] tracking-[-0.055em] text-paper">
                  {nameWords.map((w, i) => (
                    <span key={w} className="mask-line sm:inline-block">
                      <motion.span
                        className="inline-block"
                        initial={intro && !reduce ? { y: '110%' } : false}
                        animate={{ y: '0%' }}
                        transition={{ delay: d(0.2 + i * 0.1), duration: 0.95, ease: easeOut }}
                      >
                        {w}
                        {i < nameWords.length - 1 && <span className="hidden sm:inline">&nbsp;</span>}
                      </motion.span>
                    </span>
                  ))}
                </h1>
                <motion.p
                  className="mx-auto mt-6 max-w-[46ch] text-balance text-[16px] leading-relaxed text-mute sm:text-[18px]"
                  initial={intro && !reduce ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: d(0.6), duration: 0.7, ease: easeOut }}
                >
                  {profile.description}
                </motion.p>
                <motion.p
                  className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-mute/80"
                  initial={intro && !reduce ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: d(0.85), duration: 0.6 }}
                >
                  {projects.length} projects <span className="px-1.5 text-white/20">·</span> ESP32 · ESP8266 <span className="px-1.5 text-white/20">·</span> 2025–26
                </motion.p>
              </motion.div>
            ) : (
              /* 03 — project explorer */
              <motion.div
                key="explorer"
                ref={trayRef}
                tabIndex={-1}
                role="region"
                aria-label="Project archive"
                className="relative z-20 outline-none"
              >
                <motion.div
                  className="mb-10 flex items-end justify-between gap-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.45, ease: easeOut } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-paper sm:text-[40px]">Project archive</h2>
                    <p className="mt-1 text-[14.5px] text-mute">Two research projects. Open a folder to step inside.</p>
                  </div>
                  <button
                    onClick={close}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.1] bg-ink2/80 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mute backdrop-blur transition-colors duration-200 hover:border-white/20 hover:text-paper"
                  >
                    <X size={14} /> Close <span className="hidden text-white/30 sm:inline">Esc</span>
                  </button>
                </motion.div>
                <div className="grid gap-x-10 gap-y-14 px-1 sm:grid-cols-2 sm:px-4">
                  {projects.map((p) => (
                    <ProjectFolder key={p.slug} project={p} duration={durations[p.slug] ?? ''} onOpen={() => navigate(`work-${p.slug}`)} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 02 — archive entrance */}
        <motion.div
          layout
          className={`relative z-10 w-full max-w-[620px] ${explorer ? 'mt-2 sm:-mt-16' : 'mt-10 sm:mt-12'}`}
          transition={{
            layout: layoutSpring,
            default: { duration: phase === 'closed' && intro ? 1.4 : 0.6, delay: phase === 'closed' ? d(0.95) : 0, ease: easeOut },
          }}
          initial={intro && !reduce ? { opacity: 0, y: 70, filter: 'blur(10px)', rotateX: 18 } : false}
          animate={{
            opacity: explorer ? 0.14 : 1,
            y: explorer ? 48 : 0,
            rotateX: 0,
            scale: explorer ? 1.04 : 1,
            filter: explorer ? 'blur(0px) brightness(0.65)' : 'blur(0px) brightness(1)',
          }}
          style={{ transformPerspective: 1600 }}
        >
          <div>
            <MetalFolder
              cover={cover}
              openAngle={-42}
              interactive={phase === 'closed'}
              onActivate={open}
              ariaLabel={`Open the project archive, ${projects.length} projects`}
              tabLabel={profile.monogram}
              inside={!explorer && projects.map((p, i) => <LayeredFile key={p.slug} project={p} index={i} phase={phase} />)}
              coverContent={
                <>
                  <ArrowDownRight className="absolute left-[6.5%] top-[26.5%] text-silver/60" style={{ width: '3.4cqw', height: '3.4cqw' }} strokeWidth={1.6} />
                  <div className="absolute left-[6.5%] top-[36%] pr-[6%]">
                    <p className="text-[clamp(10px,2.3cqw,15px)] text-silver/75">
                      Project archive <span className="px-[0.5em] text-silver/35">|</span> {String(projects.length).padStart(3, '0')} files
                    </p>
                    <p className="mt-[1cqw] font-semibold leading-[0.95] tracking-[-0.045em] text-[#cbcdcf] text-[clamp(26px,8.8cqw,62px)]">
                      Physical Computing
                      <br />+ AI
                    </p>
                  </div>
                  <p className="absolute bottom-[6.5%] left-[6.5%] font-mono text-[clamp(8px,1.65cqw,11px)] uppercase tracking-[0.18em] text-silver/60">
                    Open archive
                  </p>
                  <p className="absolute bottom-[6.5%] right-[6%] font-mono text-[clamp(8px,1.75cqw,12px)] tracking-[0.12em] text-silver/60">
                    {profile.archiveYear}
                  </p>
                </>
              }
            />
          </div>
          <AnimatePresence>
            {phase === 'closed' && (
              <motion.p
                className="mt-12 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-mute"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: d(2), duration: 0.6 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                Select the folder to open the archive
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </section>
  )
}
