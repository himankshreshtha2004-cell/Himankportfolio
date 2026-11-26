import type { Editable } from '../data/types'
import { isPlaceholder } from '../data/types'

/* Renders editable content. Missing facts show as a clearly marked amber
   placeholder so nothing unverified reads like a finished claim. */
export function Field({ value, className = '' }: { value: Editable; className?: string }) {
  if (isPlaceholder(value)) {
    return (
      <span
        className={`rounded-md border border-dashed border-placeholder/50 bg-placeholder/[0.06] px-1.5 py-0.5 text-placeholder ${className}`}
        title="Placeholder — edit in src/data"
      >
        [{value.placeholder}]
      </span>
    )
  }
  return <span className={className}>{value}</span>
}
