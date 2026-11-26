/* HS monogram: two strokes that share one vertical, cut on a 45° bevel. */
export function Monogram({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="#111316" stroke="rgba(255,255,255,0.12)" />
      <path d="M8.5 9v14M8.5 16h7M15.5 9v14" stroke="#C4C6C8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M24 11.2c-.7-1.4-1.9-2.2-3.4-2.2-2 0-3.3 1.1-3.3 2.8 0 3.9 6.9 2.4 6.9 6.6 0 1.9-1.5 3.1-3.6 3.1-1.7 0-3.1-.8-3.8-2.3" stroke="#E8E8E6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
