import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)]",
        subtle: "border-transparent bg-[var(--surface-3)] text-[var(--ink-muted)]",
        warning: "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]",
        success: "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
