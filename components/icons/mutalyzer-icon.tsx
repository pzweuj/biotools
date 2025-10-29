export function MutalyzerIcon({ className }: { className?: string }) {
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
      {/* DNA helix representation */}
      <path d="M4 6 Q8 4 12 6 T20 6" />
      <path d="M4 12 Q8 10 12 12 T20 12" />
      <path d="M4 18 Q8 16 12 18 T20 18" />
      {/* Connecting lines */}
      <line x1="6" y1="6" x2="6" y2="18" strokeWidth="1" />
      <line x1="12" y1="6" x2="12" y2="18" strokeWidth="1" />
      <line x1="18" y1="6" x2="18" y2="18" strokeWidth="1" />
      {/* Mutation marker */}
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
      <text x="10.5" y="13.5" fontSize="4" fontWeight="bold" fill="currentColor" stroke="none">M</text>
    </svg>
  )
}
