export function ManeLocaIcon({ className }: { className?: string }) {
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
      {/* DNA helix structure representing genomic coordinates */}
      <path d="M3 8c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5z" />
      <path d="M16 16c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5z" />
      <path d="M8 3v18" />
      <path d="M16 3v18" />
      {/* Connecting lines representing transcript mapping */}
      <path d="M8 8h8" />
      <path d="M8 16h8" />
      {/* Arrow indicating direction/position */}
      <path d="M12 12l-2-2" />
      <path d="M12 12l2-2" />
      <path d="M12 12l-2 2" />
      <path d="M12 12l2 2" />
    </svg>
  )
}
