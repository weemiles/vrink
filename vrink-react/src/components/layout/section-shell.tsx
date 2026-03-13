import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionShellProps = {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"section">;

export function SectionShell({
  className,
  children,
  ...props
}: SectionShellProps) {
  return (
    <section className={cn("section-shell", className)} {...props}>
      {children}
    </section>
  );
}
