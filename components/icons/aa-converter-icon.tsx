export function AaConverterIcon({ className }: { className?: string }) {
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
      <text x="3" y="10" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">Leu</text>
      <text x="15" y="10" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none">L</text>
      <path d="M12 8 L12 16" />
      <path d="M9 11 L12 8 L15 11" />
      <path d="M9 13 L12 16 L15 13" />
      <rect x="2" y="4" width="9" height="8" rx="1" />
      <rect x="13" y="4" width="9" height="8" rx="1" />
    </svg>
  )
}
