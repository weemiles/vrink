import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm leading-6 text-[var(--ink)] shadow-[var(--shadow-inner)] outline-none transition focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring-soft)] placeholder:text-[var(--ink-subtle)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
