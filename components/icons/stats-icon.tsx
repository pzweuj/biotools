export function StatsIcon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="M7 12l3-3 3 3 5-5" />
      <circle cx="7" cy="12" r="1" />
      <circle cx="10" cy="9" r="1" />
      <circle cx="13" cy="12" r="1" />
      <circle cx="18" cy="7" r="1" />
    </svg>
  )
}
