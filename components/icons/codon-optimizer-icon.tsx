export function CodonOptimizerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* DNA链 */}
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      {/* 优化标记 */}
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="16" cy="18" r="1.5" fill="currentColor" />
      {/* 趋势箭头 */}
      <path d="M18 8l2-2 2 2" />
      <path d="M20 6v6" />
    </svg>
  )
}
