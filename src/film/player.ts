/* ==========================================================================
   FILM PLAYER — draws one frame of the film on a full-screen canvas.

   Frames
   - Preview: 7 sheets of 64 small frames, loaded first. Last resort only.
   - Sharp: "hi" 2560 px, "mid" 1600 px (small screens), "tall" 1240×1440
     (portrait phones: the part of the frame a phone can show, half the work
     to decode). Packed 24 per file, or one file per frame.

   Loading (network)
   - Current frame → landing frames of the next/previous stops (byte ranges)
     → the way there → every other stop's landing → the rest, in the
     background. Failed requests back off before trying again.

   Decoding
   - Frames are decoded ahead into ImageBitmaps (off the main thread, never
     silently dropped by the browser), along the coming move.
   - The decode speed is measured. When the camera moves faster than the
     device can decode (fast scrolling), every 2nd/3rd… frame is decoded, so
     a fast move plays as a sharp fast-forward instead of a blur.
   - Decoded frames are kept until the memory budget needs the room.

   Drawing
   - While moving, the picture only ever steps forward in the direction of
     travel (no flicking back). If the exact frame isn't ready, the nearest
     ready frame ahead/behind is used, or the last frame is held a moment;
     the blurry preview is used only if nothing sharp is near.
   ========================================================================== */
import { FILM } from "../content/timeline";

type Tier = "hi" | "mid" | "tall";
type TierInfo = { w: number; h: number; packs: number[][]; crop?: { x: number; w: number } };
type Index = {
  frames: number;
  per: number;
  /** "packs" (default): f/<tier>/<pack>.bin · "files": one f/<tier>/<frame>.webp per frame, for hosts that only serve image types */
  layout?: "packs" | "files";
  tiers: Partial<Record<Tier, TierInfo>>;
};
type Drawable = ImageBitmap | HTMLImageElement;
/** where the film sits inside an image: x/y = image px of the film's top-left, w = image px of the film's full width */
type Src = { img: Drawable; x: number; y: number; w: number; sharp: boolean; id: number; clip?: [number, number] };

const N = FILM.frames;
const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const BUDGET = touch ? 300e6 : 650e6; // bytes of decoded frames kept
const DECODES_AT_ONCE = touch ? 3 : 4;
const TALL_MAX_ASPECT = 0.5625; // 9:16 or narrower

export class FilmPlayer {
  private ctx: CanvasRenderingContext2D;
  private lo: (Src | null)[] = Array(N).fill(null);
  // sharp frames (reset when the tier changes)
  private gen = 0;
  private blobs: (Blob | null)[] = Array(N).fill(null);
  private bmps: (Drawable | null)[] = Array(N).fill(null);
  private decodedCount = 0;
  private decoding = new Set<number>();
  private req = new Uint8Array(N); // 0 = not asked, 1 = on its way, 2 = here
  private retryAt = new Float64Array(N);
  private inflight = 0;
  private offsets: number[][] = [];
  private noRange = false;
  private index: Index | null = null;
  private tier: Tier = "hi";
  // what the visitor is doing
  private center = 0;
  private dest: number | null = null;
  private speed = 0; // frames per second while moving
  private stride = 1;
  private anchors: number[] = [];
  private plan: number[] = [];
  private planSet = new Set<number>();
  /** decoded frames that must not be thrown away: the plan plus the frames right around the visitor */
  private keepSet = new Set<number>();
  private maxDecoded = 24;
  private decodeW = 0; // 0 = decode at full size
  private decodeH = 0;
  private decodeMs = 35; // running average per frame while resting
  private decodeMsMove = 0; // …and while the film moves (decoding then shares the machine with drawing); 0 = not measured yet
  // drawing
  private lastSrc = -1;
  private lastSharp = false;
  private lastKey = "";
  private loadedLo = 0;
  private loadedSharp = 0;
  onProgress?: (loadedLo: number, loadedSharp: number) => void;

  constructor(private canvas: HTMLCanvasElement, private base: string) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.resize();
  }

  /** the frames where the film rests (one per section), used to load ahead */
  setStops(frames: number[]) {
    this.anchors = [...new Set(frames.map((f) => Math.max(0, Math.min(N - 1, Math.round(f)))))].sort((a, b) => a - b);
    this.replan();
  }

  /* ---------- screen + tier ---------- */
  private wantTier(): Tier {
    const { width: cw, height: ch } = this.canvas;
    const t = this.index?.tiers;
    if (cw / ch <= TALL_MAX_ASPECT && (!t || t.tall)) return "tall";
    const need = Math.max(cw, ch * (16 / 9));
    if (need <= 1700 && (!t || t.mid)) return "mid";
    return t && !t.hi ? ((Object.keys(t)[0] as Tier) ?? "hi") : "hi";
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.lastKey = "";
    }
    const t = this.wantTier();
    if (this.index && t !== this.tier) this.setTier(t);
    else this.tier = t;
    this.sizeDecode();
  }

  /** switch frame set (e.g. a phone turned sideways): start the sharp frames over */
  private setTier(t: Tier) {
    this.gen++;
    this.tier = t;
    this.bmps.forEach((b) => FilmPlayer.release(b));
    this.blobs.fill(null);
    this.bmps.fill(null);
    this.decodedCount = 0;
    this.decoding.clear();
    this.req.fill(0);
    this.retryAt.fill(0);
    this.inflight = 0;
    this.loadedSharp = 0;
    this.prepareOffsets();
    this.sizeDecode();
    this.replan();
    this.pumpNet();
  }

  private info(): TierInfo | undefined {
    return this.index?.tiers[this.tier];
  }

  /** decode no larger than the screen needs (cover fit), and fit the memory budget */
  private sizeDecode() {
    const ti = this.info();
    const tw = ti?.w ?? 2560;
    const th = ti?.h ?? 1440;
    const need = Math.ceil(Math.max(this.canvas.width, this.canvas.height * (16 / 9)));
    if (!ti?.crop && need < tw * 0.94) {
      this.decodeW = need;
      this.decodeH = Math.ceil((need * 9) / 16);
    } else {
      this.decodeW = 0;
      this.decodeH = 0;
    }
    const w = this.decodeW || ti?.crop?.w || tw;
    const h = this.decodeH || th;
    this.maxDecoded = Math.max(12, Math.min(160, Math.floor(BUDGET / (w * h * 4))));
  }

  private async decode(blob: Blob, resize: boolean): Promise<Drawable> {
    if (typeof createImageBitmap === "function") {
      if (resize && this.decodeW) {
        try {
          return await createImageBitmap(blob, { resizeWidth: this.decodeW, resizeHeight: this.decodeH, resizeQuality: "high" });
        } catch {
          /* resize options unsupported: decode at full size */
        }
      }
      try {
        return await createImageBitmap(blob);
      } catch {
        /* fall back to an <img> */
      }
    }
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  private static release(d: Drawable | null) {
    if (d && "close" in d) d.close();
  }

  /* ---------- 1. preview sheets ---------- */
  async loadPreview() {
    const S = FILM.sheet;
    const per = S.cols * S.rows;
    const sheets = Math.ceil(N / per);
    const scale = touch ? 0.5 : 0.75; // kept decoded at reduced size: they are only a fallback
    let next = 0;
    const worker = async () => {
      while (next < sheets) {
        const n = next++;
        try {
          const blob = await (await fetch(this.base + S.path(n))).blob();
          let img: Drawable;
          let k = 1;
          try {
            const full = await createImageBitmap(blob);
            const w = Math.round(full.width * scale);
            const h = Math.round(full.height * scale);
            img = await createImageBitmap(full, { resizeWidth: w, resizeHeight: h, resizeQuality: "medium" });
            k = w / full.width;
            full.close();
          } catch {
            img = await this.decode(blob, false);
          }
          for (let j = 0; j < per; j++) {
            const i = n * per + j;
            if (i >= N) break;
            this.lo[i] = {
              img,
              x: ((j % S.cols) * (S.w + S.gutter) + S.gutter / 2) * k,
              y: (Math.floor(j / S.cols) * (S.h + S.gutter) + S.gutter / 2) * k,
              w: S.w * k,
              sharp: false,
              id: i,
            };
            this.loadedLo++;
          }
          this.onProgress?.(this.loadedLo, this.loadedSharp);
          this.lastKey = "";
        } catch {
          /* a missing sheet falls back to neighbouring frames */
        }
      }
    };
    await Promise.all(Array.from({ length: 2 }, worker));
  }

  /* ---------- 2. network ---------- */
  async loadSharp() {
    try {
      const r = await fetch(this.base + FILM.index);
      this.index = (await r.json()) as Index;
    } catch {
      return; // the preview keeps playing
    }
    this.tier = this.wantTier();
    this.prepareOffsets();
    this.sizeDecode();
    this.replan();
    this.pumpNet();
  }

  /** byte offset of every frame inside its pack */
  private prepareOffsets() {
    const ti = this.info();
    this.offsets = (ti?.packs ?? []).map((lens) => {
      const o = [0];
      lens.forEach((n) => o.push(o[o.length - 1] + n));
      return o;
    });
  }

  /** frames still to fetch, most needed first */
  private wanted(): { list: number[]; background: number } {
    const list: number[] = [];
    const seen = new Uint8Array(N);
    const now = performance.now();
    const push = (i: number) => {
      i = Math.round(i);
      if (i < 0 || i >= N || seen[i] || this.req[i] || this.retryAt[i] > now) return;
      seen[i] = 1;
      list.push(i);
    };
    const c = Math.max(0, Math.min(N - 1, Math.round(this.center)));
    push(c);
    const landing = (a: number, from: number) => {
      const dir = a >= from ? 1 : -1;
      for (const d of [0, -1, -2, 1, -3, -4]) push(a + dir * d);
    };
    if (this.dest !== null) landing(this.dest, c);
    const next = this.anchors.find((a) => a > c);
    const prev = [...this.anchors].reverse().find((a) => a < c);
    if (next !== undefined) landing(next, c);
    if (prev !== undefined) landing(prev, c);
    for (const i of this.plan) push(i);
    for (const a of this.anchors) landing(a, c);
    const background = list.length;
    for (let i = c; i < N; i++) push(i);
    for (let i = c - 1; i >= 0; i--) push(i);
    return { list, background };
  }

  private pumpNet() {
    const idx = this.index;
    const ti = this.info();
    if (!idx || !ti) return;
    const files = idx.layout === "files";
    const max = files ? 6 : 4;
    if (this.inflight >= max) return;
    const { list, background } = this.wanted();
    let n = 0;
    while (this.inflight < max && n < list.length) {
      const i = list[n];
      const bg = n >= background;
      n++;
      if (this.req[i]) continue;
      if (files) {
        this.req[i] = 1;
        this.track(this.fetchFile(i, this.gen), [i]);
        continue;
      }
      // packs: one byte range per request — a short run for urgent frames, the rest of the pack in the background
      const k = Math.floor(i / idx.per);
      const end = Math.min(N, (k + 1) * idx.per);
      let j = i + 1;
      const runMax = bg || this.noRange ? idx.per : 3;
      while (j < end && j - i < runMax && !this.req[j]) j++;
      const run: number[] = [];
      for (let f = i; f < j; f++) run.push(f);
      if (this.noRange) for (let f = k * idx.per; f < end; f++) if (!this.req[f] && !run.includes(f)) run.push(f);
      run.forEach((f) => (this.req[f] = 1));
      this.track(this.fetchRange(k, i - k * idx.per, j - k * idx.per, this.gen), run);
    }
  }

  private track(job: Promise<void>, frames: number[]) {
    const gen = this.gen;
    this.inflight++;
    job
      .catch(() => undefined)
      .finally(() => {
        if (gen !== this.gen) return; // a tier switch already reset everything
        this.inflight--;
        const later = performance.now() + 1500;
        let missed = false;
        frames.forEach((f) => {
          if (this.blobs[f]) return;
          this.req[f] = 0;
          this.retryAt[f] = later;
          missed = true;
        });
        this.pumpNet();
        if (missed) setTimeout(() => this.pumpNet(), 1600);
      });
  }

  private gotFrame(i: number, blob: Blob, gen: number) {
    if (gen !== this.gen) return;
    this.req[i] = 2;
    if (this.blobs[i]) return;
    this.blobs[i] = blob;
    this.loadedSharp++;
  }

  /** "files" layout: one frame */
  private async fetchFile(i: number, gen: number) {
    const res = await fetch(`${this.base}f/${this.tier}/${i}.webp`);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    this.gotFrame(i, blob, gen);
    this.onProgress?.(this.loadedLo, this.loadedSharp);
    this.pumpDecodes();
  }

  /** "packs" layout: frames j0..j1-1 of pack k by byte range (or the whole pack if the host ignores ranges) */
  private async fetchRange(k: number, j0: number, j1: number, gen: number) {
    const idx = this.index!;
    const off = this.offsets[k];
    const lens = this.info()!.packs[k];
    const whole = this.noRange || (j0 === 0 && j1 === lens.length);
    const res = await fetch(`${this.base}f/${this.tier}/${k}.bin`, whole ? undefined : { headers: { Range: `bytes=${off[j0]}-${off[j1] - 1}` } });
    if (!res.ok) throw new Error(String(res.status));
    const partial = res.status === 206;
    if (!partial && !whole) {
      // the host sent the whole pack: take all of it, and stop asking for ranges
      this.noRange = true;
      for (let f = 0; f < lens.length; f++) if (!this.req[k * idx.per + f]) this.req[k * idx.per + f] = 1;
    }
    const first = partial ? j0 : 0;
    const last = partial ? j1 : lens.length;
    const base = off[first];
    const total = off[last] - base;
    const buf = new Uint8Array(total);
    let got = 0;
    let j = first;
    const isWebp = (b: Uint8Array) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45;
    const handOver = () => {
      while (j < last && got >= off[j + 1] - base) {
        const bytes = buf.subarray(off[j] - base, off[j + 1] - base);
        if (!isWebp(bytes)) {
          this.noRange = true; // the host changed the bytes (compression?): fall back to whole packs
          throw new Error("bad frame");
        }
        this.gotFrame(k * idx.per + j, new Blob([bytes], { type: "image/webp" }), gen);
        j++;
      }
      this.onProgress?.(this.loadedLo, this.loadedSharp);
      this.pumpDecodes();
    };
    if (res.body && "getReader" in res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (gen !== this.gen) return void reader.cancel();
        if (got + value.length > total) throw new Error("unexpected length");
        buf.set(value, got);
        got += value.length;
        handOver();
      }
    } else {
      const all = new Uint8Array(await res.arrayBuffer());
      if (all.length > total) throw new Error("unexpected length");
      buf.set(all);
      got = all.length;
    }
    handOver();
  }

  /* ---------- 3. decoding ---------- */
  /** decoded frames per second this device manages */
  private capacity() {
    return Math.max(8, Math.min(240, (DECODES_AT_ONCE * 1000) / this.moveMs()));
  }

  /** expected decode time while moving: measured, or a cautious guess until then */
  private moveMs() {
    return Math.max(this.decodeMs, this.decodeMsMove || this.decodeMs * 1.3);
  }

  private replan() {
    const c = Math.max(0, Math.min(N - 1, Math.round(this.center)));
    const max = this.maxDecoded;
    const list: number[] = [];
    const seen = new Set<number>();
    const push = (i: number) => {
      if (i < 0 || i >= N || seen.has(i) || list.length >= max) return;
      seen.add(i);
      list.push(i);
    };
    const range = (a: number, b: number, step = 1) => {
      const dir = b >= a ? 1 : -1;
      for (let i = a; (b - i) * dir >= 0 && list.length < max; i += dir * step) push(i);
    };
    push(c);
    if (this.dest !== null) {
      const d = Math.max(0, Math.min(N - 1, Math.round(this.dest)));
      const dir = d >= c ? 1 : -1;
      // every `stride`-th frame (set once per move, in focus) — aligned so the landing frame is included —
      // starting far enough ahead that the decode finishes before the camera gets there
      const s = this.stride;
      const lead = Math.ceil((this.moveMs() / 1000) * this.speed * 1.1) + 1;
      const ahead: number[] = [];
      for (let j = d; (j - c) * dir > 0; j -= dir * s) if ((j - c) * dir >= lead || Math.abs(j - d) <= 4) ahead.push(j);
      ahead.reverse(); // nearest first
      ahead.slice(0, 4).forEach(push);
      range(d, d - dir * 4); // the camera slows into the stop: full rate at the end
      ahead.forEach(push);
      range(d, d + dir * 3);
      range(c - dir, c - dir * 6); // a little behind, for a quick change of mind
    } else {
      // resting: the next and previous stops' landing frames, then the way to each (two ahead for each one behind)
      const next = this.anchors.find((a) => a > c) ?? N - 1;
      const prev = [...this.anchors].reverse().find((a) => a < c) ?? 0;
      range(next, next - 2);
      range(prev, prev + 2);
      let f = c + 1;
      let b = c - 1;
      while (list.length < max && (f <= next || b >= prev)) {
        if (f <= next) push(f++);
        if (f <= next) push(f++);
        if (b >= prev) push(b--);
      }
    }
    this.plan = list;
    this.planSet = seen;
    // the frames just ahead are left out of the plan when it's too late to decode them,
    // but if they are already decoded they must stay: the camera is about to show them
    const keep = new Set(seen);
    const dir = this.dest === null ? 0 : Math.sign(this.dest - c);
    const ahead = dir === 0 ? 3 : Math.ceil((this.moveMs() / 1000) * this.speed * 1.1) + this.stride + 3;
    for (let k = -6; k <= ahead; k++) {
      const i = c + (dir || 1) * k;
      if (i >= 0 && i < N) keep.add(i);
    }
    if (dir === 0) for (let k = 1; k <= 6; k++) if (c - k >= 0) keep.add(c - k);
    this.keepSet = keep;
  }

  /** make room: drop decoded frames outside the plan, farthest from the visitor first */
  private evict(need: number) {
    if (this.decodedCount + need <= this.maxDecoded) return true;
    const c = this.center;
    const out: number[] = [];
    for (let i = 0; i < N; i++) if (this.bmps[i] && !this.keepSet.has(i)) out.push(i);
    out.sort((a, b) => Math.abs(b - c) - Math.abs(a - c));
    for (const i of out) {
      if (this.decodedCount + need <= this.maxDecoded) break;
      if (i === this.lastSrc) continue;
      FilmPlayer.release(this.bmps[i]);
      this.bmps[i] = null;
      this.decodedCount--;
    }
    return this.decodedCount + need <= this.maxDecoded;
  }

  private pumpDecodes() {
    const dir = this.dest === null ? 0 : Math.sign(this.dest - this.center);
    for (const i of this.plan) {
      if (this.decoding.size >= DECODES_AT_ONCE) return;
      if (this.bmps[i] || !this.blobs[i] || this.decoding.has(i)) continue;
      if (dir !== 0 && (i - this.center) * dir < 0 && Math.abs(i - this.center) > 6) continue; // already passed
      if (!this.evict(this.decoding.size + 1)) return;
      const gen = this.gen;
      const t0 = performance.now();
      this.decoding.add(i);
      this.decode(this.blobs[i]!, true)
        .then((bmp) => {
          if (gen !== this.gen || this.bmps[i]) return FilmPlayer.release(bmp);
          const ms = performance.now() - t0;
          // (timings taken while the preview sheets still load are skewed by that work, so they are left out)
          if (this.loadedLo >= N) {
            if (this.dest !== null) this.decodeMsMove = this.decodeMsMove ? this.decodeMsMove * 0.8 + ms * 0.2 : ms;
            else this.decodeMs = this.decodeMs * 0.8 + ms * 0.2;
          }
          this.bmps[i] = bmp;
          this.decodedCount++;
          if (Math.abs(i - this.center) <= this.stride + 3) this.lastKey = "";
        })
        .catch(() => undefined)
        .finally(() => {
          if (gen !== this.gen) return;
          this.decoding.delete(i);
          this.pumpDecodes();
        });
    }
  }

  /** numbers for testing (?debug) */
  stats() {
    let blobs = 0;
    this.blobs.forEach((b) => b && blobs++);
    return { tier: this.tier, blobs, decoded: this.decodedCount, max: this.maxDecoded, decoding: this.decoding.size, stride: this.stride, capacity: Math.round(this.capacity()), decodeMs: Math.round(this.decodeMs), decodeMsMove: Math.round(this.decodeMsMove), plan: this.plan.length, planDecoded: this.plan.filter((i) => this.bmps[i]).length, speed: this.speed };
  }

  /** the visitor is at `frame`; `dest` is where the camera is heading (null when resting), at `speed` frames/s */
  focus(frame: number, dest: number | null = null, speed = 0) {
    const c = Math.round(frame);
    const d = dest === null ? null : Math.round(dest);
    const sp = Math.round(speed / 10) * 10;
    if (c === Math.round(this.center) && d === this.dest && sp === this.speed) return;
    if (d !== this.dest || sp !== this.speed) {
      // a new move: decode only every `stride`-th frame when the camera is faster than this device decodes
      this.stride = d === null ? 1 : Math.max(1, Math.min(8, Math.ceil((sp * 1.15) / this.capacity())));
    }
    this.center = c;
    this.dest = d;
    this.speed = sp;
    this.replan();
    this.pumpNet();
    this.pumpDecodes();
  }

  /* ---------- 4. drawing ---------- */
  private sharpAt(i: number): Src | null {
    const b = i >= 0 && i < N ? this.bmps[i] : null;
    if (!b) return null;
    const crop = this.info()?.crop;
    if (crop) {
      // a phone cut: the bitmap holds only part of the frame's width
      const fullW = this.info()!.w;
      const k = b.height / this.info()!.h; // bitmap px per tier px
      const unit = FILM.width / fullW; // film units per tier px
      return { img: b, x: -crop.x * k, y: 0, w: fullW * k, sharp: true, id: i, clip: [crop.x * unit, (crop.x + crop.w) * unit] };
    }
    return { img: b, x: 0, y: 0, w: b.width, sharp: true, id: i };
  }

  /**
   * which image to show for frame i.
   * dir = +1/-1 while the camera moves (the picture may only step that way), 0 when resting
   */
  private pick(i: number, dir: number): Src | null | "hold" {
    // already showing a sharp frame a little ahead of this one: keep it until the camera catches up
    if (dir !== 0 && this.lastSharp && this.lastSrc >= 0 && (i - this.lastSrc) * dir < 0 && Math.abs(i - this.lastSrc) <= this.stride + 2) return "hold";
    const own = this.sharpAt(i);
    if (own) return own;
    if (dir !== 0) {
      const reach = this.stride + 2;
      let best: Src | null = null;
      for (let d = 1; d <= reach && !best; d++) {
        for (const j of [i - dir * d, i + dir * d]) {
          if (this.lastSrc >= 0 && (j - this.lastSrc) * dir < 0) continue; // never back
          const s = this.sharpAt(j);
          if (s) {
            best = s;
            break;
          }
        }
      }
      if (best) return best;
      // nothing sharp close by: hold the last sharp frame briefly rather than blur
      if (this.lastSharp && Math.abs(i - this.lastSrc) <= reach * 2 + 2) return "hold";
    } else {
      for (let d = 1; d <= 3; d++) {
        const s = this.sharpAt(i - d) ?? this.sharpAt(i + d);
        if (s) return s;
      }
    }
    if (this.lo[i]) return this.lo[i];
    for (let d = 1; d < 30; d++) {
      for (const j of [i - d, i + d]) {
        if (j < 0 || j >= N) continue;
        const s = this.sharpAt(j) ?? this.lo[j];
        if (s) return s;
      }
    }
    return null;
  }

  /** draw frame `f`, covering the screen; `focal` keeps the subject in view on narrow screens; `dir` as in pick() */
  draw(f: number, focal: number, dir = 0) {
    const i = Math.max(0, Math.min(N - 1, Math.round(f)));
    if (this.canvas.dataset.want !== String(i)) this.canvas.dataset.want = String(i);
    const p = this.pick(i, dir);
    if (!p || p === "hold") return i;
    const key = `${p.id}|${p.sharp}|${focal.toFixed(3)}|${this.canvas.width}x${this.canvas.height}`;
    if (key === this.lastKey) return i;
    this.lastKey = key;
    const { width: cw, height: ch } = this.canvas;
    const s = Math.max(cw / FILM.width, ch / FILM.height);
    const vw = cw / s; // visible width in film units
    const vh = ch / s;
    let sx = Math.max(0, Math.min(FILM.width - vw, focal * FILM.width - vw / 2));
    if (p.clip) sx = Math.max(p.clip[0], Math.min(p.clip[1] - vw, sx));
    const sy = (FILM.height - vh) / 2;
    const k = p.w / FILM.width;
    // decoded at (or just under) screen size, so plain bilinear is enough and much cheaper
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = cw / (vw * k) < 0.9 ? "high" : "low";
    this.ctx.drawImage(p.img, p.x + sx * k, p.y + sy * k, vw * k, vh * k, 0, 0, cw, ch);
    this.lastSrc = p.id;
    this.lastSharp = p.sharp;
    this.canvas.dataset.frame = String(i);
    this.canvas.dataset.sharp = p.sharp ? "1" : "0";
    this.canvas.dataset.src = String(p.id);
    return i;
  }
}
