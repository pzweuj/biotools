export function FusionDrawIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Two genomic tracks converging at a central fusion point. */}
      <path d="M4 5c3.25 0 4.25 3.5 8 7s4.75 7 8 7" />
      <path d="M20 5c-3.25 0-4.25 3.5-8 7s-4.75 7-8 7" />
      <circle cx="4" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
