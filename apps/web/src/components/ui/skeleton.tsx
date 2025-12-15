import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Skeleton component for loading states
 * Uses GPU-accelerated animation for smooth performance
 */
const Skeleton = React.memo(function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted transform-gpu",
        className
      )}
      aria-hidden="true"
      role="presentation"
      {...props}
    />
  )
})

export { Skeleton }
