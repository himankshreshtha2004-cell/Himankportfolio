import { motion, useReducedMotion } from 'motion/react'

/* Fixed blueprint grid behind every page. `dim` darkens it when the
   archive is open so the files read as the focus. */
export function Backdrop({ dim = false }: { dim?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <motion.div
        className="grid-field absolute inset-0"
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="vignette absolute inset-0" />
      <div className="noise absolute inset-0" />
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={false}
        animate={{ opacity: dim ? 0.5 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
