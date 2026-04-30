"use client";

import { useRef, useState, type PointerEvent } from "react";
import Image from "next/image";

import styles from "@/app/page.module.css";
import { withBasePath } from "@/lib/static-export";

export type UsageStep = {
  title: string;
  body: string;
  image: string;
  alt: string;
  mediaVariant?: "tablet";
  adImage?: string;
  adImageAlt?: string;
};

type UsageStepsViewerProps = {
  steps: UsageStep[];
};

export function UsageStepsViewer({ steps }: UsageStepsViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const activeStep = steps[activeIndex];
  const mediaClassName = [
    styles.usageMedia,
    activeStep.mediaVariant === "tablet" ? styles.usageMediaScreen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const goToStep = (index: number) => {
    setActiveIndex((index + steps.length) % steps.length);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (pointerStartX.current === null) {
      return;
    }

    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(distance) < 36) {
      return;
    }

    goToStep(activeIndex + (distance < 0 ? 1 : -1));
  };

  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    pointerStartX.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={styles.usageLayout}>
      <div className={styles.usageSteps} aria-label="브링크 이용 단계">
        {steps.map((step, index) => (
          <button
            aria-current={activeIndex === index ? "step" : undefined}
            aria-label={`${index + 1}단계 보기: ${step.title}`}
            className={`${styles.usageStep} ${activeIndex === index ? styles.usageStepActive : ""}`}
            key={step.title}
            onClick={() => goToStep(index)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{`${index + 1}단계: ${step.title}`}</h3>
            <p>{step.body}</p>
          </button>
        ))}
      </div>

      <div className={styles.usageMediaStage}>
        <figure
          aria-live="polite"
          className={mediaClassName}
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {activeStep.mediaVariant === "tablet" ? (
            <div className={styles.usageTabletMockup} key={activeStep.image}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.usageTabletFrame}
                fill
                sizes="(max-width: 980px) 58vw, 28vw"
                src={withBasePath("/images/vrink/usage/tablet-vertical.svg")}
              />
              <div className={styles.usageTabletScreen}>
                <Image
                  alt={activeStep.alt}
                  className={styles.usageTabletScreenImage}
                  fill
                  sizes="(max-width: 980px) 58vw, 28vw"
                  src={withBasePath(activeStep.image)}
                />
                {activeStep.adImage ? (
                  <div className={styles.usageTabletAdSlot}>
                    <Image
                      alt={activeStep.adImageAlt ?? ""}
                      fill
                      sizes="(max-width: 980px) 46vw, 22vw"
                      src={withBasePath(activeStep.adImage)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <Image
              alt={activeStep.alt}
              fill
              key={activeStep.image}
              sizes="(max-width: 980px) 100vw, 52vw"
              src={withBasePath(activeStep.image)}
            />
          )}
        </figure>
      </div>
    </div>
  );
}
