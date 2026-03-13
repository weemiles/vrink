import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--ink)] shadow-[var(--shadow-inner)] outline-none transition focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring-soft)] placeholder:text-[var(--ink-subtle)]",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
