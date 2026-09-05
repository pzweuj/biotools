import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ToolPageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
}

/**
 * Shared surface for tool pages. The page itself is intentionally transparent:
 * hierarchy comes from typography, spacing and rules rather than a wrapping card.
 */
export function ToolPage({ title, description, children, className, ...props }: ToolPageProps) {
  return (
    <section className={cn("tool-page w-full", className)} {...props}>
      {title !== undefined && (
        <ToolPageHeader>
          <ToolPageTitle>{title}</ToolPageTitle>
          {description !== undefined && <ToolPageDescription>{description}</ToolPageDescription>}
        </ToolPageHeader>
      )}
      {children}
    </section>
  )
}

export function ToolPageHeader({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn(
        "tool-page-header mb-8 flex flex-col gap-2 border-b border-border pb-6",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  )
}

export function ToolPageTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "flex items-center gap-2 font-display text-3xl font-medium leading-tight tracking-[-0.02em] text-foreground sm:text-4xl",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function ToolPageDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function ToolPageContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("tool-page-content space-y-8", className)} {...props}>
      {children}
    </div>
  )
}

interface ToolSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode
  description?: ReactNode
}

/** A lightweight section for a meaningful group inside a tool page. */
export function ToolSection({ title, description, className, children, ...props }: ToolSectionProps) {
  return (
    <section className={cn("tool-section space-y-4", className)} {...props}>
      {(title !== undefined || description !== undefined) && (
        <header className="space-y-1 border-b border-border/70 pb-3">
          {title !== undefined && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
          {description !== undefined && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
