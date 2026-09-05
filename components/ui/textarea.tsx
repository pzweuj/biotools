import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md border-2 border-muted-foreground/30 bg-muted/20 px-3 py-2 text-base outline-none transition-[color,box-shadow,border-color,background-color] hover:border-muted-foreground/45 focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default md:text-sm',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
