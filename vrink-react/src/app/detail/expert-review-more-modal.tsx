"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./page.module.css";

type ExpertReviewMoreModalProps = {
  poster: string;
  src: string;
};

export function ExpertReviewMoreModal({ poster, src }: ExpertReviewMoreModalProps) {
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
        aria-label="영양사의 관점으로 본 브링크"
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
        aria-label="더 알아보기"
        className={styles.expertReviewMoreButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        더 알아보기
      </button>
      {modal && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
