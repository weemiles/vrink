"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import styles from "./intro-offer-modal.module.css";

const STORAGE_KEY = "vrink-install-pass-promotion-hidden-until-20261231";
const CAMPAIGN_END_TIMESTAMP = new Date(2027, 0, 1).getTime();

function getHiddenUntilTimestamp() {
  const tomorrow = new Date();

  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime();
}

function shouldShowOffer() {
  if (Date.now() >= CAMPAIGN_END_TIMESTAMP) {
    return false;
  }

  try {
    const hiddenUntil = Number(window.localStorage.getItem(STORAGE_KEY));
    return !Number.isFinite(hiddenUntil) || hiddenUntil <= Date.now();
  } catch {
    return true;
  }
}

const subscribeToOfferStore = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getServerOfferSnapshot = () => false;

type Locale = "ko" | "en";

const copy = {
  ko: {
    closeLabel: "프로모션 닫기",
    eyebrow: "설치 프로모션",
    headlineLine1: "설치 지점마다",
    headlineLine2: "1,000잔 지원",
    offerTitle: "2026년 12월 31일까지 한정",
    offerBody: "프로모션 기간에 설치한 지점마다 브링크 음료 1,000잔을 지원합니다.",
    disclaimer: "* 다지점 계약 등 특수계약은 지원 조건이 달라질 수 있습니다.",
    primaryAction: "도입 상담받기",
    todayButton: "오늘 하루 다시 보지 않기",
  },
  en: {
    closeLabel: "Close promotion",
    eyebrow: "Setup promotion",
    headlineLine1: "1,000 drinks",
    headlineLine2: "per location",
    offerTitle: "Available through December 31, 2026",
    offerBody: "Each location installed during the promotion receives 1,000 VRINK drinks.",
    disclaimer: "* Benefit terms may vary for multi-location or other special contracts.",
    primaryAction: "Plan your setup",
    todayButton: "Don’t show again today",
  },
} as const satisfies Record<Locale, unknown>;

export function IntroOfferModal({ locale = "ko" }: { locale?: Locale } = {}) {
  const t = copy[locale];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canShowOffer = useSyncExternalStore(
    subscribeToOfferStore,
    shouldShowOffer,
    getServerOfferSnapshot,
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const isVisible = canShowOffer && !isDismissed;

  useEffect(() => {
    document.body.dataset.vrinkIntroOffer = isVisible ? "visible" : "hidden";
    if (isVisible) {
      document.body.dataset.vrinkIntroOfferSeen = "true";
    }
    window.dispatchEvent(new Event("vrink:intro-offer-visibility"));

    if (!isVisible) {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) {
        dialog.close();
      }
      document.body.dataset.vrinkIntroOffer = "hidden";
      window.dispatchEvent(new Event("vrink:intro-offer-visibility"));
    };
  }, [isVisible]);

  const hideForToday = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(getHiddenUntilTimestamp()));
    } catch {
      // Storage may be blocked; closing for this page view is still better than interrupting the visit.
    }

    setIsDismissed(true);
  };

  if (!isVisible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <dialog
      aria-describedby="intro-offer-description intro-offer-note"
      aria-labelledby="intro-offer-title"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        setIsDismissed(true);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") {
          return;
        }

        const focusableElements = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements.at(-1);

        if (event.shiftKey && document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement?.focus();
        }
      }}
      ref={dialogRef}
    >
      <div className={styles.darkPanel}>
        <button
          aria-label={t.closeLabel}
          className={styles.closeButton}
          onClick={() => setIsDismissed(true)}
          type="button"
        >
          <X aria-hidden="true" size={22} strokeWidth={2.4} />
        </button>
        <p className={styles.eyebrow}>{t.eyebrow}</p>
        <h2 id="intro-offer-title">
          <span>{t.headlineLine1}</span>
          <span>{t.headlineLine2}</span>
        </h2>
      </div>

      <div className={styles.lightPanel}>
        <div className={styles.offerCopy}>
          <h3>{t.offerTitle}</h3>
          <p id="intro-offer-description">{t.offerBody}</p>
          <small className={styles.disclaimer} id="intro-offer-note">
            {t.disclaimer}
          </small>
        </div>

        <Link
          className={styles.primaryAction}
          href={locale === "en" ? "/en#contact" : "/#contact"}
          onClick={() => setIsDismissed(true)}
        >
          {t.primaryAction}
        </Link>

        <button className={styles.todayButton} onClick={hideForToday} type="button">
          {t.todayButton}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
