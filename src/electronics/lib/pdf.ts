import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'

/* pdf.js is loaded only when a report is first shown, so the home page
   never pays for it. Documents are cached by URL. */
type PdfLib = typeof import('pdfjs-dist')
let libPromise: Promise<PdfLib> | null = null
const docs = new Map<string, Promise<PDFDocumentProxy>>()

function getLib() {
  if (!libPromise) {
    libPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default
      return lib
    })
  }
  return libPromise
}

export function loadPdf(url: string) {
  let p = docs.get(url)
  if (!p) {
    p = getLib().then((lib) => lib.getDocument({ url, isEvalSupported: false }).promise)
    p.catch(() => docs.delete(url))
    docs.set(url, p)
  }
  return p
}

/* Render one page into a canvas at a given CSS width (or zoom), sharp on
   high-density screens. Returns the task so callers can cancel it. */
export async function renderPage(
  doc: PDFDocumentProxy,
  pageNo: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
): Promise<{ task: RenderTask; height: number }> {
  const page = await doc.getPage(pageNo)
  const base = page.getViewport({ scale: 1 })
  const scale = cssWidth / base.width
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
  const vp = page.getViewport({ scale: scale * dpr })
  canvas.width = Math.floor(vp.width)
  canvas.height = Math.floor(vp.height)
  canvas.style.width = `${Math.floor(vp.width / dpr)}px`
  canvas.style.height = `${Math.floor(vp.height / dpr)}px`
  const ctx = canvas.getContext('2d')!
  const task = page.render({ canvasContext: ctx, viewport: vp })
  return { task, height: vp.height / dpr }
}
