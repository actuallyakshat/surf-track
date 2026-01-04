import * as React from "react"

import { cn } from "~/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "plasmo-text-sm plasmo-font-medium plasmo-leading-none peer-disabled:plasmo-cursor-not-allowed peer-disabled:plasmo-opacity-70",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }
