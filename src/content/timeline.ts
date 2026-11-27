/* ==========================================================================
   TIMELINE — where the film stops for each section.
   Frames refer to tower-film-v4 (430 frames, 24 fps, 17.9 s).
   `hold` = the frames played slowly while the section's content is shown
   (the camera's own slow-down, never a freeze). `dwell` = how much scrolling
   (in % of the screen height) the visitor spends there.
   ========================================================================== */

export const FILM = {
  frames: 430,
  /** drawing units (the frames themselves are 2560 or 1600 px wide; only the 16:9 shape matters) */
  width: 1920,
  height: 1080,
  /** sharp frames: packs of 24 WebP files back to back, f/<hi|mid>/<pack>.bin, byte lengths in this index */
  index: "f/index.json",
  /** preview frames (360 × 203) packed 8 × 8 per sheet, 4 px gutter: f/p/<sheet>.webp */
  sheet: { path: (n: number) => `f/p/${n}.webp`, cols: 8, rows: 8, w: 360, h: 202.5, gutter: 3 },
};

export type StopId =
  | "home" | "about" | "work" | "aifilm" | "games" | "uiux" | "electronics"
  | "experience" | "education" | "beyond" | "contact";

export type Stop = {
  id: StopId;
  n: string; // chapter number shown in the index
  label: string;
  parent?: StopId; // the four bays belong to My Work
  hold: [number, number];
  dwell: number; // vh
  /** where the film's subject sits horizontally on a phone (0 = left, 1 = right) */
  focal: number;
};

export const STOPS: Stop[] = [
  { id: "home", n: "01", label: "Home", hold: [0, 0], dwell: 70, focal: 0.5 },
  { id: "about", n: "02", label: "About", hold: [72, 80], dwell: 140, focal: 0.36 },
  { id: "work", n: "03", label: "My Work", hold: [125, 130], dwell: 90, focal: 0.5 },
  { id: "aifilm", n: "03", label: "AI Filmmaking", parent: "work", hold: [160, 166], dwell: 110, focal: 0.48 },
  { id: "games", n: "03", label: "Game Development", parent: "work", hold: [190, 194], dwell: 110, focal: 0.5 },
  { id: "uiux", n: "03", label: "UI/UX Design", parent: "work", hold: [211, 215], dwell: 110, focal: 0.5 },
  { id: "electronics", n: "03", label: "Electronics", parent: "work", hold: [232, 236], dwell: 110, focal: 0.5 },
  { id: "experience", n: "04", label: "Experience", hold: [293, 295], dwell: 170, focal: 0.5 },
  { id: "education", n: "05", label: "Education", hold: [349, 355], dwell: 130, focal: 0.5 },
  { id: "beyond", n: "06", label: "Beyond Work", hold: [388, 394], dwell: 150, focal: 0.34 },
  { id: "contact", n: "07", label: "Contact", hold: [427, 429], dwell: 100, focal: 0.42 },
];

/** scroll spent on the camera move between two stops: about 2.4 % of the screen per frame */
const moveLength = (frames: number) => Math.min(220, Math.max(50, frames * 2.4));

export type Segment =
  | { kind: "hold"; stop: number; start: number; end: number; f0: number; f1: number }
  | { kind: "move"; from: number; start: number; end: number; f0: number; f1: number };

/** Lays the stops and moves end to end. Units: vh. */
export function buildTimeline() {
  const segs: Segment[] = [];
  let y = 0;
  STOPS.forEach((s, i) => {
    segs.push({ kind: "hold", stop: i, start: y, end: y + s.dwell, f0: s.hold[0], f1: s.hold[1] });
    y += s.dwell;
    const next = STOPS[i + 1];
    if (next) {
      const len = moveLength(next.hold[0] - s.hold[1]);
      segs.push({ kind: "move", from: i, start: y, end: y + len, f0: s.hold[1], f1: next.hold[0] });
      y += len;
    }
  });
  return { segs, total: y };
}

/** where the film rests for a stop (vh): near the end of its hold, so the camera's own slow-down plays out first */
export const stopAnchor = (segs: Segment[], index: number) => {
  const h = segs.find((s) => s.kind === "hold" && s.stop === index)!;
  return index === 0 ? 0 : h.start + (h.end - h.start) * 0.85;
};
