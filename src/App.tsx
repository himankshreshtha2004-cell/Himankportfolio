import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilmPlayer } from "./film/player";
import { STOPS, buildTimeline, stopAnchor, type StopId } from "./content/timeline";
import { Header } from "./components/Header";
import { SideIndex } from "./components/SideIndex";
import { Sections } from "./components/Sections";
import { FilmRoom } from "./components/FilmRoom";
import { GamesRoom } from "./components/GamesRoom";
import { UiuxRoom } from "./components/UiuxRoom";
import { ElectronicsRoom } from "./components/ElectronicsRoom";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
/** film speed between stops, in frames per second (the film itself runs at 24) */
const FPS = 30;

type RoomId = "aifilm" | "games" | "uiux" | "electronics";
const ROOM_IDS: string[] = ["aifilm", "games", "uiux", "electronics"];
const ROOM_HASH: Record<RoomId, string> = { aifilm: "#ai-films", games: "#games", uiux: "#ui-ux", electronics: "#electronics" };

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layers = useRef<Record<string, HTMLElement | null>>({});
  const { segs, total } = useMemo(buildTimeline, []);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const jumpRef = useRef<(to: StopId) => void>(() => {});
  // the AI Filmmaking room ("Step inside")
  const [room, setRoom] = useState<RoomId | null>(null);
  const roomOpen = useRef(false);
  const roomApi = useRef<{ close: () => void } | null>(null);
  const openRoomRef = useRef<(which: RoomId) => void>(() => {});

  useEffect(() => {
    const cv = canvas.current!;
    const player = new FilmPlayer(cv, import.meta.env.BASE_URL);
    player.onProgress = (lo) => setLoaded(lo);

    /** scroll (vh) → film frame */
    const frameAt = (y: number) => {
      const seg = segs.find((s) => y < s.end) ?? segs[segs.length - 1];
      const t = clamp((y - seg.start) / (seg.end - seg.start || 1));
      return seg.f0 + (seg.f1 - seg.f0) * t;
    };
    const anchorY = STOPS.map((_, i) => stopAnchor(segs, i));
    const anchorF = anchorY.map(frameAt);
    player.setStops(anchorF);
    if (location.search.includes("debug")) (window as unknown as { __player: FilmPlayer }).__player = player;
    player.loadPreview();
    player.loadSharp();
    player.focus(0);

    const vh = () => window.innerHeight / 100;
    let shown = 0; // the frame on screen
    let last = -1;
    let raf = 0;
    let prevT = performance.now();
    let restY = 0; // last position in vh, kept across resizes
    let setPx = -1; // where the animation last put the page
    const visShown: number[] = STOPS.map((_, i) => (i === 0 ? 1 : 0));
    const vStr = STOPS.map(() => "");
    let scrolledStr = "";

    /** a move between stops: the film plays at a steady speed and the page follows it */
    type Anim = { y0: number; y1: number; f0: number; f1: number; t0: number; dur: number; to: number; y: number; f: number };
    let anim: Anim | null = null;

    /** scroll (vh) → film frame, focal point, and how visible each section's content is */
    const read = (y: number) => {
      const seg = segs.find((s) => y < s.end) ?? segs[segs.length - 1];
      const t = clamp((y - seg.start) / (seg.end - seg.start || 1));
      const frame = seg.f0 + (seg.f1 - seg.f0) * t;
      let focal = 0.5;
      if (seg.kind === "hold") focal = STOPS[seg.stop].focal;
      else focal = STOPS[seg.from].focal + (STOPS[seg.from + 1].focal - STOPS[seg.from].focal) * smooth(t);
      const vis = STOPS.map((_, i) => {
        const h = segs.find((s) => s.kind === "hold" && s.stop === i)!;
        const fade = 14;
        const a = i === 0 ? 1 : clamp((y - (h.start - fade)) / fade);
        const b = i === STOPS.length - 1 ? 1 : clamp((h.end + fade * 0.4 - y) / fade);
        return smooth(Math.min(a, b));
      });
      return { frame, focal, vis };
    };

    /** the page position (vh) where the film shows frame f, on the way from y0 to y1 */
    const yForFrame = (f: number, a: Anim, e: number) => {
      const lo = Math.min(a.y0, a.y1);
      const hi = Math.max(a.y0, a.y1);
      for (const s of segs) {
        if (s.f1 <= s.f0 || s.end < lo || s.start > hi) continue;
        if (f >= s.f0 && f <= s.f1) return clamp(s.start + ((f - s.f0) / (s.f1 - s.f0)) * (s.end - s.start), lo, hi);
      }
      return a.y0 + (a.y1 - a.y0) * e;
    };

    const go = (to: number) => {
      to = Math.max(0, Math.min(STOPS.length - 1, to));
      const y1 = anchorY[to];
      if (reduced()) {
        anim = null;
        window.scrollTo(0, y1 * vh());
        return;
      }
      const y0 = anim ? anim.y : window.scrollY / vh();
      const f0 = anim ? anim.f : shown;
      const f1 = anchorF[to];
      const dur = 1000 * clamp(Math.abs(f1 - f0) / FPS, 0.6, 2.4);
      anim = { y0, y1, f0, f1, t0: performance.now(), dur, to, y: y0, f: f0 };
    };

    /** one gesture = one section */
    const step = (dir: 1 | -1) => {
      let from: number;
      if (anim) from = anim.to;
      else {
        const y = window.scrollY / vh();
        from = anchorY.findIndex((a) => Math.abs(a - y) < 2);
        if (from < 0) {
          // between stops (after dragging the scrollbar): go to the next one that way
          const ahead = anchorY.map((a, i) => ({ a, i })).filter(({ a }) => (dir > 0 ? a > y : a < y));
          if (ahead.length) go(dir > 0 ? ahead[0].i : ahead[ahead.length - 1].i);
          return;
        }
      }
      const to = from + dir;
      if (to >= 0 && to < STOPS.length) go(to);
    };

    const tick = (now: number) => {
      const dt = Math.min(100, now - prevT);
      prevT = now;
      // the visitor dragged the scrollbar mid-move: let go
      if (anim && setPx >= 0 && Math.abs(window.scrollY - setPx) > 3) anim = null;

      let y: number;
      let frame: number;
      let focal: number;
      let vis: number[];
      let dest: number | null = null;
      let speed = 0; // frames per second
      let dir = 0; // which way the picture may step
      let cur: number;
      if (anim) {
        const k = clamp((now - anim.t0) / anim.dur);
        // steady film speed, eased only slightly at both ends (the footage slows into each stop by itself)
        const e = 0.72 * k + 0.28 * (0.5 - 0.5 * Math.cos(Math.PI * k));
        anim.f = anim.f0 + (anim.f1 - anim.f0) * e;
        anim.y = k >= 1 ? anim.y1 : yForFrame(anim.f, anim, e);
        setPx = Math.round(anim.y * vh());
        window.scrollTo(0, setPx);
        y = anim.y;
        const r = read(y);
        focal = r.focal;
        frame = shown = anim.f;
        dest = anim.f1;
        dir = Math.sign(anim.f1 - anim.f0);
        speed = (Math.abs(anim.f1 - anim.f0) / (anim.dur / 1000)) * 1.16; // peak of the eased speed
        cur = anim.to;
        const to = anim.to;
        vis = STOPS.map((_, i) => (i === to ? smooth(clamp((k - 0.6) / 0.4)) : 0));
        if (k >= 1) {
          anim = null;
          setPx = -1;
          vis = r.vis;
        }
      } else {
        y = window.scrollY / vh();
        const r = read(y);
        focal = r.focal;
        vis = r.vis;
        // reduced motion: show only each section's own frame, no camera travel
        const target = reduced() ? STOPS[vis.indexOf(Math.max(...vis))].hold[1] : r.frame;
        shown += (target - shown) * (Math.abs(target - shown) > 40 ? 0.35 : 0.25);
        if (Math.abs(target - shown) < 0.05) shown = target;
        frame = shown;
        cur = -1;
      }
      restY = y;
      player.focus(frame, dest, speed);
      player.draw(frame, focal, dir);

      // content fades over time, not over scroll distance, so it never flashes past
      const a = 1 - Math.exp(-dt / 110);
      vis.forEach((v, i) => {
        let s = visShown[i] + (v - visShown[i]) * a;
        if (Math.abs(v - s) < 0.003) s = v;
        visShown[i] = s;
        const el = layers.current[STOPS[i].id];
        if (!el) return;
        const str = s.toFixed(3);
        if (vStr[i] !== str) {
          vStr[i] = str;
          el.style.setProperty("--v", str);
        }
        const on = s > 0.02;
        if (el.dataset.on !== String(on)) {
          el.dataset.on = String(on);
          el.toggleAttribute("inert", !on);
        }
      });
      if (cur < 0) cur = visShown.indexOf(Math.max(...visShown));
      if (cur !== last) {
        last = cur;
        setActive(cur);
      }
      const sc = clamp(y / 8).toFixed(2);
      if (sc !== scrolledStr) {
        scrolledStr = sc;
        document.documentElement.style.setProperty("--scrolled", sc);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // a link straight to a room (#ai-films, #games): land on its stop and step inside
    const deep = (Object.keys(ROOM_HASH) as RoomId[]).find((k) => ROOM_HASH[k] === location.hash) ?? null;
    if (deep) {
      history.replaceState(null, "", location.pathname + location.search);
      const i = STOPS.findIndex((st) => st.id === deep);
      window.scrollTo(0, anchorY[i] * vh());
      shown = anchorF[i];
      setTimeout(() => openRoomRef.current(deep), 600);
    }

    jumpRef.current = (to: StopId) => {
      const i = STOPS.findIndex((s) => s.id === to);
      if (i >= 0) go(i);
    };

    /* ---------- input: wheel, touch, keys ---------- */
    /** true when the gesture belongs to a scrollable box (a long card on a phone, the menu) */
    const scrollBox = (el: EventTarget | null) => {
      for (let n = el as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
        if (n.classList?.contains("mobile-menu")) return n;
        const oy = getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
      }
      return null;
    };
    const canScroll = (n: HTMLElement | null, dir: number) =>
      !!n && (dir > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0);

    let lastWheel = 0;
    let lastBoxWheel = -1e9;
    let lastStep = 0;
    let acc = 0;
    let armed = true;
    let prevAbs = 0;
    const onWheel = (e: WheelEvent) => {
      if (roomOpen.current) return; // the film room handles its own input
      if (e.ctrlKey) return; // pinch zoom
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      const sb = scrollBox(e.target);
      if (canScroll(sb, Math.sign(dy))) {
        lastBoxWheel = e.timeStamp || performance.now();
        return;
      }
      e.preventDefault();
      // a long card was just being scrolled: its end (or a reversed flick / trailing glide) must not carry the page to another section
      if (sb) {
        const t = e.timeStamp || performance.now();
        if (t - lastBoxWheel < 700) {
          lastBoxWheel = t;
          return;
        }
      }
      // when the event happened (not when the page got to it), so a busy moment can't split one glide in two
      const now = e.timeStamp || performance.now();
      const abs = Math.abs(dy);
      // a new gesture: a pause, or a fresh flick on top of a fading trackpad glide
      if (now - lastWheel > 200 || (!armed && now - lastStep > 350 && abs > 15 && abs > prevAbs * 2)) {
        acc = 0;
        armed = true;
      }
      lastWheel = now;
      prevAbs = abs;
      if (!armed || abs < 1) return;
      acc += dy;
      if (Math.abs(acc) >= 18) {
        armed = false;
        lastStep = now;
        step(acc > 0 ? 1 : -1);
      }
    };

    let ty0 = 0;
    let tyLast = 0;
    let touching = false;
    let box: HTMLElement | null = null;
    let boxTop = false;
    let boxBottom = false;
    const onTouchStart = (e: TouchEvent) => {
      if (roomOpen.current) return; // the film room handles its own input
      touching = e.touches.length === 1;
      if (!touching) return;
      ty0 = tyLast = e.touches[0].clientY;
      box = scrollBox(e.target);
      boxTop = !box || box.scrollTop <= 0;
      boxBottom = !box || box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (roomOpen.current) return; // the film room handles its own input
      if (!touching || e.touches.length !== 1) return;
      tyLast = e.touches[0].clientY;
      if (!box && e.cancelable) e.preventDefault(); // the film moves by steps, not by dragging the page
    };
    const onTouchEnd = () => {
      if (roomOpen.current) return; // the film room handles its own input
      if (!touching) return;
      touching = false;
      const dy = ty0 - tyLast;
      if (Math.abs(dy) < 40) return;
      const dir = dy > 0 ? 1 : -1;
      if (box?.classList.contains("mobile-menu")) return;
      if (box && !(dir > 0 ? boxBottom : boxTop)) return; // the card scrolled; the next swipe at its edge moves on
      step(dir);
    };

    const onKey = (e: KeyboardEvent) => {
      if (roomOpen.current) return; // the film room handles its own input
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (t.closest?.("input, textarea, select, [contenteditable]")) return;
      let dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      else if (e.key === " " && !t.closest?.("a, button, [role=button]")) dir = e.shiftKey ? -1 : 1;
      else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        go(e.key === "Home" ? 0 : STOPS.length - 1);
        return;
      }
      if (!dir) return;
      e.preventDefault();
      step(dir as 1 | -1);
    };

    const onResize = () => {
      player.resize();
      if (!anim) window.scrollTo(0, restY * vh()); // stay on the same frame
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [segs]);

  // any element with data-to="<section>" jumps through the film to it
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const r = (e.target as HTMLElement).closest<HTMLElement>("[data-room]");
      if (r) {
        e.preventDefault();
        openRoomRef.current((ROOM_IDS.includes(r.dataset.room as RoomId) ? r.dataset.room : "aifilm") as RoomId);
        return;
      }
      const a = (e.target as HTMLElement).closest<HTMLElement>("[data-to]");
      if (!a) return;
      e.preventDefault();
      jumpRef.current(a.dataset.to as StopId);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* ---------- the film room ---------- */
  openRoomRef.current = (which) => {
    if (roomOpen.current) return;
    roomOpen.current = true;
    document.documentElement.dataset.room = which;
    history.pushState({ room: which }, "", ROOM_HASH[which]);
    setRoom(which);
  };
  // Close / Esc: go back in history, so the browser's Back button and Close do the same thing
  const requestCloseRoom = useCallback(() => {
    if ((history.state as { room?: string } | null)?.room) history.back();
    else roomApi.current?.close();
  }, []);
  const onRoomExit = useCallback(() => {
    roomOpen.current = false;
    delete document.documentElement.dataset.room;
    const was = room;
    setRoom(null);
    // back on the button that opened the room (once the page behind is reachable again)
    setTimeout(() => document.querySelector<HTMLElement>(`[data-room="${was ?? "aifilm"}"]`)?.focus({ preventScroll: true, focusVisible: false } as FocusOptions), 60);
  }, [room]);
  useEffect(() => {
    const onPop = () => {
      if (roomOpen.current && !(history.state as { room?: string } | null)?.room) roomApi.current?.close();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    // the page behind the room can't be reached by keyboard or screen reader
    document.querySelectorAll("main, .site-header, .side-index").forEach((el) => el.toggleAttribute("inert", room !== null));
  }, [room]);

  const register = (id: StopId) => (el: HTMLElement | null) => (layers.current[id] = el);

  return (
    <>
      <canvas ref={canvas} className="film" aria-hidden="true" />
      <div className="film-shade" aria-hidden="true" />
      <Header active={STOPS[active].parent ?? STOPS[active].id} />
      <SideIndex active={active} />
      <main id="top">
        <Sections register={register} />
      </main>
      <div className="track" style={{ height: `calc(${total}vh + 100vh)` }} aria-hidden="true" />
      {room === "aifilm" && <FilmRoom apiRef={roomApi} onExit={onRoomExit} onRequestClose={requestCloseRoom} />}
      {room === "games" && <GamesRoom apiRef={roomApi} onExit={onRoomExit} onRequestClose={requestCloseRoom} />}
      {room === "electronics" && <ElectronicsRoom apiRef={roomApi} onExit={onRoomExit} onRequestClose={requestCloseRoom} />}
      {room === "uiux" && <UiuxRoom apiRef={roomApi} onExit={onRoomExit} onRequestClose={requestCloseRoom} />}
      <div className="loader" data-done={loaded >= STOPS[1].hold[1] ? "true" : "false"} aria-hidden="true">
        <span style={{ width: `${Math.min(100, (loaded / 430) * 100)}%` }} />
      </div>
    </>
  );
}
