export function DnaIcon({ className }: { className?: string }) {
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
      <path d="M12 2C8 2 5 5 5 9s3 7 7 7 7-3 7-7-3-7-7-7z" />
      <path d="M12 16c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" />
      <path d="M5 9h14" />
      <path d="M5 16h14" />
    </svg>
  )
}
