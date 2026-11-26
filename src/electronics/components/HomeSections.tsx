import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { profile } from '../data/profile'
import { demoVideo, projects } from '../data/projects'
import { ReportDossier } from './Dossier'
import { Field } from './Field'
import { GitHubChip } from './GitHubLink'
import { easeOut } from '../lib/motion'
import { navigate } from '../lib/router'

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.6, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

export function ResearchSection() {
  return (
    <section id="research" aria-labelledby="research-h" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <Reveal className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <h2 id="research-h" className="text-[clamp(32px,4.4vw,56px)] font-semibold leading-[1] tracking-[-0.04em] text-paper">
            Research
          </h2>
          <p className="max-w-[52ch] text-[16px] leading-relaxed text-mute">{profile.supporting} Each report opens here in full, page by page.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.08}>
              <ReportDossier report={p.report} docId={`DOC-${p.number}`} variant="compact" video={demoVideo(p).video} videoLabel={demoVideo(p).label} />
              <button
                onClick={() => navigate(`work-${p.slug}`)}
                className="mt-3 flex items-center gap-1.5 px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-mute transition-colors duration-200 hover:text-paper"
              >
                Project {p.number} · {p.shortTitle} <ArrowUpRight size={13} />
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactSection() {
  const { contact } = profile
  return (
    <section id="contact" aria-labelledby="contact-h" className="scroll-mt-24 border-t border-white/[0.05] pb-16 pt-24 sm:pt-32">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <Reveal>
          <h2 id="contact-h" className="max-w-[16ch] text-balance text-[clamp(38px,6.4vw,92px)] font-semibold leading-[0.96] tracking-[-0.05em] text-paper">
            {contact.statement}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <a
            href={`mailto:${contact.email}`}
            className="group mt-10 inline-flex items-center gap-2 text-[clamp(18px,2.2vw,26px)] text-silver underline decoration-white/20 underline-offset-[0.25em] transition-colors duration-200 hover:text-paper hover:decoration-white/60"
          >
            {contact.email}
            <ArrowUpRight className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={22} />
          </a>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
            {contact.links.map((l) => (
              <li key={l.label} className="bg-ink">
                {l.href ? (
                  <a
                    href={l.href}
                    target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={l.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="group flex items-center justify-between px-5 py-4 text-[15px] text-paper transition-colors duration-200 hover:bg-ink2"
                  >
                    <span className="flex items-center gap-2.5">
                      {l.icon === 'github' && <GitHubChip />}
                      {l.label}
                    </span>
                    <ArrowUpRight size={16} className="text-mute transition-[transform,color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-paper" />
                  </a>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-5 py-4 text-[15px] text-mute">
                    {l.label}
                    <Field value={{ placeholder: l.placeholder ?? 'add link' }} className="font-mono text-[10.5px]" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
        <footer className="mt-24 flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mute sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <span className="text-paper">{profile.name}</span>
            <span aria-hidden className="hidden px-2 text-white/25 sm:inline">|</span>
            <span>{profile.identity}</span>
          </span>
          <span>Delhi, India</span>
        </footer>
      </div>
    </section>
  )
}
