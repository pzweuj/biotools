export function TransVarIcon({ className }: { className?: string }) {
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
      {/* DNA double helix representation */}
      <path d="M4 4 C8 8, 16 8, 20 4" />
      <path d="M4 12 C8 8, 16 8, 20 12" />
      <path d="M4 20 C8 16, 16 16, 20 20" />
      <path d="M4 12 C8 16, 16 16, 20 12" />

      {/* Base pairs (rungs) */}
      <line x1="7" y1="6" x2="7" y2="10" />
      <line x1="12" y1="5" x2="12" y2="11" />
      <line x1="17" y1="6" x2="17" y2="10" />
      <line x1="7" y1="14" x2="7" y2="18" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="17" y1="14" x2="17" y2="18" />

      {/* Arrow indicating transformation */}
      <path d="M22 10 L24 12 L22 14" strokeWidth="1.5" fill="none" />
    </svg>
  )
}