export function SerialDilutionIcon(props: React.SVGProps<SVGSVGElement>) {
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
      {/* 试管 */}
      <path d="M8 3v13a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V3" />
      <path d="M8 3h8" />
      {/* 液体水平线 */}
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      {/* 箭头表示稀释 */}
      <path d="M18 8l3 2-3 2" />
    </svg>
  )
}
