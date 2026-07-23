"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./page.module.css";

type Locale = "ko" | "en";

type ExpertReviewMoreModalProps = {
  poster: string;
  src: string;
  locale?: Locale;
};

const copy = {
  dialogLabel: {
    ko: "영양사의 관점으로 본 브링크",
    en: "VRINK, seen through a dietitian's eyes",
  },
  moreButton: {
    ko: "영상 보기",
    en: "Watch video",
  },
} as const;

export function ExpertReviewMoreModal({ poster, src, locale = "ko" }: ExpertReviewMoreModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modal = isOpen ? (
    <div className={styles.expertVideoModalBackdrop} onClick={() => setIsOpen(false)} role="presentation">
      <section
        aria-label={copy.dialogLabel[locale]}
        aria-modal="true"
        className={styles.expertVideoModal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className={styles.expertVideoModalPlayer}>
          <video autoPlay controls playsInline poster={poster} preload="metadata">
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        aria-label={copy.moreButton[locale]}
        className={styles.expertReviewMoreButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {copy.moreButton[locale]}
      </button>
      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
