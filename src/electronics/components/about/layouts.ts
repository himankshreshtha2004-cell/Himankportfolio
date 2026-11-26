import type { PartId } from '../../data/about'

/* Two arrangements of the same circuit:
   wide — left-to-right signal flow, as in the motion study
   tall — top-to-bottom for narrow screens, so labels stay readable
   Wire paths end on the parts' header pins (see SIZE in LabParts). */

type Pt = readonly [number, number]
export type WireKey = 'senseA' | 'senseB' | 'actA' | 'actB'

export type LabLayout = {
  name: 'wide' | 'tall'
  w: number
  h: number
  label: number
  dim: number
  parts: Record<PartId, Pt>
  espLandscape: boolean
  pirHeader: 'left' | 'right'
  wires: Record<WireKey, string>
  /** solder vias that light when the wire reaches them: [x, y, fraction along the wire] */
  vias: Partial<Record<WireKey, readonly (readonly [number, number, number])[]>>
  halo: Pt
  /** tooltip anchor in diagram units; ax/ay align the tooltip box to it (0 = start, 1 = end) */
  tips: Record<PartId, { x: number; y: number; ax: number; ay: number }>
  cursor: Partial<Record<PartId, Pt>>
  /** compact: the figure number joins the scale note at the top (narrow screens) */
  text: { system: Pt; scale: Pt; foot: Pt; fig: Pt; compact: boolean }
  corners: string
}

export const WIDE: LabLayout = {
  name: 'wide',
  w: 680,
  h: 406,
  label: 12,
  dim: 9.5,
  parts: {
    dht: [69, 102],
    pir: [67, 264],
    esp: [282, 129],
    relay: [491, 183],
    device: [611, 213],
  },
  espLandscape: false,
  pirHeader: 'right',
  wires: {
    senseA: 'M159 144 H232 V189.5 H274',
    senseB: 'M159 307 H230 V255.5 H274',
    actA: 'M429 222.5 H491',
    actB: 'M578 235 H611',
  },
  vias: {
    senseA: [[232, 144, 0.45], [232, 189.5, 0.74]],
    senseB: [[230, 307, 0.43], [230, 255.5, 0.74]],
    actA: [[460, 222.5, 0.5]],
  },
  halo: [351.5, 222.5],
  tips: {
    dht: { x: 172, y: 26, ax: 0, ay: 0 },
    pir: { x: 170, y: 346, ax: 0, ay: 1 },
    esp: { x: 436, y: 122, ax: 0, ay: 1 },
    relay: { x: 586, y: 174, ax: 1, ay: 1 },
    device: { x: 660, y: 204, ax: 1, ay: 1 },
  },
  cursor: { dht: [126, 152], esp: [374, 252], relay: [538, 252] },
  text: { system: [24, 57], scale: [655, 57], foot: [24, 398], fig: [654, 398], compact: false },
  corners: 'M18 32 h16 M18 32 v16 M662 32 h-16 M662 32 v16 M18 374 h16 M18 374 v-16 M662 374 h-16 M662 374 v-16',
}

export const TALL: LabLayout = {
  name: 'tall',
  w: 360,
  h: 604,
  label: 12.5,
  dim: 10.5,
  parts: {
    dht: [40, 56],
    pir: [230, 58],
    esp: [86, 220], // drawn landscape: 187 × 139
    relay: [130, 420],
    device: [258, 450],
  },
  espLandscape: true,
  pirHeader: 'left',
  wires: {
    senseA: 'M130 98 H146.5 V212',
    senseB: 'M230 101 H212.5 V212',
    actA: 'M102.5 367 V459.5 H130',
    actB: 'M217 472 H258',
  },
  vias: {
    senseA: [[146.5, 98, 0.13], [146.5, 160, 0.6]],
    senseB: [[212.5, 101, 0.14], [212.5, 160, 0.59]],
    actA: [[102.5, 459.5, 0.77]],
  },
  halo: [179.5, 289.5],
  tips: {
    dht: { x: 26, y: 186, ax: 0, ay: 0 },
    pir: { x: 334, y: 186, ax: 1, ay: 0 },
    esp: { x: 180, y: 382, ax: 0.5, ay: 0 },
    relay: { x: 120, y: 410, ax: 0, ay: 1 },
    device: { x: 334, y: 440, ax: 1, ay: 1 },
  },
  cursor: { dht: [85, 100], esp: [180, 300], relay: [175, 476] },
  text: { system: [18, 30], scale: [342, 30], foot: [18, 594], fig: [342, 594], compact: true },
  corners: 'M12 40 h14 M12 40 v14 M348 40 h-14 M348 40 v14 M12 576 h14 M12 576 v-14 M348 576 h-14 M348 576 v-14',
}
