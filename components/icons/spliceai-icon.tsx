export function SpliceAIIcon({ className }: { className?: string }) {
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
      {/* Gene/exon representation */}
      <rect x="2" y="8" width="5" height="8" rx="1" />
      <rect x="8" y="6" width="8" height="10" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="17" y="8" width="5" height="8" rx="1" />
      {/* Splice site connections */}
      <path d="M7 8 L7 6 L17 6 L17 8" strokeDasharray="2 2" />
      <path d="M7 16 L7 18 L17 18 L17 16" strokeDasharray="2 2" />
      {/* Arrows for splicing */}
      <path d="M7 6 L10 4" />
      <path d="M14 4 L17 6" />
      <path d="M7 18 L10 20" />
      <path d="M14 20 L17 18" />
      {/* AI indicator */}
      <circle cx="20" cy="4" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}