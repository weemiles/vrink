import { siteConfig } from "@/config/site";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

const navItems = [
  { href: "#problem", label: "Problem" },
  { href: "#solution", label: "Solution" },
  { href: "#feature", label: "Feature" },
  { href: "#proof", label: "Proof" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-background)_88%,white)] backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between">
        <a href="#home" className="text-lg font-semibold tracking-tight">
          {siteConfig.name}
        </a>
        <nav className="hidden items-center gap-6 md:flex" aria-label="주요 섹션">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button asChild size="sm" className="h-10 px-4 text-sm">
          <a href="#lead-form">도입 상담</a>
        </Button>
      </Container>
    </header>
  );
}
