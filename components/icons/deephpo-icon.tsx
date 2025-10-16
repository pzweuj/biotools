export function DeepHpoIcon({ className }: { className?: string }) {
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
      {/* Medical/Clinical symbol - stethoscope-like shape */}
      <circle cx="12" cy="8" r="3" />
      <path d="M12 11v6" />
      <path d="M9 17h6" />
      {/* AI/Neural network nodes */}
      <circle cx="6" cy="14" r="1.5" />
      <circle cx="18" cy="14" r="1.5" />
      <path d="M7.5 14L10 15" />
      <path d="M16.5 14L14 15" />
      {/* HPO ontology tree structure */}
      <path d="M12 17v3" />
      <path d="M9 20h6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="15" cy="20" r="1" />
    </svg>
  )
}
