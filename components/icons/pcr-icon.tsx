export function PcrIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* PCR试管 */}
      <rect x="4" y="2" width="4" height="20" rx="1" />
      <rect x="10" y="2" width="4" height="20" rx="1" />
      <rect x="16" y="2" width="4" height="20" rx="1" />
      {/* 液体水平线 */}
      <line x1="4" y1="18" x2="8" y2="18" />
      <line x1="10" y1="15" x2="14" y2="15" />
      <line x1="16" y1="12" x2="20" y2="12" />
    </svg>
  )
}
