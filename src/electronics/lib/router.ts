import { useEffect, useState } from 'react'

/* In-memory routing (the archive lives inside another page, so it must not touch the address bar):
     'home'                    -> home
     'archive'                 -> home, archive open
     'about' 'research' 'contact' -> home, scrolled to that section
     'work-<slug>'             -> project page                         */

export type Route = { name: 'home' } | { name: 'project'; slug: string }
const HOME_SECTIONS = ['archive', 'about', 'research', 'contact']

type State = { route: Route; section?: string }
function parse(name: string): State {
  const m = name.match(/^work-([\w-]+)$/)
  if (m) return { route: { name: 'project', slug: m[1] } }
  if (HOME_SECTIONS.includes(name)) return { route: { name: 'home' }, section: name }
  return { route: { name: 'home' } }
}

let current: State = parse('home')
const listeners = new Set<(s: State) => void>()

export function resetRoute() {
  current = parse('home')
}

export function useRoute() {
  const [state, setState] = useState(current)
  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])
  return state
}

/** navigate('work-smart-home'), navigate('archive'), navigate('home') */
export function navigate(name: string) {
  current = parse(name)
  listeners.forEach((l) => l({ ...current }))
}

export const routeKey = (r: Route) => (r.name === 'home' ? 'home' : `p-${r.slug}`)
