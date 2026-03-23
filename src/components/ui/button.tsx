import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/20 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white hover:opacity-90",
        destructive: "bg-[var(--danger)] text-white hover:opacity-90",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--surface-secondary)]",
        secondary:
          "bg-[var(--default)] text-[var(--default-foreground)] hover:bg-[var(--surface-tertiary)]",
        ghost:
          "bg-transparent hover:bg-[var(--surface-secondary)] text-[var(--default-foreground)]",
        link: "text-[var(--accent)] underline underline-offset-4",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
