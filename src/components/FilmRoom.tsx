/* ==========================================================================
   FILM ROOM — "Step inside" the AI Filmmaking bay.

   Enter: the camera pushes into the bay (the film canvas scales up and
   softens) while frames rush past like a tunnel; the room opens out of the
   end of the tunnel as a panel over the blurred bay.
   Inside: the films sit in an angled 3D stack. Scroll, swipe, arrow keys or
   a click deal through it; the front card plays a silent loop; clicking it
   (or "Play film") opens the film with sound.
   Leave: Close, Esc or the browser's Back plays the tunnel in reverse.
   ========================================================================== */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FILMS, filmMeta, filmPath, type Film } from "../content/films";

type Props = {
  /** lets the page close the room (e.g. the browser's Back button) */
  apiRef: React.MutableRefObject<{ close: () => void } | null>;
  /** called once the closing animation has finished */
  onExit: () => void;
  /** asks the page to close (it decides how: history.back() or straight away) */
  onRequestClose: () => void;
};

const RINGS = 11;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n: number) => String(n).padStart(2, "0");

export function FilmRoom({ apiRef, onExit, onRequestClose }: Props) {
  const [active, setActive] = useState(0);
  const [entering, setEntering] = useState(true);
  const [dealt, setDealt] = useState(false);
  const [playing, setPlaying] = useState<Film | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tunnel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const titles = useRef<HTMLElement>(null);
  const leaving = useRef(false);
  const playingRef = useRef<Film | null>(null);
  playingRef.current = playing;

  const go = useCallback((i: number) => setActive(Math.max(0, Math.min(FILMS.length - 1, i))), []);
  const step = useCallback((dir: number) => setActive((a) => Math.max(0, Math.min(FILMS.length - 1, a + dir))), []);

  /* ---------- the tunnel in ---------- */
  useLayoutEffect(() => {
    const cv = document.querySelector<HTMLCanvasElement>("canvas.film");
    const pn = panel.current!;
    const t = tunnel.current!;
    const rings = Array.from(t.querySelectorAll<HTMLElement>(".tunnel__ring"));
    const part = (c: string) => t.querySelector<HTMLElement>(c)!;
    const reduce = reducedMotion();
    if (cv) {
      cv.style.transformOrigin = "50% 48%";
      cv.animate(
        [
          { transform: "scale(1)", filter: "blur(0px) brightness(1)" },
          { transform: "scale(1.3)", filter: "blur(1px) brightness(0.92)", offset: 0.35 },
          { transform: "scale(3.2)", filter: "blur(14px) brightness(0.35)" },
        ],
        // a slow lean in first, then the push
        { duration: reduce ? 1 : 1900, easing: "cubic-bezier(0.42, 0, 0.25, 1)", fill: "forwards" },
      );
    }
    if (!reduce) {
      // frames rush past the camera; ease-in, as real perspective speeds them up near the lens
      rings.forEach((r, i) =>
        r.animate(
          [
            { transform: "translate(-50%, -50%) scale(0.05)", opacity: 0 },
            { opacity: 1, offset: 0.3 },
            { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
          ],
          { duration: 1150, delay: 260 + i * 95, easing: "cubic-bezier(0.6, 0.04, 0.9, 0.4)", fill: "both" },
        ),
      );
      part(".tunnel__streaks").animate(
        [
          { transform: "scale(0.5) rotate(0deg)", opacity: 0 },
          { opacity: 0.9, offset: 0.4 },
          { transform: "scale(2.2) rotate(8deg)", opacity: 0 },
        ],
        { duration: 1650, delay: 250, easing: "cubic-bezier(0.5, 0, 0.75, 0.3)", fill: "both" },
      );
      part(".tunnel__vignette").animate([{ opacity: 0 }, { opacity: 1, offset: 0.55 }, { opacity: 0.7 }], {
        duration: 2100,
        easing: "ease-in-out",
        fill: "forwards",
      });
      // the light at the end of the tunnel, which the room opens out of
      part(".tunnel__light").animate(
        [
          { transform: "translate(-50%, -50%) scale(0.1)", opacity: 0 },
          { transform: "translate(-50%, -50%) scale(0.6)", opacity: 1, offset: 0.6 },
          { transform: "translate(-50%, -50%) scale(1.6)", opacity: 0 },
        ],
        { duration: 1300, delay: 1000, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" },
      );
    }
    const a = pn.animate(
      reduce
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { transform: "scale(0.08)", opacity: 0, borderRadius: "80px", filter: "brightness(1.6)" },
            { transform: "scale(0.1)", opacity: 1, borderRadius: "80px", filter: "brightness(1.6)", offset: 0.1 },
            { transform: "scale(1)", opacity: 1, borderRadius: "22px", filter: "brightness(1)" },
          ],
      // the room grows out of the light slowly, and settles softly (no snap at the end)
      { duration: reduce ? 200 : 1200, delay: reduce ? 0 : 1350, easing: "cubic-bezier(0.37, 0, 0.1, 1)", fill: "both" },
    );
    a.finished
      .then(() => {
        setEntering(false);
        closeBtn.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
        // once every card has landed, browsing moves them without the deal-in delays
        setTimeout(() => setDealt(true), 900 + FILMS.length * 55);
      })
      .catch(() => undefined);
  }, []);

  /* ---------- the tunnel out ---------- */
  const close = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    setPlaying(null);
    const cv = document.querySelector<HTMLCanvasElement>("canvas.film");
    const pn = panel.current!;
    const t = tunnel.current!;
    const rings = Array.from(t.querySelectorAll<HTMLElement>(".tunnel__ring"));
    const part = (c: string) => t.querySelector<HTMLElement>(c)!;
    const reduce = reducedMotion();
    pn.getAnimations().forEach((x) => x.cancel());
    const out = pn.animate(
      reduce
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { transform: "scale(1)", opacity: 1, borderRadius: "22px", filter: "brightness(1)" },
            { transform: "scale(0.1)", opacity: 1, borderRadius: "80px", filter: "brightness(1.6)", offset: 0.88 },
            { transform: "scale(0.08)", opacity: 0, borderRadius: "80px", filter: "brightness(1.6)" },
          ],
      { duration: reduce ? 150 : 800, easing: "cubic-bezier(0.6, 0, 0.8, 0.2)", fill: "forwards" },
    );
    if (!reduce) {
      // backing out: the frames come towards the centre
      rings.forEach((r, i) => {
        r.getAnimations().forEach((x) => x.cancel());
        r.animate(
          [
            { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
            { opacity: 1, offset: 0.7 },
            { transform: "translate(-50%, -50%) scale(0.05)", opacity: 0 },
          ],
          { duration: 1000, delay: 450 + (RINGS - 1 - i) * 65, easing: "cubic-bezier(0.1, 0.6, 0.4, 0.96)", fill: "both" },
        );
      });
      const st = part(".tunnel__streaks");
      st.getAnimations().forEach((x) => x.cancel());
      st.animate(
        [
          { transform: "scale(2.2) rotate(8deg)", opacity: 0 },
          { opacity: 0.8, offset: 0.5 },
          { transform: "scale(0.5) rotate(0deg)", opacity: 0 },
        ],
        { duration: 1200, delay: 450, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)", fill: "both" },
      );
      const vg = part(".tunnel__vignette");
      vg.getAnimations().forEach((x) => x.cancel());
      vg.animate([{ opacity: 0.7 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: 1900, easing: "ease-in-out", fill: "forwards" });
    }
    let back: Animation | null = null;
    if (cv) {
      cv.getAnimations().forEach((x) => x.cancel());
      back = cv.animate(
        [
          { transform: "scale(3.2)", filter: "blur(14px) brightness(0.35)" },
          { transform: "scale(1.35)", filter: "blur(1px) brightness(0.9)", offset: 0.7 },
          { transform: "scale(1)", filter: "blur(0px) brightness(1)" },
        ],
        { duration: reduce ? 1 : 1400, delay: reduce ? 0 : 600, easing: "cubic-bezier(0.2, 0, 0.2, 1)", fill: "both" },
      );
    }
    await Promise.all([out.finished.catch(() => undefined), back?.finished.catch(() => undefined)]);
    if (cv) {
      cv.getAnimations().forEach((x) => x.cancel());
      cv.style.transformOrigin = "";
    }
    onExit();
  }, [onExit]);

  useEffect(() => {
    apiRef.current = { close };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, close]);

  /* ---------- input: wheel, swipe, keys ---------- */
  useEffect(() => {
    const el = panel.current!;
    let last = 0;
    let lastStep = 0;
    let acc = 0;
    let armed = true;
    let prevAbs = 0;
    const onWheel = (e: WheelEvent) => {
      if (playingRef.current || e.ctrlKey) return;
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const d = raw * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      const now = e.timeStamp || performance.now();
      const abs = Math.abs(d);
      // one gesture = one card (a trackpad glide counts once)
      if (now - last > 200 || (!armed && now - lastStep > 350 && abs > 15 && abs > prevAbs * 2)) {
        acc = 0;
        armed = true;
      }
      last = now;
      prevAbs = abs;
      if (!armed) return;
      acc += d;
      if (Math.abs(acc) >= 18) {
        armed = false;
        lastStep = now;
        step(acc > 0 ? 1 : -1);
      }
    };
    let x0 = 0;
    let y0 = 0;
    let x1 = 0;
    let y1 = 0;
    let touching = false;
    const onStart = (e: TouchEvent) => {
      touching = e.touches.length === 1 && !playingRef.current;
      if (!touching) return;
      x0 = x1 = e.touches[0].clientX;
      y0 = y1 = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!touching) return;
      x1 = e.touches[0].clientX;
      y1 = e.touches[0].clientY;
      if (e.cancelable) e.preventDefault();
    };
    const onEnd = () => {
      if (!touching) return;
      touching = false;
      const dx = x0 - x1;
      const dy = y0 - y1;
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(d) > 36) step(d > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (playingRef.current) setPlaying(null);
        else onRequestClose();
        return;
      }
      if (playingRef.current) return; // the film player keeps its own keys
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        go(e.key === "Home" ? 0 : FILMS.length - 1);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go, step, onRequestClose]);

  // the title strip scrolls to keep the current film's title in the middle
  useEffect(() => {
    const nav = titles.current;
    const b = nav?.children[active] as HTMLElement | undefined;
    if (!nav || !b) return;
    nav.scrollTo({ left: b.offsetLeft - nav.clientWidth / 2 + b.offsetWidth / 2, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [active]);

  const film = FILMS[active];
  return (
    <div className="room-wrap">
      <div className="tunnel" ref={tunnel} aria-hidden="true">
        <span className="tunnel__vignette" />
        <span className="tunnel__streaks" />
        {Array.from({ length: RINGS }, (_, i) => (
          <span key={i} className="tunnel__ring" />
        ))}
        <span className="tunnel__light" />
      </div>

      <div className="room" ref={panel} role="dialog" aria-modal="true" aria-labelledby="room-title">
        <header className="room__top">
          <p className="room__brand">
            <span id="room-title">[ AI FILMS ]</span>
            <small>03 — My Work</small>
          </p>
          <nav className="room__titles" aria-label="Films" ref={titles}>
            {FILMS.map((f, i) => (
              <button key={f.slug} type="button" aria-current={i === active ? "true" : undefined} onClick={() => go(i)}>
                {f.title}
              </button>
            ))}
          </nav>
          <button ref={closeBtn} type="button" className="room__close" onClick={onRequestClose}>
            <span>Close</span>
            <i aria-hidden="true" />
          </button>
        </header>

        <div className="stack" data-entering={entering ? "true" : "false"} data-dealt={dealt ? "" : undefined}>
          {FILMS.map((f, i) => {
            const d = i - active;
            const isActive = d === 0;
            return (
              <button
                key={f.slug}
                type="button"
                className="scard"
                data-state={d < 0 ? "past" : d > 40 ? "far" : "on"}
                aria-current={isActive ? "true" : undefined}
                aria-label={isActive ? `Play ${f.title}, ${f.duration}` : `Show ${f.title}`}
                tabIndex={isActive ? 0 : -1}
                // the front card is on top of the row; cards already seen leave over it, like taking cards off a deck
                style={{ "--d": d, "--i": i, zIndex: d < 0 ? 300 + d : 200 - d } as React.CSSProperties}
                onClick={() => (isActive ? setPlaying(f) : go(i))}
              >
                <img src={filmPath(f, "card.webp")} alt="" draggable={false} decoding="async" />
                {isActive && !entering && (
                  <video
                    key={f.slug}
                    src={filmPath(f, "preview.mp4")}
                    poster={filmPath(f, "card.webp")}
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                )}
                <span className="scard__play" aria-hidden="true">
                  <i /> Play
                </span>
              </button>
            );
          })}
        </div>

        <div className="room__caption" key={film.slug}>
          <p className="room__eyebrow">
            {filmMeta(film)}
          </p>
          <h2 className="room__title">{film.title}</h2>
          <p className="room__desc">{film.description}</p>
          <button type="button" className="room__play" onClick={() => setPlaying(film)}>
            <i aria-hidden="true" /> Play film
          </button>
        </div>

        <div className="room__meta" aria-live="polite">
          <p className="room__count">
            <b>{pad(active + 1)}</b> / {pad(FILMS.length)}
          </p>
          <p className="room__hint">Scroll, swipe or ← → to browse</p>
        </div>
      </div>

      {playing && <Player film={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

/* ---------- the film, with sound ---------- */
function Player({ film, onClose }: { film: Film; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    video.current?.focus({ preventScroll: true });
    return () => opener?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="player" role="dialog" aria-modal="true" aria-label={film.title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="player__box">
        <video
          ref={video}
          src={filmPath(film, "film.mp4")}
          poster={filmPath(film, "poster.webp")}
          controls
          autoPlay
          playsInline
          // size the player to the film's own shape (portrait films don't get wide black bars)
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth) v.style.setProperty("--ar", String(v.videoWidth / v.videoHeight));
          }}
        />
        <div className="player__meta">
          <div>
            <p className="room__eyebrow">
              {filmMeta(film)}
            </p>
            <h3>{film.title}</h3>
          </div>
          <p>{film.description}</p>
        </div>
      </div>
      <button ref={closeBtn} type="button" className="player__close" onClick={onClose} aria-label="Close the film">
        <i aria-hidden="true" />
      </button>
    </div>
  );
}
