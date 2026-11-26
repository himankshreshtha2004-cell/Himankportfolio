/* ==========================================================================
   UI/UX ROOM — "Step inside" the UI/UX bay.

   Same tunnel as the other rooms. Inside: a tall wheel of project cards on
   the right (the front one big and upright, the others tilting away along the
   rim and fading), the project's name and description on the left, and a dial
   behind the wheel that turns with it. The room's colours drift from project
   to project as the wheel turns.
   Scroll, swipe, arrow keys or a click on a card turn the wheel.
   ========================================================================== */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { UX_PROJECTS, uxCover } from "../content/uiux";
import { RINGS, reducedMotion, tunnelIn, tunnelOut } from "./tunnel";

type Props = {
  apiRef: React.MutableRefObject<{ close: () => void } | null>;
  onExit: () => void;
  onRequestClose: () => void;
};

const N = UX_PROJECTS.length;
const STEP = 30; // degrees between neighbouring cards on the rim
const pad = (n: number) => String(n).padStart(2, "0");
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function UiuxRoom({ apiRef, onExit, onRequestClose }: Props) {
  const [active, setActive] = useState(0);
  const target = useRef(0);
  const panel = useRef<HTMLDivElement>(null);
  const tunnel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const dial = useRef<SVGGElement>(null);
  const dialNums = useRef<(SVGTextElement | null)[]>([]);
  const leaving = useRef(false);
  const entered = useRef(0); // performance.now() when the cards started to come in (0 = not yet)

  const go = useCallback((i: number) => {
    const t = Math.max(0, Math.min(N - 1, i));
    target.current = t;
    setActive(t);
  }, []);

  useLayoutEffect(() => {
    void tunnelIn(panel.current!, tunnel.current!).then(() => closeBtn.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions));
    // the cards start coming in as the room finishes opening
    const t = window.setTimeout(() => (entered.current = performance.now()), reducedMotion() ? 0 : 1900);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    await tunnelOut(panel.current!, tunnel.current!);
    onExit();
  }, [onExit]);
  useEffect(() => {
    apiRef.current = { close };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, close]);

  /* ---------- the wheel: one smooth position, drawn every frame ---------- */
  useEffect(() => {
    const pn = panel.current!;
    let pos = 0;
    let last = performance.now();
    let raf = 0;
    const reduce = reducedMotion();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pos += (target.current - pos) * (reduce ? 1 : 1 - Math.exp(-dt * 8));
      if (Math.abs(target.current - pos) < 0.0005) pos = target.current;
      const W = pn.clientWidth, H = pn.clientHeight;
      const phone = W < 760;
      const ch = phone ? Math.min(H * 0.36, W * 0.68) : Math.min(H * 0.58, W * 0.34);
      const cw = ch * 0.78;
      const R = phone ? H * 0.62 : H * 1.1;
      const x0 = phone ? W * 0.46 : W * 0.64; // centre of the front card
      const cx = x0 + R; // the wheel's hub (off to the right)
      const cy = phone ? H * 0.37 : H * 0.5;
      const e0 = entered.current;
      for (let i = 0; i < N; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const d = i - pos;
        const a = (d * STEP * Math.PI) / 180;
        // the cards sweep in from the right, the front one first
        const k = e0 ? Math.min(1, Math.max(0, (now - e0 - Math.abs(i - target.current) * 90) / 900)) : 0;
        const slide = reduce ? 0 : (1 - ease(k)) * W * 0.55;
        const x = cx - R * Math.cos(a) + slide;
        const y = cy + R * Math.sin(a);
        const ad = Math.abs(d);
        const op = (reduce ? 1 : ease(k)) * Math.max(0, ad < 1 ? 1 - ad * 0.5 : ad < 2 ? 0.5 - (ad - 1) * 0.32 : 0.18 - (ad - 2) * 0.18);
        const sc = Math.max(0.6, 1 - ad * 0.07);
        el.style.width = `${cw}px`;
        el.style.height = `${ch}px`;
        el.style.opacity = String(op);
        el.style.visibility = op < 0.01 ? "hidden" : "visible";
        el.style.zIndex = String(100 - Math.round(ad * 10));
        el.style.transform = `translate3d(${x - cw / 2}px, ${y - ch / 2}px, 0) rotate(${-d * STEP * 0.8}deg) scale(${sc})`;
        el.tabIndex = Math.round(pos) === i ? 0 : -1;
      }
      // dial: rings and ticks around the hub; the numbers ride the rim and turn with the wheel
      const g = dial.current;
      if (g) {
        g.setAttribute("transform", `translate(${cx} ${cy})`);
        g.querySelectorAll<SVGCircleElement>("circle[data-r]").forEach((c) => c.setAttribute("r", String(R * parseFloat(c.dataset.r!))));
        const ticks = g.querySelector<SVGGElement>(".uxdial__ticks");
        if (ticks) ticks.setAttribute("transform", `rotate(${pos * STEP}) scale(${R / 1000})`);
        const rn = R * 0.6;
        for (let i = 0; i < N; i++) {
          const t = dialNums.current[i];
          if (!t) continue;
          const an = ((i - pos) * STEP * Math.PI) / 180;
          const op = Math.max(0.1, 1 - Math.abs(i - pos) * 0.45);
          t.setAttribute("transform", `translate(${-rn * Math.cos(an)} ${rn * Math.sin(an)}) rotate(${-(i - pos) * STEP})`);
          t.style.opacity = String(Math.abs(i - pos) > 3.2 ? 0 : op);
        }
      }
      // colour grading follows the wheel
      const f = Math.min(N - 1, Math.max(0, pos));
      const i0 = Math.floor(f), i1 = Math.min(N - 1, i0 + 1), t = f - i0;
      const A = UX_PROJECTS[i0], B = UX_PROJECTS[i1];
      pn.style.setProperty("--ux-a", mix(A.bg[0], B.bg[0], t));
      pn.style.setProperty("--ux-b", mix(A.bg[1], B.bg[1], t));
      pn.style.setProperty("--ux-accent", mix(A.accent, B.accent, t));
      const dk = (A.dark ? 1 : 0) + ((B.dark ? 1 : 0) - (A.dark ? 1 : 0)) * t;
      pn.style.setProperty("--ink-d", mix("#1a1612", "#f3f0ea", dk));
      pn.style.setProperty("--ink-m", mix("#5d544b", "#b9bccb", dk));
      pn.style.setProperty("--ink-l", mix("#8a8077", "#8b90a6", dk));
      pn.style.setProperty("--ux-chip", dk > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.35)");
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------- input: wheel, swipe, keys ---------- */
  useEffect(() => {
    const el = panel.current!;
    let lastWheel = 0;
    let lastStep = 0;
    let acc = 0;
    let armed = true;
    let prevAbs = 0;
    const step = (d: number) => go(Math.round(target.current) + d);
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const d = raw * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      const now = e.timeStamp || performance.now();
      const abs = Math.abs(d);
      // one gesture = one project (a trackpad glide counts once)
      if (now - lastWheel > 200 || (!armed && now - lastStep > 350 && abs > 15 && abs > prevAbs * 2)) {
        acc = 0;
        armed = true;
      }
      lastWheel = now;
      prevAbs = abs;
      if (!armed) return;
      acc += d;
      if (Math.abs(acc) >= 18) {
        armed = false;
        lastStep = now;
        step(acc > 0 ? 1 : -1);
      }
    };
    let y0 = 0, y1 = 0, touching = false;
    const onStart = (e: TouchEvent) => {
      touching = e.touches.length === 1;
      if (touching) y0 = y1 = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (!touching) return;
      y1 = e.touches[0].clientY;
      if (e.cancelable) e.preventDefault();
    };
    const onEnd = () => {
      if (!touching) return;
      touching = false;
      if (Math.abs(y0 - y1) > 36) step(y0 - y1 > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onRequestClose();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        go(e.key === "Home" ? 0 : N - 1);
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
  }, [go, onRequestClose]);

  const p = UX_PROJECTS[active];
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

      <div className="room room--uiux" ref={panel} role="dialog" aria-modal="true" aria-labelledby="room-title">
        <svg className="uxdial" aria-hidden="true" focusable="false">
          <g ref={dial}>
            <circle data-r="1" fill="none" stroke="var(--ux-accent)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="2 7" />
            <circle data-r="0.84" fill="none" stroke="var(--ux-accent)" strokeOpacity="0.22" strokeWidth="1" />
            <circle data-r="0.52" fill="var(--ux-accent)" fillOpacity="0.05" stroke="var(--ux-accent)" strokeOpacity="0.2" strokeWidth="1" />
            <circle data-r="0.46" fill="none" stroke="var(--ux-accent)" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="1 6" />
            <g className="uxdial__ticks">
              {Array.from({ length: 144 }, (_, i) => {
                const long = i % 12 === 0;
                const a = (i * 2.5 * Math.PI) / 180;
                const r1 = 700, r2 = long ? 668 : 684; // drawn on a 1000-unit rim; the group is scaled to the wheel
                return (
                  <line
                    key={i}
                    x1={-Math.cos(a) * r1}
                    y1={Math.sin(a) * r1}
                    x2={-Math.cos(a) * r2}
                    y2={Math.sin(a) * r2}
                    stroke="var(--ux-accent)"
                    strokeOpacity={long ? 0.55 : 0.25}
                    strokeWidth={long ? 2 : 1}
                    className="uxdial__tick"
                  />
                );
              })}
            </g>
            {UX_PROJECTS.map((u, i) => (
              <text key={u.slug} ref={(el) => (dialNums.current[i] = el)} className="uxdial__num" textAnchor="middle" dominantBaseline="middle">
                {pad(i + 1)}
              </text>
            ))}
          </g>
        </svg>

        <header className="room__top">
          <p className="room__brand">
            <span id="room-title">[ UI / UX ]</span>
            <small>03 — My Work</small>
          </p>
          <span />
          <button ref={closeBtn} type="button" className="room__close" onClick={onRequestClose}>
            <span>Close</span>
            <i aria-hidden="true" />
          </button>
        </header>

        <section className="uxcap" key={p.slug} aria-live="polite">
          <p className="uxcap__count">
            <b>{pad(active + 1)}</b> / {pad(N)}
          </p>
          <p className="room__eyebrow">{p.kind}</p>
          <h2 className="uxcap__title">{p.title}</h2>
          <p className="uxcap__desc">{p.description}</p>
          <ul className="uxcap__tags">
            {p.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <div className="uxwheel" role="listbox" aria-label="Projects" aria-orientation="vertical">
          {UX_PROJECTS.map((u, i) => (
            <button
              key={u.slug}
              ref={(el) => (cards.current[i] = el)}
              type="button"
              role="option"
              aria-selected={i === active}
              aria-label={`${u.title}, ${u.kind}`}
              className="uxcard"
              style={uxCover(i)}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <p className="uxhint" aria-hidden="true">Scroll to turn the wheel</p>
      </div>
    </div>
  );
}
