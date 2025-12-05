/**
 * Enhanced Alert Component with Success, Warning, and Info variants
 *
 * Extends the base Alert component with additional semantic color variants
 * optimized for both light and dark modes.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-success/50 bg-success/10 text-success-foreground dark:border-success dark:bg-success/20 [&>svg]:text-success",
        warning:
          "border-warning/50 bg-warning/10 text-warning-foreground dark:border-warning dark:bg-warning/20 [&>svg]:text-warning",
        info:
          "border-info/50 bg-info/10 text-info-foreground dark:border-info dark:bg-info/20 [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const AlertEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
    showIcon?: boolean
  }
>(({ className, variant, showIcon = true, children, ...props }, ref) => {
  const Icon = React.useMemo(() => {
    switch (variant) {
      case 'success':
        return CheckCircle2
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      case 'destructive':
        return AlertCircle
      default:
        return null
    }
  }, [variant])

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {showIcon && Icon && <Icon className="h-4 w-4" />}
      {children}
    </div>
  )
})
AlertEnhanced.displayName = "AlertEnhanced"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { AlertEnhanced, AlertTitle, AlertDescription, alertVariants }
