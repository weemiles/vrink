"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/consent";

export function CookieSettingsButton({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      {children}
    </button>
  );
}
