import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import type { Project } from '../data/types'
import { MetalFolder, type CoverState } from './MetalFolder'
import { easeOut } from '../lib/motion'

export const layoutSpring = { type: 'spring', stiffness: 175, damping: 26, mass: 1 } as const

export type ArchivePhase = 'closed' | 'lifting' | 'opening' | 'open' | 'closing'

/* A project file layered inside the archive folder. While the folder opens,
   the files rise and fan apart; then each one becomes a project folder. */
export function LayeredFile({ project, index, phase }: { project: Project; index: number; phase: ArchivePhase }) {
  const pos = index === 0
    ? { left: '6.5%', top: '12.5%', width: '43%', height: '62%' }
    : { left: '48%', top: '7.5%', width: '45.5%', height: '64%' }
  const raised = phase === 'opening' || phase === 'closing'
  const y = raised ? (index === 0 ? '-30%' : '-36%') : phase === 'lifting' ? '-5%' : '0%'
  const rotate = raised ? (index === 0 ? -3 : 2.5) : 0
  return (
    <motion.div
      layoutId={`pf-${project.slug}`}
      className="absolute"
      style={{ ...pos, zIndex: index === 0 ? 2 : 1 }}
      animate={{ y, rotate }}
      transition={{
        layout: layoutSpring,
        default: { type: 'spring', stiffness: 120, damping: 16, delay: raised ? 0.12 + index * 0.07 : 0 },
      }}
    >
      <div className="h-full">
        <Sheet>
          <div className="flex items-center justify-between px-[6%] pt-[5%] font-mono text-[clamp(7px,1.35cqw,11px)] uppercase tracking-[0.14em] text-mute">
            <span>{project.number} · {project.shortTitle}</span>
            <span className="hidden sm:inline">{project.fileId}</span>
          </div>
        </Sheet>
      </div>
    </motion.div>
  )
}

/* Project folder in the explorer. Opening it lifts the tab, swings the
   cover, raises the photograph inside, then hands over to the project page. */
export function ProjectFolder({ project, onOpen, duration }: { project: Project; onOpen: () => void; duration: string }) {
  const reduce = useReducedMotion()
  const [cover, setCover] = useState<CoverState>(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const open = () => {
    if (cover !== 0) return
    if (reduce) return onOpen()
    setCover(1)
    timers.current.push(window.setTimeout(() => setCover(2), 170))
    timers.current.push(window.setTimeout(onOpen, 720))
  }

  const platform = project.meta.find((m) => m.label === 'Platform')?.value
  const year = project.meta.find((m) => m.label === 'Year')?.value

  return (
    <motion.div layoutId={`pf-${project.slug}`} transition={{ layout: layoutSpring }} className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.32, duration: 0.45, ease: easeOut } }}
      >
        <MetalFolder
          size="sm"
          cover={cover}
          openAngle={-52}
          interactive={cover === 0}
          onActivate={open}
          ariaLabel={`Open ${project.title}`}
          tabLabel={`P-${project.number}`}
          inside={
            <motion.div
              className="absolute left-[7%] top-[6%] h-[46%] w-[62%]"
              initial={false}
              animate={{ y: cover === 2 ? '-34%' : cover === 1 ? '-6%' : '0%', rotate: cover === 2 ? -2 : 0 }}
              transition={{ type: 'spring', stiffness: 130, damping: 17 }}
            >
              <div className="relative h-full overflow-hidden rounded-[10px] border border-white/[0.1] bg-steel shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]">
                <img src={project.heroImage} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 grayscale contrast-[1.1] brightness-[0.8]" />
                <span className="absolute left-[5%] top-[7%] font-mono text-[clamp(7px,1.9cqw,10px)] uppercase tracking-[0.14em] text-paper/80">
                  In action · {duration}
                </span>
              </div>
            </motion.div>
          }
          coverContent={
            <>
              <p className="absolute left-[6.5%] top-[27%] font-mono text-[clamp(8px,2.2cqw,11.5px)] uppercase tracking-[0.16em] text-silver/65">
                Project {project.number} <span className="px-1 text-white/25">·</span> {typeof year === 'string' ? year : ''}
              </p>
              <h3 className="absolute left-[6.5%] right-[6%] top-[35%] text-[clamp(26px,10.5cqw,56px)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#cbcdcf]">
                {project.shortTitle}
              </h3>
              <p className="absolute left-[6.5%] right-[8%] top-[56%] text-[clamp(11px,3.1cqw,15px)] leading-snug text-silver/70">
                {typeof platform === 'string' ? platform : ''}
              </p>
              <p className="absolute bottom-[7%] left-[6.5%] font-mono text-[clamp(8px,2cqw,11px)] uppercase tracking-[0.16em] text-silver/60">
                Open folder
              </p>
              <ArrowUpRight className="absolute bottom-[6.5%] right-[6%] text-silver/60" style={{ width: '4.2cqw', height: '4.2cqw' }} strokeWidth={1.5} />
            </>
          }
        />
      </motion.div>
      <p className="sr-only">{project.subtitle}</p>
    </motion.div>
  )
}

function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full">
      <span aria-hidden className="absolute -top-[13px] left-0 h-[14px] w-[38%] rounded-t-[10px] border border-b-0 border-white/[0.28] bg-[#141517] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" />
      <div className="relative h-full overflow-hidden rounded-[14px] rounded-tl-none border border-white/[0.26] bg-[linear-gradient(180deg,#1b1c1f_0%,#0e0f10_45%,#08080a_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(255,255,255,0.08),0_30px_60px_-30px_rgba(0,0,0,0.95)]">
        {children}
      </div>
    </div>
  )
}
