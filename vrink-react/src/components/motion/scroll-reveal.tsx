"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

import styles from "./scroll-reveal.module.css";

type ScrollRevealProps = HTMLAttributes<HTMLDivElement> & {
  stagger?: boolean;
};

export function ScrollReveal({ children, className, stagger = false, ...props }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      element.dataset.revealState = "visible";
      return;
    }

    const bounds = element.getBoundingClientRect();
    const isAlreadyVisible = bounds.top <= window.innerHeight * 0.9;

    if (isAlreadyVisible) {
      element.dataset.revealState = "visible";
      return;
    }

    element.dataset.revealState = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        element.dataset.revealState = "visible";
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -14% 0px",
        threshold: 0.16,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...props}
      className={`${styles.reveal}${className ? ` ${className}` : ""}`}
      data-reveal-stagger={stagger || undefined}
      data-reveal-state="idle"
      ref={elementRef}
    >
      {children}
    </div>
  );
}
