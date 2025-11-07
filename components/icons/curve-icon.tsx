export function CurveIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <line x1="3" y1="20" x2="21" y2="20" />
      <line x1="3" y1="20" x2="3" y2="4" />
      {/* 曲线 */}
      <path d="M 3 18 Q 8 12 12 10 T 21 6" fill="none" strokeWidth="2" />
      {/* 数据点 */}
      <circle cx="6" cy="16" r="1.5" fill="currentColor" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="8" r="1.5" fill="currentColor" />
      <circle cx="18" cy="7" r="1.5" fill="currentColor" />
    </svg>
  )
}
