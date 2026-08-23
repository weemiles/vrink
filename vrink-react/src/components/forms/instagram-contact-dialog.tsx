"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type InstagramContactDialogProps = {
  children: ReactNode;
  enabled: boolean;
  locale: "ko" | "en";
};

function isInstagramIOSWebView() {
  const isIOS =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return isIOS && /Instagram/i.test(navigator.userAgent) && window.innerWidth <= 820;
}

function lockBackgroundScroll() {
  const bodyStyle = document.body.style;
  const rootStyle = document.documentElement.style;
  const contactSection = document.getElementById("contact");
  const scrollY =
    window.location.hash === "#contact" && contactSection
      ? Math.round(contactSection.getBoundingClientRect().top + window.scrollY)
      : window.scrollY;
  const previous = {
    bodyPosition: bodyStyle.position,
    bodyTop: bodyStyle.top,
    bodyLeft: bodyStyle.left,
    bodyRight: bodyStyle.right,
    bodyWidth: bodyStyle.width,
    bodyOverflow: bodyStyle.overflow,
    rootOverscrollBehavior: rootStyle.overscrollBehavior,
    rootScrollBehavior: rootStyle.scrollBehavior,
  };

  bodyStyle.position = "fixed";
  bodyStyle.top = `-${scrollY}px`;
  bodyStyle.left = "0";
  bodyStyle.right = "0";
  bodyStyle.width = "100%";
  bodyStyle.overflow = "hidden";
  rootStyle.overscrollBehavior = "none";

  return () => {
    bodyStyle.position = previous.bodyPosition;
    bodyStyle.top = previous.bodyTop;
    bodyStyle.left = previous.bodyLeft;
    bodyStyle.right = previous.bodyRight;
    bodyStyle.width = previous.bodyWidth;
    bodyStyle.overflow = previous.bodyOverflow;
    rootStyle.overscrollBehavior = previous.rootOverscrollBehavior;
    rootStyle.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    window.requestAnimationFrame(() => {
      rootStyle.scrollBehavior = previous.rootScrollBehavior;
    });
  };
}

export function InstagramContactDialog({ children, enabled, locale }: InstagramContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isContactDialog, setIsContactDialog] = useState(false);

  useEffect(() => {
    const syncMode = () => {
      setIsContactDialog(enabled && isInstagramIOSWebView() && window.location.hash === "#contact");
    };

    syncMode();
    window.addEventListener("hashchange", syncMode);
    return () => window.removeEventListener("hashchange", syncMode);
  }, [enabled]);

  useEffect(() => {
    if (!isContactDialog) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const viewport = window.visualViewport;
    const syncViewport = () => {
      dialog.style.setProperty("--contact-dialog-height", `${viewport?.height ?? window.innerHeight}px`);
      dialog.style.setProperty("--contact-dialog-top", `${viewport?.offsetTop ?? 0}px`);
    };

    syncViewport();
    if (!dialog.open) dialog.showModal();
    const unlockBackgroundScroll = lockBackgroundScroll();
    viewport?.addEventListener("resize", syncViewport, { passive: true });
    viewport?.addEventListener("scroll", syncViewport, { passive: true });

    return () => {
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);
      if (dialog.open) dialog.close();
      unlockBackgroundScroll();
    };
  }, [isContactDialog]);

  function dismissDialog() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    setIsContactDialog(false);
  }

  if (!isContactDialog) return children;

  const title = locale === "en" ? "Contact VRINK" : "도입 문의";
  const closeLabel = locale === "en" ? "Close contact form" : "도입 문의 닫기";

  return (
    <dialog
      ref={dialogRef}
      data-instagram-contact
      aria-labelledby="instagram-contact-title"
      className="fixed left-0 top-0 z-[1000] m-0 h-[var(--contact-dialog-height,100dvh)] max-h-none w-full max-w-none scroll-pb-24 overflow-y-auto overscroll-contain border-0 bg-[var(--surface-background)] p-0 backdrop:bg-black/20"
      style={{ transform: "translate3d(0, var(--contact-dialog-top, 0px), 0)" }}
      onCancel={(event) => {
        event.preventDefault();
        dismissDialog();
      }}
    >
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-white px-4 pt-[env(safe-area-inset-top)]">
        <h2 id="instagram-contact-title" className="text-body-1 font-medium text-[var(--brand-ink)]">
          {title}
        </h2>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-[var(--radius-sm)] text-[var(--brand-ink)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/40"
          aria-label={closeLabel}
          onClick={dismissDialog}
          autoFocus
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
      </header>
      <div className="mx-auto w-full max-w-[680px] p-4 pb-[max(32px,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </dialog>
  );
}
