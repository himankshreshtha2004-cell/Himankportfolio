import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AlertTriangle, Captions, Loader2, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { VideoSource } from '../../data/types'

const SPEEDS = [0.5, 1, 1.25, 1.5, 2]
const fmt = (s: number) => {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

/* Native <video> with custom, keyboard-operable controls.
   Space/K play · ←/→ 5 s · ↑/↓ volume · M mute · F fullscreen · C captions */
export function VideoPlayer({
  source,
  label,
  active,
  onTime,
  fill = false,
}: {
  source: VideoSource & { src: string }
  label: string
  active: boolean
  onTime?: (t: number) => void
  /** fill the parent box instead of sizing by aspect ratio */
  fill?: boolean
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [vol, setVol] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState(false)
  const [full, setFull] = useState(false)
  const [cc, setCc] = useState(false)
  const [started, setStarted] = useState(false)

  // pause when this tab stops being the active one
  useEffect(() => {
    if (!active) video.current?.pause()
  }, [active])

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  useEffect(() => {
    const v = video.current
    if (!v || !v.textTracks[0]) return
    v.textTracks[0].mode = cc ? 'showing' : 'hidden'
  }, [cc])

  const toggle = useCallback(() => {
    const v = video.current
    if (!v || error) return
    if (v.paused) v.play().catch(() => setError(true))
    else v.pause()
  }, [error])

  const seek = (t: number) => {
    const v = video.current
    if (v) v.currentTime = Math.max(0, Math.min(dur || 0, t))
  }
  const setVolume = (n: number) => {
    const v = video.current
    if (!v) return
    v.volume = Math.max(0, Math.min(1, n))
    v.muted = v.volume === 0
  }
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else wrap.current?.requestFullscreen?.()
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' && !['k', 'm', 'f', 'c'].includes(e.key.toLowerCase())) return
    const k = e.key.toLowerCase()
    const handled = true
    if (k === ' ' || k === 'k') toggle()
    else if (k === 'arrowright') seek(time + 5)
    else if (k === 'arrowleft') seek(time - 5)
    else if (k === 'arrowup') setVolume(vol + 0.1)
    else if (k === 'arrowdown') setVolume(vol - 0.1)
    else if (k === 'm') { const v = video.current; if (v) v.muted = !v.muted }
    else if (k === 'f') toggleFull()
    else if (k === 'c' && source.captions) setCc((c) => !c)
    else return
    if (handled) e.preventDefault()
  }

  const portrait = source.orientation === 'portrait'
  const pct = dur ? (time / dur) * 100 : 0
  const ctl = 'grid h-9 w-9 place-items-center rounded-lg text-paper/85 transition-colors duration-150 hover:bg-white/[0.08] hover:text-paper'

  return (
    <div
      ref={wrap}
      onKeyDown={onKey}
      className={`group/player relative overflow-hidden rounded-[14px] border border-white/[0.07] bg-black ${full ? 'grid place-items-center' : ''} ${fill ? 'h-full' : ''}`}
      role="region"
      aria-label={`${label} video player`}
    >
      <div className={`relative mx-auto ${full || fill ? 'h-full w-full' : portrait ? 'aspect-[9/16] max-h-[72vh]' : 'aspect-video'}`}>
        <video
          ref={video}
          src={source.src}
          poster={source.poster}
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
          onClick={toggle}
          onPlay={() => { setPlaying(true); setStarted(true) }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => { const t = e.currentTarget.currentTime; setTime(t); onTime?.(t) }}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onCanPlay={() => setWaiting(false)}
          onVolumeChange={(e) => { setVol(e.currentTarget.volume); setMuted(e.currentTarget.muted) }}
          onRateChange={(e) => setSpeed(e.currentTarget.playbackRate)}
          onError={() => setError(true)}
        >
          {source.captions && <track kind="captions" src={source.captions} srcLang="en" label="English" />}
        </video>

        {!started && !error && (
          <button
            onClick={toggle}
            className="absolute inset-0 grid place-items-center bg-ink/25 transition-colors duration-200 hover:bg-ink/10"
            aria-label={`Play ${label}`}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-ink/60 text-paper shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur transition-transform duration-200 ease-out hover:scale-105">
              <Play size={24} className="translate-x-[2px]" fill="currentColor" />
            </span>
          </button>
        )}
        {waiting && !error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="animate-spin text-paper/80" size={26} />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-ink/85 p-6 text-center">
            <div>
              <AlertTriangle className="mx-auto text-mute" size={22} />
              <p className="mt-2 text-[14px] text-paper">This video couldn’t be played in the browser.</p>
              <a href={source.src} className="mt-1 inline-block text-[13px] text-mute underline hover:text-paper">Open the file directly</a>
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      {!error && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2 pt-10 transition-opacity duration-200 group-hover/player:opacity-100 group-focus-within/player:opacity-100 [@media(hover:hover)]:opacity-0 data-[paused=true]:opacity-100" data-paused={!playing}>
        <input
          type="range"
          className="range w-full"
          min={0}
          max={dur || 0}
          step={0.1}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ ['--fill' as string]: `${pct}%` }}
          aria-label="Seek"
          aria-valuetext={`${fmt(time)} of ${fmt(dur)}`}
        />
        <div className="flex items-center gap-1">
          <button className={ctl} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          </button>
          <button className={ctl} onClick={() => { const v = video.current; if (v) v.muted = !v.muted }} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted || vol === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            type="range"
            className="range hidden w-20 sm:block"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : vol}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ ['--fill' as string]: `${(muted ? 0 : vol) * 100}%` }}
            aria-label="Volume"
          />
          <span className="tabular ml-2 font-mono text-[11.5px] text-paper/75">
            {fmt(time)} <span className="text-paper/35">/ {fmt(dur)}</span>
          </span>
          <span className="flex-1" />
          <label className="relative">
            <span className="sr-only">Playback speed</span>
            <select
              value={speed}
              onChange={(e) => { const v = video.current; if (v) v.playbackRate = Number(e.target.value) }}
              className="h-8 cursor-pointer appearance-none rounded-lg bg-transparent px-2 font-mono text-[11.5px] text-paper/85 outline-none hover:bg-white/[0.08]"
            >
              {SPEEDS.map((s) => <option key={s} value={s} className="bg-ink2">{s}×</option>)}
            </select>
          </label>
          {source.captions && (
            <button className={`${ctl} ${cc ? 'text-paper' : 'text-paper/50'}`} onClick={() => setCc((c) => !c)} aria-pressed={cc} aria-label="Captions">
              <Captions size={17} />
            </button>
          )}
          <button className={ctl} onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'}>
            {full ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>}
    </div>
  )
}
