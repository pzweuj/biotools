import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-4xl font-bold text-foreground font-mono">404</h1>
        <h2 className="text-xl text-muted-foreground font-mono">
          Tool Not Found / 工具未找到
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          The tool you are looking for does not exist or has been removed.
          <br />
          您访问的工具不存在或已被移除
        </p>
        <Button asChild className="mt-4">
          <Link href="/" className="font-mono">
            Back to Home / 返回首页
          </Link>
        </Button>
      </div>
    </div>
  )
}
