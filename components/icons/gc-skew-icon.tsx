export function GcSkewIcon(props: React.SVGProps<SVGSVGElement>) {
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
      {/* 坐标轴 */}
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="4" x2="3" y2="20" />
      {/* 波形曲线 */}
      <path d="M 3 12 L 6 8 L 9 6 L 12 8 L 15 14 L 18 16 L 21 14" fill="none" strokeWidth="2" />
      {/* 零线标记 */}
      <line x1="2" y1="12" x2="4" y2="12" strokeWidth="3" />
    </svg>
  )
}
