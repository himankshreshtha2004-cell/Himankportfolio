import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useArchive } from '../lib/scroll'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ChevronLeft, ChevronRight, FileText, Loader2, Maximize2, Minus, Play, Plus, X,
} from 'lucide-react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { Report, VideoSource } from '../data/types'
import { VideoPlayer } from './project/VideoPlayer'
import { loadPdf, renderPage } from '../lib/pdf'
import { easeOut } from '../lib/motion'

/* true below the sm breakpoint (phones) */
function useNarrow() {
  const q = '(max-width: 639px)'
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}

/* ---------- thumbnail (first page) ---------- */
function Thumb({ url, width }: { url: string; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let task: RenderTask | undefined
    let alive = true
    loadPdf(url)
      .then((doc) => renderPage(doc, 1, ref.current!, width))
      .then(({ task: t }) => {
        task = t
        return t.promise
      })
      .then(() => alive && setState('ready'))
      .catch((e) => alive && e?.name !== 'RenderingCancelledException' && setState('error'))
    return () => {
      alive = false
      task?.cancel()
    }
  }, [url, width])
  return (
    <div className="relative overflow-hidden rounded-[6px] bg-[#e9e9e6]" style={{ width, aspectRatio: '0.72' }}>
      <canvas ref={ref} className={`block transition-opacity duration-500 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
      {state !== 'ready' && (
        <div className="absolute inset-0 grid place-items-center bg-graphite text-mute">
          {state === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
        </div>
      )}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,12,0)_55%,rgba(9,10,12,0.35))]" />
    </div>
  )
}

/* ---------- dossier card ---------- */
export function ReportDossier({
  report,
  docId,
  variant = 'full',
  video,
  videoLabel = 'Prototype in action',
}: {
  report: Report
  docId: string
  variant?: 'full' | 'compact'
  /** when given, "Watch it run" expands the thumbnail into this video */
  video?: VideoSource
  videoLabel?: string
}) {
  const [viewer, setViewer] = useState<number | null>(null)
  const [theater, setTheater] = useState(false)
  // the thumbnail carries the layoutId of whichever view is about to open
  const [intent, setIntent] = useState<'doc' | 'video'>('doc')
  const launch = (mode: 'doc' | 'video', fn: () => void) => {
    if (intent === mode) return fn()
    setIntent(mode)
    requestAnimationFrame(() => requestAnimationFrame(fn))
  }
  const thumbId = viewer === null && !theater ? `${intent === 'video' ? 'theater' : 'doc'}-${docId}` : undefined
  const compact = variant === 'compact'
  const narrow = useNarrow()
  const thumbW = compact ? (narrow ? 84 : 104) : narrow ? 132 : 176

  const btn =
    'flex items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-graphite px-3.5 py-2 text-[13px] font-medium text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-[background-color,border-color] duration-200 hover:border-white/25 hover:bg-steel'
  const actions = (
    <div className={`flex gap-2 ${compact ? 'max-sm:grid max-sm:grid-cols-2 sm:flex-wrap' : 'mt-5 flex-wrap'}`}>
      <button onClick={() => launch('doc', () => setViewer(1))} className={btn}>
        <FileText size={15} /> Read here
      </button>
      {video?.src && (
        <button onClick={() => launch('video', () => setTheater(true))} className={btn}>
          <Play size={14} fill="currentColor" /> Watch it run
        </button>
      )}
    </div>
  )

  return (
    <div className={`metal-edge relative rounded-[18px] border border-white/[0.07] bg-ink2/90 ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'}`}>
      <div className={compact ? 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-4 sm:gap-x-6' : 'flex flex-col gap-5 sm:flex-row sm:gap-7'}>
        <motion.button
          layoutId={thumbId}
          onClick={() => launch('doc', () => setViewer(1))}
          className="group relative shrink-0 self-start rounded-[8px] border border-white/[0.08] bg-graphite p-2 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.9)]"
          aria-label={`Read ${report.title}`}
        >
          <Thumb url={report.pdf} width={thumbW} />
          <span className="absolute -top-2 left-3 rounded-md border border-white/[0.1] bg-steel px-1.5 py-[1px] font-mono text-[9.5px] uppercase tracking-[0.14em] text-silver">
            {docId}
          </span>
          <span className="absolute inset-0 grid place-items-center rounded-[8px] bg-ink/0 opacity-0 transition-[opacity,background-color] duration-200 group-hover:bg-ink/40 group-hover:opacity-100">
            <Maximize2 size={18} className="text-paper" />
          </span>
        </motion.button>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute">
            <span className={compact ? 'max-sm:hidden' : ''}>Research report · </span>
            {compact && <span className="sm:hidden">Report · </span>}
            {report.pages} pages
          </p>
          <h3 className={`mt-1.5 text-balance font-semibold leading-snug tracking-[-0.02em] text-paper ${compact ? 'text-[16px] sm:text-[17px]' : 'text-[20px] sm:text-[22px]'}`}>
            {report.title}
          </h3>
          {!compact && (
            <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-[14px] sm:grid-cols-[auto_1fr]">
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute sm:pt-[3px]">{report.creditLabel ?? 'Author'}</dt>
              <dd className="text-paper/90">{report.authors}</dd>
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute sm:pt-[3px]">Supervisor</dt>
              <dd className="text-paper/90">{report.supervisor}</dd>
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute sm:pt-[3px]">Format</dt>
              <dd className="text-paper/90">{report.format}</dd>
            </dl>
          )}
          {compact && <p className="mt-1 text-[13.5px] leading-snug text-mute">{report.authors}</p>}
          {!compact && actions}
        </div>
        {compact && <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:-mt-1">{actions}</div>}
      </div>

      {!compact && report.toc.length > 0 && (
        <div className="mt-7 border-t border-white/[0.06] pt-5">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">Contents</p>
          <ol className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {report.toc.map((t) => (
              <li key={t.title}>
                <button
                  onClick={() => launch('doc', () => setViewer(t.page))}
                  className="group flex w-full items-baseline gap-3 rounded-md py-1.5 text-left text-[14px] text-paper/80 transition-colors duration-150 hover:text-paper"
                >
                  <span className="min-w-0 shrink truncate">{t.title}</span>
                  <span aria-hidden className="mb-[3px] h-px min-w-[16px] flex-1 border-b border-dotted border-white/15 group-hover:border-white/30" />
                  <span className="tabular font-mono text-[12px] text-mute">p. {t.page}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <DocViewer
        open={viewer !== null}
        startPage={viewer ?? 1}
        report={report}
        docId={docId}
        onClose={() => setViewer(null)}
      />
      {video?.src && (
        <Theater open={theater} video={{ ...video, src: video.src }} docId={docId} label={videoLabel} onClose={() => setTheater(false)} />
      )}
    </div>
  )
}

/* ---------- full viewer ---------- */
function DocViewer({
  open, startPage, report, docId, onClose,
}: {
  open: boolean
  startPage: number
  report: Report
  docId: string
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const { root } = useArchive()
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="viewer"
          className="absolute inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        >
          <ViewerBody report={report} docId={docId} startPage={startPage} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>,
    root.current ?? document.body,
  )
}

function ViewerBody({ report, docId, startPage, onClose }: { report: Report; docId: string; startPage: number; onClose: () => void }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [err, setErr] = useState(false)
  const [page, setPage] = useState(startPage)
  const [zoom, setZoom] = useState(1)
  const [busy, setBusy] = useState(true)
  const [width, setWidth] = useState(800)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const task = useRef<RenderTask>()

  const total = doc?.numPages ?? report.pages
  const go = useCallback((n: number) => setPage(() => Math.min(Math.max(1, n), total)), [total])

  useEffect(() => {
    let alive = true
    loadPdf(report.pdf).then((d) => alive && setDoc(d)).catch(() => alive && setErr(true))
    return () => {
      alive = false
    }
  }, [report.pdf])

  // fit-to-width base, recomputed on resize
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(Math.min(el.clientWidth - 32, 880)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!doc || !canvas.current) return
    let alive = true
    setBusy(true)
    task.current?.cancel()
    renderPage(doc, page, canvas.current, Math.round(width * zoom))
      .then(({ task: t }) => {
        task.current = t
        return t.promise
      })
      .then(() => alive && setBusy(false))
      .catch((e) => {
        if (e?.name !== 'RenderingCancelledException' && alive) setErr(true)
      })
    stage.current?.scrollTo({ top: 0 })
    return () => {
      alive = false
    }
  }, [doc, page, zoom, width])

  // keyboard, focus and scroll lock
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1)
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1)
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))
      else if (e.key === '-') setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [go, page, onClose])

  const btn = 'grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-graphite/70 text-mute transition-colors duration-150 hover:border-white/20 hover:text-paper disabled:pointer-events-none disabled:opacity-35'

  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={report.title} className="flex min-h-0 flex-1 flex-col outline-none">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{docId} · {report.authors}</p>
          <p className="truncate text-[14px] font-medium text-paper">{report.title}</p>
        </div>
        <button onClick={onClose} className={btn} aria-label="Close viewer"><X size={17} /></button>
      </div>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Report contents" className="hidden w-[250px] shrink-0 overflow-y-auto border-r border-white/[0.06] p-4 lg:block">
          <p className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Contents</p>
          <ol className="mt-2">
            {report.toc.map((t) => {
              const on = page >= t.page && !report.toc.some((o) => o.page > t.page && page >= o.page)
              return (
                <li key={t.title}>
                  <button
                    onClick={() => go(t.page)}
                    className={`flex w-full items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors duration-150 ${on ? 'bg-graphite text-paper' : 'text-mute hover:text-paper'}`}
                  >
                    <span className="min-w-0">{t.title}</span>
                    <span className="tabular font-mono text-[11px] opacity-70">{t.page}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div ref={stage} className="relative min-w-0 flex-1 overflow-auto">
          <motion.div layoutId={`doc-${docId}`} className="mx-auto my-6 w-fit rounded-[6px] bg-[#e9e9e6] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]" transition={{ duration: 0.45, ease: easeOut }}>
            <canvas ref={canvas} className="block rounded-[6px]" aria-label={`Page ${page} of ${total}`} />
          </motion.div>
          {(busy || !doc) && !err && (
            <div className="pointer-events-none absolute inset-x-0 top-24 grid place-items-center text-mute">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
          {err && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <p className="text-paper">The report couldn’t be displayed here.</p>
                <p className="mt-1 text-[13.5px] text-mute">Reload the page and try again.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-3">
        <button className={btn} onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft size={17} /></button>
        <label className="flex items-center gap-2 font-mono text-[12px] text-mute">
          <span className="sr-only">Page</span>
          <input
            type="number"
            min={1}
            max={total}
            value={page}
            onChange={(e) => go(Number(e.target.value) || 1)}
            className="tabular h-9 w-14 rounded-xl border border-white/[0.08] bg-graphite/70 text-center text-paper outline-none focus:border-white/25"
          />
          <span className="tabular">/ {total}</span>
        </label>
        <button className={btn} onClick={() => go(page + 1)} disabled={page >= total} aria-label="Next page"><ChevronRight size={17} /></button>
        <span className="mx-2 h-5 w-px bg-white/10" />
        <button className={btn} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out"><Minus size={16} /></button>
        <button onClick={() => setZoom(1)} className="tabular h-9 min-w-[58px] rounded-xl px-2 font-mono text-[12px] text-mute hover:text-paper" aria-label="Fit to width">
          {Math.round(zoom * 100)}%
        </button>
        <button className={btn} onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} aria-label="Zoom in"><Plus size={16} /></button>
      </div>
    </div>
  )
}

/* ---------- document → video theater ---------- */
function Theater({ open, video, docId, label, onClose }: { open: boolean; video: VideoSource & { src: string }; docId: string; label: string; onClose: () => void }) {
  const { root } = useArchive()
  return createPortal(
    <AnimatePresence>{open && <TheaterBody key="theater" video={video} docId={docId} label={label} onClose={onClose} />}</AnimatePresence>,
    root.current ?? document.body,
  )
}

function TheaterBody({ video, docId, label, onClose }: { video: VideoSource & { src: string }; docId: string; label: string; onClose: () => void }) {
  const reduce = useReducedMotion()
  const [ready, setReady] = useState(!!reduce)
  const box = useRef<HTMLDivElement>(null)
  const portrait = video.orientation === 'portrait'

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 750) // fallback if no layout animation runs
    const prev = document.activeElement as HTMLElement | null
    box.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])

  return (
    <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="absolute inset-0 z-[70] grid place-items-center p-4 outline-none sm:p-10">
      <motion.div
        className="absolute inset-0 bg-ink/85 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />
      <div className={`relative w-full ${portrait ? 'max-w-[min(420px,calc((100svh-260px)*9/16))]' : 'max-w-[1100px]'}`}>
        <motion.div
          className="mb-3 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.35 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">{docId} <span className="px-1 text-white/25">→</span> {label}</p>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.1] bg-graphite/80 text-mute transition-colors duration-150 hover:border-white/20 hover:text-paper" aria-label="Close video">
            <X size={17} />
          </button>
        </motion.div>
        <motion.div
          layoutId={`theater-${docId}`}
          className={`relative overflow-hidden rounded-[14px] bg-black shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95)] ${portrait ? 'aspect-[9/16]' : 'aspect-video'}`}
          transition={{ layout: { type: 'spring', stiffness: 150, damping: 24, mass: 0.95 } }}
          onLayoutAnimationComplete={() => setReady(true)}
        >
          {!ready && video.poster && <img src={video.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {ready && (
            <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <VideoPlayer source={video} label={label} active fill />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
