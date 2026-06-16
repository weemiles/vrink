"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import styles from "./intro-offer-modal.module.css";

const STORAGE_KEY = "vrink-intro-offer-hidden-until";

function getTomorrowStartTimestamp() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function shouldShowOffer() {
  try {
    const hiddenUntil = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isNaN(hiddenUntil) || hiddenUntil <= Date.now();
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

export function IntroOfferModal() {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
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

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDismissed(true);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      document.body.dataset.vrinkIntroOffer = "hidden";
      window.dispatchEvent(new Event("vrink:intro-offer-visibility"));
    };
  }, [isVisible]);

  const hideForToday = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(getTomorrowStartTimestamp()));
    } catch {
      // Storage may be blocked; closing for this page view is still better than interrupting the visit.
    }

    setIsDismissed(true);
  };

  if (!isVisible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <section
        aria-labelledby="intro-offer-title"
        aria-modal="true"
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={styles.darkPanel}>
          <button
            aria-label="프로모션 닫기"
            className={styles.closeButton}
            onClick={() => setIsDismissed(true)}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={22} strokeWidth={2.4} />
          </button>
          <p className={styles.eyebrow}>첫 도입 혜택</p>
          <h2 id="intro-offer-title">
            <span>원액 10팩</span>
            <span>무료 지원</span>
          </h2>
        </div>

        <div className={styles.lightPanel}>
          <div className={styles.offerCopy}>
            <h3>지금 도입하면 원액 10팩 무료</h3>
            <p>
              지금 브링크를 도입하시면 <strong>원액 10팩</strong>을 무료로 지원해 드려요.
            </p>
          </div>

          <Link className={styles.primaryAction} href="/#contact" onClick={() => setIsDismissed(true)}>
            자세히 알아보기
          </Link>

          <button className={styles.todayButton} onClick={hideForToday} type="button">
            오늘 하루 그만 보기
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
