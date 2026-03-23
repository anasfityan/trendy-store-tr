import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "text-[var(--navy)] bg-[var(--navy)]/15",
        secondary: "bg-[var(--surface-2)] text-[var(--ink)]",
        destructive: "text-[var(--danger)] bg-[var(--danger)]/15",
        outline: "border border-[var(--border)] bg-transparent text-[var(--ink)]",
        success: "text-[var(--success)] bg-[var(--success)]/15",
        warning: "text-[var(--warning)] bg-[var(--warning)]/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
