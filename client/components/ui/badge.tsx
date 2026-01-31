import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border-primary/30 [a&]:hover:bg-primary/30",
        secondary:
          "bg-white/10 text-foreground border-white/10 [a&]:hover:bg-white/15",
        destructive:
          "bg-destructive/20 text-red-400 border-destructive/30 [a&]:hover:bg-destructive/30",
        outline:
          "border-white/20 text-foreground bg-transparent [a&]:hover:bg-white/10",
        ghost: "border-transparent [a&]:hover:bg-white/10",
        link: "text-primary border-transparent underline-offset-4 [a&]:hover:underline",
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
