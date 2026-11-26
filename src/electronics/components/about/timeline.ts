import type { PartId, StageKey } from '../../data/about'

/* The About sequence, in seconds — the same timing as the motion study.
   0–3   type and panel entrance
   3–8   SENSE → DECIDE → RESPOND signal flow
   8–12  inspect tour (tooltips)
   12–15 settles, inviting the scroll into the profile */
export const T = {
  END: 15.3,
  /** the clock waits here until the panel itself is in view (phones) */
  GATE: 3.15,
  eyebrow: [0.15, 1.05],
  line: (i: number) => [0.48 + i * 0.25, 1.45 + i * 0.28] as const,
  lead: [1.72, 2.45],
  note: [2.05, 2.8],
  panel: [1.4, 2.72],
  principles: [2.1, 3.2],
  sense: [3.2, 4.65],
  decide: [4.8, 5.85],
  actA: [6.1, 6.95],
  actB: [6.85, 7.55],
  progress: 15.2,
  invite: 12.05,
} as const

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
/** smoothstep between a and b */
export const smooth = (a: number, b: number, t: number) => {
  const q = clamp((t - a) / (b - a))
  return q * q * (3 - 2 * q)
}
export const win = (r: readonly [number, number] | readonly number[], t: number) => smooth(r[0], r[1], t)

export type Stage = 'pre' | StageKey | 'online'

export const stageAt = (t: number): Stage =>
  t < 3.15 ? 'pre' : t < 4.85 ? 'sense' : t < 6.15 ? 'decide' : t < 7.7 ? 'respond' : 'online'

/** which principle is lit while the flow plays */
export const stepAt = (t: number): StageKey | null =>
  t > 3.15 && t < 9.1 ? (t < 4.85 ? 'sense' : t < 6.2 ? 'decide' : 'respond') : null

/** the automatic inspect tour, 8–12 s */
export const tourAt = (t: number): PartId | null =>
  t >= 7.95 && t < 9.28 ? 'dht' : t >= 9.28 && t < 10.62 ? 'esp' : t >= 10.62 && t < 11.98 ? 'relay' : null
