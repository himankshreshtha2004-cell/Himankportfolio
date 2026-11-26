import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Project, ResultTable } from '../data/types'
import { isPlaceholder } from '../data/types'
import { demoVideo, projects } from '../data/projects'
import { navigate } from '../lib/router'
import { easeOut } from '../lib/motion'
import { Field } from '../components/Field'
import { SystemDiagram } from '../components/project/SystemDiagram'
import { Demonstration } from '../components/project/Demonstration'
import { ReportDossier } from '../components/Dossier'
import { useArchive } from '../lib/scroll'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'objective', label: 'Problem & objective' },
  { id: 'architecture', label: 'System architecture' },
  { id: 'hardware', label: 'Hardware & software' },
  { id: 'working', label: 'How it works' },
  { id: 'demonstration', label: 'Demonstration' },
  { id: 'results', label: 'Testing & results' },
  { id: 'documentation', label: 'Research report' },
  { id: 'contributions', label: 'Contributions' },
]

export function ProjectPage({ project, section }: { project: Project; section?: string }) {
  const reduce = useReducedMotion()
  const { scroller, byId, scrollTop } = useArchive()
  const [active, setActive] = useState(SECTIONS[0].id)
  const idx = projects.findIndex((p) => p.slug === project.slug)
  const next = projects[(idx + 1) % projects.length]

  useEffect(() => {
    if (section) byId(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else scrollTop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug, section])

  useEffect(() => {
    const els = SECTIONS.map((s) => byId(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { root: scroller.current, rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug])

  const durations: Record<string, string> = { 'smart-home': '2:23', 'smart-kitchen': '1:50' }

  return (
    <article className="mx-auto max-w-[1240px] px-4 pb-24 pt-24 sm:px-8 sm:pt-28">
      {/* A. hero */}
      <header>
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
          <button onClick={() => navigate('archive')} className="flex items-center gap-1.5 rounded-lg py-1 pr-1 transition-colors duration-200 hover:text-paper">
            <ArrowLeft size={14} /> Archive
          </button>
          <span className="text-white/20">/</span>
          <span>Project {project.number}</span>
          <span className="ml-auto hidden sm:inline">{project.fileId}</span>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div>
            <h1 className="text-[clamp(38px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.045em] text-paper">
              <span className="mask-line">
                <motion.span className="inline-block" initial={reduce ? false : { y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 0.8, ease: easeOut, delay: 0.1 }}>
                  {project.title}
                </motion.span>
              </span>
            </h1>
            <motion.p
              className="mt-5 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-mute sm:text-[19px]"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: easeOut }}
            >
              {project.subtitle}
            </motion.p>
          </div>
          <motion.dl
            className="grid grid-cols-2 gap-x-6 gap-y-5 self-end border-t border-white/[0.07] pt-6 text-[14px]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            {project.meta.map((m) => (
              <div key={m.label} className={m.label === 'Institution' ? 'col-span-2' : ''}>
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">{m.label}</dt>
                <dd className="mt-1 text-paper/90"><Field value={m.value} /></dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.figure
          className="relative mt-12 overflow-hidden rounded-[22px] border border-white/[0.07] bg-ink2"
          initial={reduce ? false : { opacity: 0, clipPath: 'inset(8% 6% 8% 6% round 22px)' }}
          animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 22px)' }}
          transition={{ duration: 1, delay: 0.3, ease: easeOut }}
        >
          <img src={project.heroImage} alt={project.heroAlt} className="aspect-[16/7] w-full object-cover opacity-75 grayscale contrast-[1.08] brightness-[0.85]" />
          <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[14px] border border-white/[0.08]" />
          <figcaption className="absolute bottom-4 left-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/75">
            Prototype footage · {durations[project.slug]}
          </figcaption>
        </motion.figure>
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        {/* section rail */}
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-28 space-y-0.5 border-l border-white/[0.07]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#work-${project.slug}`}
                  onClick={(e) => { e.preventDefault(); byId(s.id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) }}
                  className={`-ml-px block border-l py-1.5 pl-4 text-[13px] transition-colors duration-200 ${active === s.id ? 'border-paper text-paper' : 'border-transparent text-mute hover:text-paper'}`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-24">
          {/* B. overview */}
          <Section id="overview" title="Overview">
            <div className="max-w-[68ch] space-y-4 text-[17px] leading-relaxed text-paper/85">
              {project.overview.map((p) => <p key={p}>{p}</p>)}
            </div>
          </Section>

          {/* C. problem / objective */}
          <Section id="objective" title="Problem and objective">
            <div className="grid gap-10 xl:grid-cols-2">
              <div className="max-w-[60ch] space-y-4 text-[16px] leading-relaxed text-paper/85">
                {project.problem.map((p) => <p key={p}>{p}</p>)}
              </div>
              <ol className="space-y-3">
                {project.objectives.map((o, i) => (
                  <li key={o} className="flex gap-4 border-t border-white/[0.06] pt-3 text-[15px] leading-relaxed text-paper/85">
                    <span className="tabular font-mono text-[12px] text-mute">{String(i + 1).padStart(2, '0')}</span>
                    {o}
                  </li>
                ))}
              </ol>
            </div>
          </Section>

          {/* D. architecture */}
          <Section id="architecture" title="System architecture">
            <SystemDiagram {...project.diagram} />
          </Section>

          {/* E. hardware & software */}
          <Section id="hardware" title="Hardware and software">
            <div className="grid gap-6">
              <SpecList heading="Hardware" rows={project.hardware.map((h) => [h.name, h.role, h.link ?? ''])} cols={['Component', 'Role', 'Interface']} />
              <SpecList heading="Software" rows={project.software.map((s) => [s.name, s.role])} cols={['Layer', 'What it does']} />
            </div>
          </Section>

          {/* F. how it works */}
          <Section id="working" title="How the system works">
            <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {project.workflow.map((s, i) => (
                <motion.li
                  key={s.title}
                  className="flex gap-4"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: easeOut }}
                >
                    <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.1] bg-graphite font-mono text-[12px] text-silver">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[16px] font-medium text-paper">{s.title}</p>
                      <p className="mt-1 text-[15px] leading-relaxed text-mute">{s.detail}</p>
                    </div>
                </motion.li>
              ))}
            </ol>
          </Section>

          {/* G + H. demonstration */}
          <Section id="demonstration" title="System demonstration">
            <Demonstration project={project} />
          </Section>

          {/* I. results */}
          <Section id="results" title="Testing, results and observations">
            <div className="grid gap-6">
              {project.results.map((t) => <ResultsTable key={t.title} table={t} />)}
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              <Evidence title="Documented in the report" items={project.evidence.documented} />
              <Evidence title="Visible in the footage" items={project.evidence.visible} />
              <Evidence title="Not specified" items={project.evidence.unspecified} muted />
            </div>

            <div className="mt-12">
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-paper">Limitations noted in the report</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {project.limitations.map((l) => (
                  <li key={l} className="rounded-xl border border-white/[0.06] bg-ink2/70 px-4 py-3 text-[14.5px] leading-relaxed text-paper/80">{l}</li>
                ))}
              </ul>
            </div>
          </Section>

          {/* J. research */}
          <Section id="documentation" title="Research documentation">
            <ReportDossier report={project.report} docId={`DOC-${project.number}`} video={demoVideo(project).video} videoLabel={demoVideo(project).label} />
          </Section>

          {/* K. contributions */}
          <Section id="contributions" title="My contributions">
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
              <ul className="space-y-3">
                {project.contributions.map((c, i) => (
                  <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-paper/85">
                    <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-silver/50" />
                    <Field value={c} />
                  </li>
                ))}
              </ul>
              <div className="rounded-[16px] border border-white/[0.07] bg-ink2/80 p-5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">Attribution</p>
                <dl className="mt-3 space-y-3 text-[14px]">
                  <div>
                    <dt className="text-mute">{project.attribution.reportAuthorLabel ?? 'Report author'}</dt>
                    <dd className="text-paper">{project.attribution.reportAuthor}</dd>
                  </div>
                  {project.attribution.contributors.map((c) => (
                    <div key={c.name}>
                      <dt className="text-mute">{c.name}</dt>
                      <dd className={isPlaceholder(c.role) ? '' : 'text-paper'}><Field value={c.role} /></dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-mute">{project.attribution.note}</p>
              </div>
            </div>
          </Section>

          {/* L. next */}
          <nav aria-label="More projects" className="grid gap-3 border-t border-white/[0.07] pt-10 sm:grid-cols-2">
            <button onClick={() => navigate('archive')} className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-ink2/70 p-5 text-left transition-colors duration-200 hover:border-white/15">
              <ArrowLeft size={18} className="text-mute transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">Back to</p>
                <p className="text-[17px] font-medium text-paper">Project archive</p>
              </div>
            </button>
            {next.slug !== project.slug && (
              <button onClick={() => navigate(`work-${next.slug}`)} className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-ink2/70 p-5 text-left transition-colors duration-200 hover:border-white/15">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">Next · Project {next.number}</p>
                  <p className="text-[17px] font-medium text-paper">{next.title}</p>
                </div>
                <ArrowRight size={18} className="text-mute transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </button>
            )}
          </nav>
        </div>
      </div>
    </article>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28">
      <Reveal>
        <h2 id={`${id}-h`} className="mb-8 text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.035em] text-paper">{title}</h2>
      </Reveal>
      {children}
    </section>
  )
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.55, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

function SpecList({ heading, cols, rows }: { heading: string; cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-ink2/80">
      <p className="border-b border-white/[0.06] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">{heading}</p>
      {/* phones: each row stacks (name, role, interface); larger screens: a table */}
      <table className="w-full text-left text-[14px] max-sm:block">
        <thead className="sr-only">
          <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody className="max-sm:block">
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-white/[0.05] align-top last:border-0 max-sm:grid max-sm:gap-1 max-sm:px-5 max-sm:py-3.5">
              <th scope="row" className="font-medium text-paper sm:w-[26%] sm:px-5 sm:py-3">{r[0]}</th>
              <td className="leading-relaxed text-paper/75 sm:px-2 sm:py-3">{r[1]}</td>
              {r[2] !== undefined && r[2] !== '' && (
                <td className="font-mono text-[12px] text-mute sm:whitespace-nowrap sm:px-5 sm:py-3">{r[2]}</td>
              )}
              {r[2] === '' && <td className="max-sm:hidden" />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultsTable({ table }: { table: ResultTable }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-ink2/80">
      <div className="border-b border-white/[0.06] px-5 py-3.5">
        <h3 className="text-[16px] font-semibold text-paper">{table.title}</h3>
        <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-mute">{table.source}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px] sm:min-w-[420px]">
          <thead>
            <tr className="border-b border-white/[0.05] font-mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
              {table.columns.map((c, i) => <th key={c} scope="col" className={`px-3 py-2.5 font-normal first:pl-4 last:pr-4 sm:px-5 ${i > 0 ? 'text-right' : ''}`}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.join('|')} className="border-b border-white/[0.04] last:border-0">
                {r.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-2.5 pl-4 pr-3 font-normal text-paper/85 sm:px-5">{cell}</th>
                  ) : (
                    <td key={i} className="tabular px-3 py-2.5 text-right font-mono text-[12px] text-paper last:pr-4 sm:px-5 sm:text-[12.5px]">{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Evidence({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((it) => (
          <li key={it} className={`border-t border-white/[0.06] pt-2.5 text-[14.5px] leading-relaxed ${muted ? 'text-mute' : 'text-paper/85'}`}>{it}</li>
        ))}
      </ul>
    </div>
  )
}
