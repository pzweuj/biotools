export function WarfarinIcon({ className }: { className?: string }) {
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
      {/* Pill/capsule shape representing medication */}
      <ellipse cx="12" cy="12" rx="8" ry="10" />
      <path d="M4 12h16" />
      {/* DNA helix representing pharmacogenomics */}
      <path d="M8 8c1-1 3-1 4 0s3 1 4 0" />
      <path d="M8 16c1 1 3 1 4 0s3-1 4 0" />
      {/* Calculator/dosage symbol */}
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  )
}
