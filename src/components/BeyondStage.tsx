import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SPORTS } from "../content/beyond";
import type { BeyondPhoto } from "../content/beyond";

/** Beyond Work: two tables (Sports, Music) of polaroids you can drag, flip, stack and throw again. */
type Group = { id: string; label: string; line: string; photos: BeyondPhoto[] };
const bySport = (id: string) => SPORTS.find((s) => s.id === id)!;
const GROUPS: Group[] = [
  {
    id: "sports",
    label: "Sports",
    line: "Pitch and court: the team, the trophy, the huddle and a match on the badminton court.",
    photos: [...bySport("football").photos, ...bySport("badminton").photos],
  },
  { id: "music", label: "Music", line: bySport("music").line, photos: bySport("music").photos },
];

type C = { x: number; y: number; r: number; vx: number; vy: number };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
function shuf<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function BeyondStage() {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const cs = useRef<C[]>([]);
  const wRef = useRef(200);
  const zRef = useRef(10);
  const drag = useRef<{ i: number; sx: number; sy: number; ox: number; oy: number; moved: number; lx: number; ly: number; lt: number } | null>(null);
  const [active, setActive] = useState(false);
  const [g, setG] = useState(0);
  const [hintOn, setHintOn] = useState(true);
  const group = GROUPS[g];

  useEffect(() => {
    const layer = root.current?.closest<HTMLElement>(".layer");
    if (!layer) return;
    const read = () => setActive(layer.dataset.on === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(layer, { attributes: true, attributeFilter: ["data-on"] });
    return () => mo.disconnect();
  }, []);

  const put = (i: number) => {
    const c = cs.current[i];
    const el = els.current[i];
    if (c && el) el.style.transform = `translate(${c.x}px,${c.y}px) rotate(${c.r}deg)`;
  };

  /** thrown-on-the-table scatter: random spots in a tight area, big tilts, only partial overlaps so no face is buried */
  const layout = (n: number) => {
    const pw = window.innerWidth, ph = window.innerHeight;
    const mob = pw < 860;
    const reserve = mob ? 0 : Math.min(240, Math.max(190, pw * 0.14));
    const aw = pw - reserve;
    const w = mob ? Math.min(172, (pw - 30) / 2.05) : Math.min(250, aw * 0.2, (ph - 310) / 2.5);
    const h = w / 0.82;
    const rw = mob ? pw - 20 : Math.min(aw - 20, w * 3.9);
    const rh = mob ? ph - 230 : Math.min(ph - 300, h * 2.25);
    const x0 = (aw - rw) / 2 + 0, x1 = x0 + rw - w;
    const y0 = Math.max(mob ? 110 : 200, (ph - rh) / 2 + 40), y1 = y0 + rh - h;
    const ov = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const dx = Math.min(a.x, b.x) + w - Math.max(a.x, b.x), dy = Math.min(a.y, b.y) + h - Math.max(a.y, b.y);
      return dx > 0 && dy > 0 ? (dx * dy) / (w * h) : 0;
    };
    let lim = mob ? 0.22 : 0.19;
    let slots: { x: number; y: number; r: number }[] = [];
    for (let attempt = 0; attempt < 40; attempt++) {
      slots = [];
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        let placed = false;
        for (let k = 0; k < 160; k++) {
          const s = { x: rnd(x0, x1), y: rnd(y0, Math.max(y0, y1)), r: rnd(-16, 16) };
          if (slots.every((o) => ov(o, s) <= lim)) { slots.push(s); placed = true; break; }
        }
        if (!placed) ok = false;
      }
      if (ok) break;
      lim += 0.03;
    }
    return { w, slots, aw };
  };

  const arrange = useCallback((mode: "init" | "throw" | "stack" | "snap") => {
    const n = GROUPS[g].photos.length;
    const L = layout(n);
    wRef.current = L.w;
    root.current?.style.setProperty("--w", L.w + "px");
    const perm = shuf([...Array(n).keys()]);
    const zs = shuf([...Array(n).keys()]);
    const ph = window.innerHeight, pw = window.innerWidth;
    for (let i = 0; i < n; i++) {
      const el = els.current[i];
      if (!el) continue;
      const s = L.slots[perm[i]];
      const c = (cs.current[i] ||= { x: 0, y: 0, r: 0, vx: 0, vy: 0 });
      el.classList.remove("is-flip");
      el.style.zIndex = String(10 + zs[i]);
      let tx = s.x, ty = s.y, tr = s.r;
      if (mode === "stack") { tx = L.aw / 2 - L.w / 2 + rnd(-10, 10); ty = ph / 2 - L.w / 1.64 + rnd(-10, 10); tr = rnd(-9, 9); }
      if (mode === "snap") { c.x = tx; c.y = ty; c.r = tr; el.style.transition = ""; put(i); continue; }
      if (mode === "init" || mode === "throw") {
        c.x = mode === "init" ? pw + 80 : L.aw / 2 - L.w / 2;
        c.y = ph + 80; c.r = rnd(-50, 50);
        el.style.transition = "none";
        put(i);
        void el.offsetWidth;
      }
      const delay = 60 + Math.random() * n * 130;
      window.setTimeout(() => {
        el.style.transition = "transform .85s cubic-bezier(.2,.9,.25,1.12)";
        c.x = tx; c.y = ty; c.r = tr; put(i);
        window.setTimeout(() => { el.style.transition = ""; }, 900);
      }, delay);
    }
    zRef.current = 10 + n + 1;
  }, [g]);

  // deal the photos whenever the section comes on screen or the tab changes
  useLayoutEffect(() => {
    if (!active) return;
    setHintOn(true);
    arrange("init");
  }, [active, g, arrange]);

  useEffect(() => {
    let t = 0;
    const onR = () => { window.clearTimeout(t); t = window.setTimeout(() => arrange("snap"), 200); };
    window.addEventListener("resize", onR);
    return () => { window.removeEventListener("resize", onR); window.clearTimeout(t); };
  }, [arrange]);

  const down = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const el = els.current[i], c = cs.current[i];
    if (!el || !c) return;
    el.setPointerCapture(e.pointerId);
    el.classList.add("is-drag");
    el.style.transition = "";
    el.style.zIndex = String(++zRef.current);
    drag.current = { i, sx: e.clientX, sy: e.clientY, ox: c.x, oy: c.y, moved: 0, lx: e.clientX, ly: e.clientY, lt: performance.now() };
    c.vx = c.vy = 0;
    setHintOn(false);
  };
  const move = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current, c = cs.current[i];
    if (!d || d.i !== i || !c) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    const now = performance.now(), dt = Math.max(8, now - d.lt);
    c.vx = ((e.clientX - d.lx) / dt) * 16; c.vy = ((e.clientY - d.ly) / dt) * 16;
    d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
    c.x = d.ox + dx; c.y = d.oy + dy;
    c.r = Math.max(-25, Math.min(25, c.r + c.vx * 0.15));
    put(i);
  };
  const up = (i: number) => () => {
    const d = drag.current, el = els.current[i], c = cs.current[i];
    drag.current = null;
    if (!el || !c || !d) return;
    el.classList.remove("is-drag");
    if (d.moved < 6) { el.classList.toggle("is-flip"); return; }
    const w = wRef.current, h = w / 0.82;
    const step = () => {
      c.x += c.vx; c.y += c.vy; c.vx *= 0.93; c.vy *= 0.93; c.r += c.vx * 0.05;
      const aw = window.innerWidth;
      if (c.x < 0) { c.x = 0; c.vx *= -0.5; }
      if (c.x > aw - w) { c.x = aw - w; c.vx *= -0.5; }
      if (c.y < 56) { c.y = 56; c.vy *= -0.5; }
      if (c.y > window.innerHeight - h - 8) { c.y = window.innerHeight - h - 8; c.vy *= -0.5; }
      put(i);
      if (Math.hypot(c.vx, c.vy) > 0.3) requestAnimationFrame(step);
    };
    step();
  };

  return (
    <div ref={root} className="bt" data-g={group.id} data-active={active ? "true" : "false"}>
      <div className="bt-scrim" aria-hidden="true" />
      <div className="bt-head">
        <div className="bt-tabs" role="tablist" aria-label="Beyond work">
          {GROUPS.map((x, k) => (
            <button key={x.id} role="tab" aria-selected={g === k} className={g === k ? "is-on" : ""} onClick={() => setG(k)}>
              {x.label}
            </button>
          ))}
        </div>
        <p className="bt-line">{group.line}</p>
      </div>
      {group.photos.map((p, i) => (
        <div
          key={group.id + i}
          ref={(el) => { els.current[i] = el; }}
          className="bt-pol"
          onPointerDown={down(i)}
          onPointerMove={move(i)}
          onPointerUp={up(i)}
          onPointerCancel={up(i)}
        >
          <div className="bt-in">
            <div className="bt-face">
              <span className="bt-tape" />
              <img src={p.src} alt={p.cap} draggable={false} style={p.pos ? { objectPosition: p.pos } : undefined} />
              <div className="bt-cap">{p.cap}</div>
            </div>
            <div className="bt-face bt-back">
              <b>{p.cap}</b>
              <small>{group.label}</small>
            </div>
          </div>
        </div>
      ))}
      <div className="bt-hint" style={{ opacity: hintOn ? 0.75 : 0 }}>Drag a photo · flick it · tap to flip</div>
      <div className="bt-bar">
        <button className="bt-btn bt-btn--g" onClick={() => arrange("stack")}>Stack</button>
        <button className="bt-btn" onClick={() => arrange("throw")}>Throw them again</button>
      </div>
    </div>
  );
}
