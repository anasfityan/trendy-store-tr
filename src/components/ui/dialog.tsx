"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [visible, setVisible] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Need mounted check for portal
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = "hidden";
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        document.body.style.overflow = "";
      }, 200);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, visible]);

  React.useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [visible, onOpenChange]);

  if (!visible || !mounted) return null;

  // Portal to document.body so it escapes any overflow-hidden parent
  return createPortal(
    <div className="fixed inset-0 z-[100]" dir="rtl">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm",
          closing ? "dialog-overlay closing" : "dialog-overlay"
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* Scrollable content layer */}
      <div
        className={cn(
          "fixed inset-0 z-[101] overflow-y-auto",
          closing ? "dialog-content-animate closing" : "dialog-content-animate"
        )}
        onClick={() => onOpenChange(false)}
      >
        <div className="min-h-full flex items-start justify-center px-4 py-10">
          <div
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--surface-foreground)] p-6",
      className
    )}
    style={{ boxShadow: "var(--overlay-shadow)" }}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-start justify-between gap-4", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-[var(--foreground)] pt-0.5", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClose?: () => void;
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, onClose, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "shrink-0 rounded-xl p-1.5 text-[var(--muted)] hover:bg-[var(--surface-secondary)] transition-all duration-150 hover:text-[var(--foreground)] hover:scale-110 active:scale-95 focus:outline-none",
        className
      )}
      onClick={onClose}
      aria-label="إغلاق"
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
);
DialogClose.displayName = "DialogClose";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose };
