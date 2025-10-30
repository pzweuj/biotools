export function SequencingDepthIcon({ className }: { className?: string }) {
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
      {/* DNA双螺旋 */}
      <path d="M3 12c0-3 1.5-5 3-6 1.5-1 3-1 4.5 0S13 8 13 12s-1.5 5-3 6c-1.5 1-3 1-4.5 0S3 15 3 12z" />
      <path d="M11 12c0-3 1.5-5 3-6 1.5-1 3-1 4.5 0S21 8 21 12s-1.5 5-3 6c-1.5 1-3 1-4.5 0S11 15 11 12z" />
      {/* 深度标记线 */}
      <line x1="7" y1="8" x2="17" y2="8" strokeDasharray="2 2" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="17" y2="16" strokeDasharray="2 2" />
    </svg>
  )
}
