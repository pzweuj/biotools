export function TmbCalculatorIcon({ className }: { className?: string }) {
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
      {/* DNA helix strand */}
      <path d="M3 12c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" />
      <path d="M15 12c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" />
      <line x1="6" y1="10" x2="18" y2="10" />
      <line x1="6" y1="14" x2="18" y2="14" />
      
      {/* Mutation markers */}
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      
      {/* Calculator grid */}
      <rect x="10" y="2" width="10" height="6" rx="1" />
      <line x1="12" y1="4" x2="18" y2="4" />
      <line x1="12" y1="6" x2="18" y2="6" />
    </svg>
  );
}
