import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const alertVariants = cva(
  "plasmo-relative plasmo-w-full plasmo-rounded-lg plasmo-border plasmo-p-4 [&>svg~*]:plasmo-pl-7 [&>svg+div]:plasmo-translate-y-[-3px] [&>svg]:plasmo-absolute [&>svg]:plasmo-left-4 [&>svg]:plasmo-top-4 [&>svg]:plasmo-text-foreground",
  {
    variants: {
      variant: {
        default: "plasmo-bg-background plasmo-text-foreground",
        destructive:
          "plasmo-border-destructive/50 plasmo-text-destructive dark:plasmo-border-destructive [&>svg]:plasmo-text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("plasmo-mb-1 plasmo-font-medium plasmo-leading-none plasmo-tracking-tight", className)}
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
    className={cn("plasmo-text-sm [&_p]:plasmo-leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
