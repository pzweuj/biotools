// 引物坐标计算图标：一段序列骨架 + 两端刻度（坐标范围）+ 高亮引物结合区及其边缘标记
export function PrimerCoordinateIcon({ className }: { className?: string }) {
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
      {/* 序列骨架 */}
      <line x1="3" y1="12" x2="21" y2="12" />
      {/* 起始坐标刻度（低坐标端） */}
      <line x1="3" y1="8" x2="3" y2="16" />
      {/* 终止坐标刻度（高坐标端） */}
      <line x1="21" y1="8" x2="21" y2="16" />
      {/* 引物结合区 */}
      <rect x="8" y="9" width="8" height="6" rx="1" />
      {/* 引物起始/终止坐标标记 */}
      <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
