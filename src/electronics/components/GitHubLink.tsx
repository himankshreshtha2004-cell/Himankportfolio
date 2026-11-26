import { Github } from 'lucide-react'
import { profile } from '../data/profile'

/* Minimal GitHub mark in the same chip as the HS monogram:
   graphite fill, hairline silver edge, a faint top highlight. */
const chip =
  'grid shrink-0 place-items-center rounded-[9px] border border-white/[0.12] bg-[linear-gradient(145deg,#25292e,#111316)] text-silver shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[color,border-color,box-shadow] duration-200'

export function GitHubChip({ size = 26 }: { size?: number }) {
  return (
    <span aria-hidden className={`${chip} group-hover:border-white/25 group-hover:text-paper`} style={{ width: size, height: size }}>
      <Github size={Math.round(size * 0.5)} strokeWidth={1.7} />
    </span>
  )
}

/* Nav button: opens the GitHub profile in a new tab */
export function GitHubLink() {
  return (
    <a
      href={profile.github}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub profile (opens in a new tab)"
      title="GitHub"
      className={`${chip} h-[30px] w-[30px] hover:border-white/25 hover:text-paper hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_3px_rgba(196,198,200,0.06)]`}
    >
      <Github size={15} strokeWidth={1.7} />
    </a>
  )
}
