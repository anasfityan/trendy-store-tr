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

  return createPortal(
    <div className="fixed inset-0 z-50" dir="rtl">
      {/* Backdrop — scrollable when content is tall */}
      <div
        className={cn(
          "fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          closing ? "opacity-0" : "opacity-100"
        )}
        onClick={() => onOpenChange(false)}
      >
        <div className="min-h-full flex items-start justify-center py-8 px-4">
          <div
            className={cn(
              "relative w-full max-w-lg rounded-2xl bg-[var(--overlay)] text-[var(--foreground)] transition-all duration-200",
              closing
                ? "scale-95 opacity-0"
                : "scale-100 opacity-100"
            )}
            style={{ boxShadow: "var(--overlay-shadow)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button — top-left for RTL */}
            <button
              type="button"
              className="absolute top-4 left-4 rounded-xl p-1.5 text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-all duration-150 focus:outline-none"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 pt-6 pb-0", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold text-[var(--foreground)]",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-5", className)}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClose?: () => void;
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, onClose, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "rounded-xl p-1.5 text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-all duration-150 focus:outline-none",
        className
      )}
      onClick={onClose}
      aria-label="Close"
      {...props}
    >
      {children ?? <X className="h-4 w-4" />}
    </button>
  )
);
DialogClose.displayName = "DialogClose";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose };
