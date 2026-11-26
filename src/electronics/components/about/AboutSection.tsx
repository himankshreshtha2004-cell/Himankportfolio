import { useArchive } from '../../lib/scroll'
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from 'motion/react'
import { about, type StageKey } from '../../data/about'
import { Field } from '../Field'
import { easeOut } from '../../lib/motion'
import { HardwareLab } from './HardwareLab'
import { T, stepAt, win } from './timeline'

/* 01 / About the maker  →  02 / The person behind the systems
   One clock drives the opening sequence, so type, panel and signal flow stay
   in step with the motion study. It starts when the section scrolls into
   view, waits for the panel on small screens, and pauses off-screen. */

function useWin(clock: MotionValue<number>, r: readonly number[]) {
  return useTransform(clock, (t) => win(r, t))
}

const STAGE_RANGE: Record<StageKey, readonly number[]> = {
  sense: T.sense,
  decide: T.decide,
  respond: [T.actA[0], T.actB[1]],
}

function Principle({
  item,
  clock,
  active,
  pinned,
  onHover,
  onToggle,
}: {
  item: (typeof about.principles)[number]
  clock: MotionValue<number>
  active: boolean
  pinned: boolean
  onHover: (k: StageKey | null) => void
  onToggle: (k: StageKey) => void
}) {
  const fill = useWin(clock, STAGE_RANGE[item.key])
  return (
    <button
      type="button"
      aria-pressed={pinned}
      onPointerEnter={(e: PointerEvent) => e.pointerType !== 'touch' && onHover(item.key)}
      onPointerLeave={(e: PointerEvent) => e.pointerType !== 'touch' && onHover(null)}
      onFocus={() => onHover(item.key)}
      onBlur={() => onHover(null)}
      onClick={() => onToggle(item.key)}
      className="group relative pt-3.5 text-left outline-offset-4"
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-px transition-colors duration-300 ${active ? 'bg-[#b4cbd5]' : 'bg-[#3b444c]'}`} />
      <motion.span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-[#b4cbd5]" style={{ scaleX: fill, opacity: active ? 0 : 0.4 }} />
      <span className={`block font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors duration-300 sm:text-[11px] ${active ? 'text-[#b4cbd5]' : 'text-[#737c84] group-hover:text-[#9aa4ab]'}`}>
        {item.num}
      </span>
      <span className={`mt-2.5 block text-[13px] font-medium uppercase tracking-[0.02em] transition-colors duration-300 min-[400px]:text-[15px] sm:text-[16px] ${active ? 'text-[#e4e9ec]' : 'text-[#737c84] group-hover:text-[#aab3b9]'}`}>
        {item.label}
      </span>
    </button>
  )
}

/* ── 02 · profile ──────────────────────────────────────────────────────── */

const reveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (d: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: d, ease: easeOut } }),
}
const lineUp: Variants = {
  hidden: { y: '108%' },
  show: (d: number = 0) => ({ y: '0%', transition: { duration: 0.95, delay: d, ease: easeOut } }),
}
const rule: Variants = {
  hidden: { scaleX: 0 },
  show: (d: number = 0) => ({ scaleX: 1, transition: { duration: 0.9, delay: d, ease: easeOut } }),
}

function Profile({ innerRef }: { innerRef: RefObject<HTMLDivElement> }) {
  const p = about.profile
  return (
    <div ref={innerRef} className="relative scroll-mt-20 border-t border-[#232b30]">
      <motion.div
        className="mx-auto grid max-w-[1240px] gap-x-12 gap-y-12 px-4 pb-28 pt-20 sm:px-8 sm:pb-36 sm:pt-24 lg:grid-cols-[0.72fr_1fr] lg:gap-x-10 xl:gap-x-12"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.22 }}
      >
        <div>
          <motion.p variants={reveal} className="flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#9aa9b2]">
            <motion.span variants={rule} className="block h-px w-[30px] origin-left bg-[#9aa9b2]" />
            {p.number}
          </motion.p>
          <h3 id="profile-h" className="mt-8 text-[clamp(42px,8.6vw,68px)] font-semibold leading-[1.04] tracking-[-0.058em] text-paper lg:text-[clamp(46px,4.3vw,68px)]">
            {p.heading.map((l, i) => (
              <span key={l} className="mask-line">
                <motion.span variants={lineUp} custom={0.08 + i * 0.1} className="block">
                  {l}
                </motion.span>
              </span>
            ))}
          </h3>
          <motion.p variants={reveal} custom={0.3} className="mt-6 max-w-[34ch] text-[16.5px] leading-[1.67] text-[#8f999f] sm:text-[17px]">
            {p.text}
          </motion.p>
          <div className="relative mt-9 max-w-[430px] pt-8">
            <motion.span aria-hidden variants={rule} custom={0.4} className="absolute inset-x-0 top-0 h-px origin-left bg-[#30393f]" />
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#aab6bd]">
              {p.process.map((step, i) => (
                <motion.span key={step} variants={reveal} custom={0.5 + i * 0.14} className="flex items-center gap-2.5">
                  {i > 0 && <span className="text-[#6c7880]">→</span>}
                  {step}
                </motion.span>
              ))}
            </p>
          </div>
        </div>

        <dl className="lg:pt-11">
          {p.details.map((d, i) => (
            <div key={d.label} className="relative grid gap-2 py-6 sm:grid-cols-[135px_1fr] sm:gap-8">
              {i > 0 && <motion.span aria-hidden variants={rule} custom={0.15 + i * 0.09} className="absolute inset-x-0 top-0 h-px origin-left bg-[#313941]" />}
              <motion.dt variants={reveal} custom={0.2 + i * 0.09} className="pt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7d8a92]">
                {d.label}
              </motion.dt>
              <motion.dd variants={reveal} custom={0.26 + i * 0.09} className="text-[16.5px] leading-[1.56] tracking-[-0.015em] text-[#d1d6d9] sm:text-[17px]">
                {d.lines?.map((l, j) => (
                  <span key={j} className="block">
                    <Field value={l} />
                  </span>
                ))}
                {d.tags && (
                  <ul className="flex flex-wrap gap-2.5">
                    {d.tags.map((t) => (
                      <li key={t} className="rounded-full border border-[#39434a] bg-white/[0.015] px-3 py-2 text-[13px] leading-none text-[#bac4c9] transition-colors duration-200 hover:border-[#5a6770] hover:text-paper">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </div>
  )
}

/* ── 01 · about the maker ──────────────────────────────────────────────── */

export function AboutSection() {
  const reduce = useReducedMotion()
  const clock = useMotionValue(reduce ? T.END : 0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const sectionIn = useInView(sectionRef, { margin: '0px 0px -22% 0px' })
  const panelIn = useInView(panelRef, { amount: 0.45 })
  const [replay, setReplay] = useState(0)

  // run the clock: up to GATE when the section shows, to the end once the panel shows
  useEffect(() => {
    if (reduce) {
      clock.set(T.END)
      return
    }
    const cur = clock.get()
    const target = panelIn ? T.END : sectionIn ? Math.max(cur, T.GATE) : cur
    if (target <= cur) return
    const c = animate(clock, target, { duration: target - cur, ease: 'linear' })
    return () => c.stop()
  }, [sectionIn, panelIn, reduce, replay, clock])

  const onReplay = useCallback(() => {
    clock.set(T.GATE)
    setReplay((n) => n + 1)
  }, [clock])

  // principles row: timeline step, or what the visitor is pointing at
  const [step, setStep] = useState<StageKey | null>(null)
  const [invite, setInvite] = useState(false)
  useMotionValueEvent(clock, 'change', (t) => {
    setStep(stepAt(t))
    setInvite(t >= T.invite)
  })
  const [hoverStage, setHoverStage] = useState<StageKey | null>(null)
  const [pinnedStage, setPinnedStage] = useState<StageKey | null>(null)
  const [partStage, setPartStage] = useState<StageKey | null>(null)
  const chosen = hoverStage ?? pinnedStage
  const lit = chosen ?? partStage ?? step

  // entrance, all from the clock
  const eyebrow = useWin(clock, T.eyebrow)
  const eyebrowY = useTransform(eyebrow, (v) => (1 - v) * 14)
  const lead = useWin(clock, T.lead)
  const leadY = useTransform(lead, (v) => (1 - v) * 15)
  const note = useWin(clock, T.note)
  const noteY = useTransform(note, (v) => (1 - v) * 12)
  const panel = useWin(clock, T.panel)
  const panelY = useTransform(panel, (v) => (1 - v) * 28)
  const panelScale = useTransform(panel, (v) => 0.974 + 0.026 * v)
  const principles = useWin(clock, T.principles)

  // scroll out: the hero eases up a little slower than the page
  const { scroller } = useArchive()
  const { scrollYProgress } = useScroll({ container: scroller, target: sectionRef, offset: ['start start', 'end start'] })
  const textDrift = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -36])
  const panelDrift = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70])
  const fadeOut = useTransform(scrollYProgress, [0.35, 1], [1, reduce ? 1 : 0.55])

  const toProfile = () => profileRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })

  return (
    <section id="about" aria-labelledby="about-h" className="relative scroll-mt-0 border-t border-white/[0.05]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_74%_42%,rgba(36,50,57,0.16),transparent_78%)]" />
      <div ref={sectionRef} className="relative mx-auto grid max-w-[1240px] gap-x-12 gap-y-14 px-4 pb-24 pt-28 sm:px-8 sm:pb-28 sm:pt-36 lg:min-h-[min(100svh,940px)] lg:grid-cols-[0.8fr_1fr] lg:items-center lg:gap-x-10 xl:gap-x-12">
        <motion.div style={{ y: textDrift, opacity: fadeOut }} className="relative z-[3] max-w-[640px]">
          <motion.p style={{ opacity: eyebrow, y: eyebrowY }} className="flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.17em] text-[#9ca7ac] sm:text-[12px]">
            <span aria-hidden className="block h-px w-[30px] bg-[#9ca7ac]" />
            {about.eyebrow}
          </motion.p>
          <h2 id="about-h" className="mt-10 text-[clamp(44px,10.4vw,76px)] font-semibold leading-[1.06] tracking-[-0.062em] text-paper sm:mt-12 lg:text-[clamp(48px,4.8vw,74px)]">
            {about.headline.map((l, i) => (
              <HeadLine key={i} clock={clock} index={i} accent={i === about.accentLine} text={l} />
            ))}
          </h2>
          <motion.p style={{ opacity: lead, y: leadY }} className="mt-7 max-w-[30em] text-[17px] leading-[1.68] tracking-[-0.012em] text-[#959ca1] sm:text-[19px]">
            {about.lead}
          </motion.p>
          <motion.p style={{ opacity: note, y: noteY }} className="mt-6 max-w-[42ch] text-[13px] leading-[1.8] text-[#7a858d]">
            {about.note}
          </motion.p>
          <motion.div style={{ opacity: principles }} className="mt-12 grid max-w-[552px] grid-cols-3 gap-3 sm:mt-16">
            {about.principles.map((pr) => (
              <Principle
                key={pr.key}
                item={pr}
                clock={clock}
                active={lit === pr.key}
                pinned={pinnedStage === pr.key}
                onHover={setHoverStage}
                onToggle={(k) => setPinnedStage((cur) => (cur === k ? null : k))}
              />
            ))}
          </motion.div>
          <motion.button
            style={{ opacity: principles }}
            onClick={toProfile}
            className="group mt-16 hidden items-center gap-3.5 rounded-md font-mono text-[10px] uppercase tracking-[0.12em] text-[#6c7780] transition-colors duration-200 hover:text-[#aab6bd] lg:flex"
          >
            <span aria-hidden className={`about-hint ${invite ? 'is-inviting' : ''}`} />
            Scroll to explore
          </motion.button>
        </motion.div>

        <motion.div ref={panelRef} style={{ y: panelDrift }} className="relative z-[2] w-full max-w-[860px] lg:max-w-none">
          <motion.div style={{ opacity: panel, y: panelY, scale: panelScale }}>
            <HardwareLab
              clock={clock}
              focus={chosen}
              replay={replay}
              onReplay={onReplay}
              onPartStage={setPartStage}
            />
          </motion.div>
        </motion.div>
      </div>

      <Profile innerRef={profileRef} />
    </section>
  )
}

function HeadLine({ clock, index, accent, text }: { clock: MotionValue<number>; index: number; accent: boolean; text: string }) {
  const p = useWin(clock, T.line(index))
  const y = useTransform(p, (v) => `${(1 - v) * 112}%`)
  return (
    <span className="mask-line">
      <motion.span style={{ y, opacity: p }} className={`block ${accent ? 'text-[#c3d2d7]' : ''}`}>
        {text}
      </motion.span>
    </span>
  )
}
