import type { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 p-8 text-center",
        "min-h-[400px]",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}
