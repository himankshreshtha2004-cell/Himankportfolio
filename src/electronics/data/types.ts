/* Content model. Every page reads from these shapes, so editing the data files
   in this folder updates the whole site — no component needs to change. */

/** Text that is still missing. Rendered with a visible "placeholder" style. */
export type Placeholder = { placeholder: string }
export type Editable = string | Placeholder

export const isPlaceholder = (v: Editable | undefined): v is Placeholder =>
  typeof v === 'object' && v !== null && 'placeholder' in v

export type LinkField = { label: string; href?: string; placeholder?: string; icon?: 'github' }

export type Spec = { label: string; value: Editable }

export type Part = { name: string; role: string; link?: string }

export type Step = { title: string; detail: string }

/** One stage of the system, shown beside the explainer video.
    `at` (seconds) is optional: highlighting by time only happens when it is set. */
export type Stage = { title: string; detail: string; at?: number }

export type DiagramNode = {
  id: string
  label: string
  sub?: string
  /** 0 = inputs, 1 = link/transport, 2 = core, 3 = outputs */
  col: 0 | 1 | 2 | 3
  /** dashed outline for optional or future parts */
  optional?: boolean
  /** vertical slot in its column (0 = top); defaults to its order. Lets a link
      node sit beside the input it serves so other wires pass below it. */
  row?: number
  /** core node lines (shown as a short list inside the box) */
  lines?: string[]
}
export type DiagramEdge = { from: string; to: string; label?: string; dashed?: boolean }

export type ResultTable = {
  title: string
  source: string
  columns: string[]
  rows: string[][]
}

export type VideoSource = {
  src?: string
  poster?: string
  captions?: string
  orientation: 'landscape' | 'portrait'
  /** Shown when `src` is empty */
  pendingNote?: string
}

export type Report = {
  title: string
  pdf: string
  original?: { label: string; href: string }
  pages: number
  format: string
  authors: string
  /** label shown before `authors` (defaults to "Author") */
  creditLabel?: string
  supervisor: string
  toc: { title: string; page: number }[]
}

export type Contributor = { name: string; role: Editable }

export type Project = {
  slug: string
  number: string
  fileId: string
  title: string
  shortTitle: string
  subtitle: string
  meta: Spec[]
  heroImage: string
  heroAlt: string
  overview: string[]
  problem: string[]
  objectives: string[]
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[]; caption: string; source: string }
  hardware: Part[]
  software: Part[]
  workflow: Step[]
  stages: Stage[]
  media: { explained: VideoSource; inAction: VideoSource }
  results: ResultTable[]
  limitations: string[]
  evidence: { documented: string[]; visible: string[]; unspecified: string[] }
  report: Report
  contributions: Editable[]
  attribution: {
    reportAuthor: string
    /** label for the first credit line (defaults to "Report author") */
    reportAuthorLabel?: string
    contributors: Contributor[]
    note: string
  }
}
