import { motion } from 'motion/react'
import { Monogram } from './Monogram'
import { GitHubLink } from './GitHubLink'
import { profile } from '../data/profile'

export type NavKey = 'home' | 'about' | 'projects' | 'research' | 'contact'
const items: { key: NavKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'projects', label: 'Projects' },
  { key: 'research', label: 'Research' },
  { key: 'contact', label: 'Contact' },
]

export function Nav({ active, onSelect }: { active: NavKey; onSelect: (k: NavKey) => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[96px] bg-gradient-to-b from-ink via-ink/85 to-transparent sm:h-[110px]" />
      <div className="relative mx-auto flex max-w-[1240px] items-center justify-center gap-1.5 px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-8 sm:pt-[max(1.5rem,env(safe-area-inset-top))]">
        <button
          onClick={() => onSelect('home')}
          className="group hidden items-center gap-2.5 justify-self-start rounded-xl sm:flex"
          aria-label={`${profile.name}, home`}
        >
          <Monogram size={30} />
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-mute transition-colors duration-200 group-hover:text-paper lg:inline">
            {profile.name}
          </span>
        </button>

        <nav aria-label="Primary" className="min-w-0">
          <ul className="flex items-center gap-0 rounded-2xl border border-white/[0.06] bg-ink2/70 p-1 backdrop-blur-md sm:gap-1">
            {items.map((it) => {
              const on = it.key === active
              return (
                <li key={it.key} className="relative">
                  {on && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-[11px] border border-white/[0.16] bg-graphite shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <button
                    onClick={() => onSelect(it.key)}
                    aria-current={on ? 'page' : undefined}
                    className={`relative z-10 rounded-[11px] px-1.5 py-1.5 text-[13px] font-medium transition-colors duration-200 min-[400px]:px-2.5 sm:px-3.5 sm:text-[14px] ${
                      on ? 'text-paper' : 'text-mute hover:text-paper'
                    }`}
                  >
                    {it.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3 sm:justify-self-end">
          <GitHubLink />
          <span className="hidden font-mono text-[11px] tracking-[0.12em] text-mute sm:block">{profile.archiveYear}</span>
        </div>
      </div>
    </header>
  )
}
