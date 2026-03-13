"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-[var(--surface-1)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--ink)] px-4 py-2.5 text-white shadow-[var(--shadow-soft)] hover:bg-[var(--ink-strong)]",
        secondary:
          "bg-[var(--surface-2)] px-4 py-2.5 text-[var(--ink)] hover:bg-[var(--surface-3)]",
        ghost:
          "bg-transparent px-3 py-2 text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
        outline:
          "border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2.5 text-[var(--ink)] hover:bg-[var(--surface-2)]",
      },
      size: {
        sm: "h-9 rounded-xl px-3 text-xs",
        md: "h-11",
        lg: "h-12 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
