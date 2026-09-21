import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
  {
    variants: {
      variant: {
        default: "border-primary/50 bg-primary/20 text-primary hover:bg-primary/30",
        secondary: "border-secondary/50 bg-secondary/20 text-secondary hover:bg-secondary/30",
        destructive: "border-destructive/50 bg-destructive/20 text-destructive hover:bg-destructive/30",
        outline: "text-foreground border-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
