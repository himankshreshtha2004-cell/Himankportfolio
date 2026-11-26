import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { Backdrop } from './components/Backdrop'
import { Nav, type NavKey } from './components/Nav'
import { Hero } from './components/Hero'
import { ContactSection, ResearchSection } from './components/HomeSections'
import { AboutSection } from './components/about/AboutSection'
import { ProjectPage } from './pages/ProjectPage'
import { getProject } from './data/projects'
import { navigate, resetRoute, routeKey, useRoute } from './lib/router'
import { ScrollCtx } from './lib/scroll'
import { easeOut } from './lib/motion'
import './electronics.css'

// in page order: the last one scrolled past wins
const SECTION_IDS: NavKey[] = ['research', 'about', 'contact']

/* Himank's electronics project archive, built into the Electronics room.
   It scrolls inside its own box; `data-elec-busy` tells the room when Esc belongs to the archive. */
export default function ElectronicsApp() {
  const root = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const ctx = useMemo(() => ({ root, scroller }), [])
  const { route, section } = useRoute()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [openSignal, setOpenSignal] = useState(0)
  const [active, setActive] = useState<NavKey>('home')
  const firstHome = useRef(true)
  const intro = route.name === 'home' && firstHome.current

  const byId = useCallback((id: string) => root.current?.querySelector<HTMLElement>(`#${id}`) ?? null, [])
  const toTop = useCallback((smooth: boolean) => scroller.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }), [])

  useEffect(() => {
    resetRoute()
    navigate('home')
  }, [])

  useEffect(() => {
    if (route.name === 'home') {
      const t = window.setTimeout(() => { firstHome.current = false }, 2500)
      return () => window.clearTimeout(t)
    }
    firstHome.current = false
  }, [route.name])

  // home: scroll to a requested section, or open the archive
  useEffect(() => {
    if (route.name !== 'home') return
    if (!section) return
    const t = window.setTimeout(() => {
      if (section === 'archive') {
        toTop(true)
        setOpenSignal((n) => n + 1)
      } else {
        byId(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 480) // after the page transition, so the home page is mounted
    return () => window.clearTimeout(t)
  }, [route, section, byId, toTop])

  // nav highlight follows the scroll position on the home page
  useEffect(() => {
    if (route.name !== 'home') {
      setActive('projects')
      return
    }
    const el = scroller.current
    if (!el) return
    const onScroll = () => {
      let cur: NavKey = archiveOpen ? 'projects' : 'home'
      const box = el.getBoundingClientRect()
      for (const id of SECTION_IDS) {
        const s = byId(id)
        if (s && s.getBoundingClientRect().top - box.top < el.clientHeight * 0.45) cur = id
      }
      setActive(cur)
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [route.name, archiveOpen, byId])

  const onSelect = useCallback(
    (k: NavKey) => {
      if (k === 'home') {
        if (route.name === 'home') toTop(true)
        else navigate('home')
      } else if (k === 'projects') {
        if (route.name === 'home') {
          toTop(true)
          setOpenSignal((n) => n + 1)
        } else navigate('archive')
      } else {
        if (route.name === 'home') byId(k)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else navigate(k)
      }
    },
    [route.name, byId, toTop],
  )

  const project = route.name === 'project' ? getProject(route.slug) : undefined

  return (
    <StrictMode>
    <ScrollCtx.Provider value={ctx}>
      <div ref={root} className="elec-app" data-elec-root>
        <MotionConfig reducedMotion="user">
          <Backdrop dim={archiveOpen && route.name === 'home'} />
          <Nav active={active} onSelect={onSelect} />
          <motion.div ref={scroller} layoutScroll className="elec-scroll" tabIndex={-1}>
              <motion.div
                key={routeKey(route)}
                className="relative z-[1] outline-none"
                initial={route.name === 'home' && firstHome.current ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } }}
                onAnimationStart={() => route.name === 'project' && !section && toTop(false)}
              >
                {route.name === 'home' || !project ? (
                  <>
                    <Hero intro={intro} openSignal={openSignal} onArchiveChange={setArchiveOpen} />
                    <ResearchSection />
                    <AboutSection />
                    <ContactSection />
                  </>
                ) : (
                  <ProjectPage project={project} section={section} />
                )}
              </motion.div>
          </motion.div>
        </MotionConfig>
      </div>
    </ScrollCtx.Provider>
    </StrictMode>
  )
}
