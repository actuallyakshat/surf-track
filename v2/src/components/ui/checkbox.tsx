import * as React from "react"

import { cn } from "~/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "plasmo-h-4 plasmo-w-4 plasmo-rounded plasmo-border plasmo-border-slate-300 plasmo-text-primary plasmo-focus:ring-2 plasmo-focus:ring-primary plasmo-focus:ring-offset-2 plasmo-cursor-pointer disabled:plasmo-cursor-not-allowed disabled:plasmo-opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
