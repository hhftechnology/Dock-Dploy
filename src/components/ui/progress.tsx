import * as React from "react"
import { cn } from "../../lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "error"
}

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
}

const variantStyles = {
  default: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showLabel = false, size = "md", variant = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div className="w-full">
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-secondary",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out",
              variantStyles[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }
