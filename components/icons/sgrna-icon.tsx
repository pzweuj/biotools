export function SgRNAIcon({ className }: { className?: string }) {
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
      {/* DNA双链 */}
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      {/* 剪刀切割标记 */}
      <circle cx="12" cy="9" r="2" />
      <path d="M10 9L8 7" />
      <path d="M14 9L16 7" />
      <path d="M8 7L6 5" />
      <path d="M16 7L18 5" />
      {/* 切割线 */}
      <line x1="12" y1="11" x2="12" y2="15" strokeDasharray="2 2" />
      {/* 底部DNA */}
      <path d="M3 18h18" />
    </svg>
  )
}
