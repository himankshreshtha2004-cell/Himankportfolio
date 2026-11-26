import { createContext, useContext, type RefObject } from 'react'

/* The archive scrolls inside its own box (the Electronics room), not the browser window.
   `root` is the whole archive (overlays are placed in it), `scroller` is the scrolling part. */
type Ctx = { root: RefObject<HTMLDivElement>; scroller: RefObject<HTMLDivElement> }
export const ScrollCtx = createContext<Ctx | null>(null)

export function useArchive() {
  const c = useContext(ScrollCtx)
  if (!c) throw new Error('useArchive outside the archive')
  const byId = (id: string) => c.root.current?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ?? null
  const scrollTop = (smooth = false) => c.scroller.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  return { ...c, byId, scrollTop }
}
