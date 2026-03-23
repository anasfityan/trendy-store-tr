import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--r-md)] font-semibold transition-all duration-[120ms] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)]/20 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--navy)] text-white hover:shadow-lg",
        gradient:
          "text-white hover:shadow-lg [background:linear-gradient(135deg,var(--navy),var(--royal))]",
        destructive:
          "bg-[var(--danger)] text-white hover:opacity-90",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--ink)]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--ink)] hover:opacity-90",
        ghost:
          "bg-transparent hover:bg-[var(--surface-2)] text-[var(--ink)]",
        link: "text-[var(--navy)] underline underline-offset-4",
      },
      size: {
        default: "h-[42px] px-5 text-sm",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-12 px-6",
        icon: "h-[42px] w-[42px]",
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
