"use client";

import { useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import styles from "@/app/page.module.css";
import { withBasePath } from "@/lib/static-export";

type UsageStep = {
  title: string;
  body: string;
  image: string;
  alt: string;
};

type UsageStepsViewerProps = {
  steps: UsageStep[];
};

export function UsageStepsViewer({ steps }: UsageStepsViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const activeStep = steps[activeIndex];

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
          className={styles.usageMedia}
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <Image
            alt={activeStep.alt}
            fill
            key={activeStep.image}
            sizes="(max-width: 980px) 100vw, 52vw"
            src={withBasePath(activeStep.image)}
          />

          <div
            aria-label="단계 이동"
            className={styles.usageControls}
            onPointerDown={(event) => event.stopPropagation()}
            role="group"
          >
            <button
              aria-label="이전 단계"
              className={styles.usageControlButton}
              onClick={() => goToStep(activeIndex - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.8} />
            </button>
            <div className={styles.usageDots}>
              {steps.map((step, index) => (
                <button
                  aria-label={`${index + 1}단계로 이동`}
                  className={`${styles.usageDot} ${activeIndex === index ? styles.usageDotActive : ""}`}
                  key={step.title}
                  onClick={() => goToStep(index)}
                  type="button"
                />
              ))}
            </div>
            <button
              aria-label="다음 단계"
              className={styles.usageControlButton}
              onClick={() => goToStep(activeIndex + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={20} strokeWidth={1.8} />
            </button>
          </div>
        </figure>
      </div>
    </div>
  );
}
