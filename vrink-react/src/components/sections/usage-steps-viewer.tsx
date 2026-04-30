"use client";

import { useRef, useState, type PointerEvent, type UIEvent } from "react";
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

type UsageStepMediaContentProps = {
  adSizes: string;
  imageSizes: string;
  step: UsageStep;
};

function getUsageMediaClassName(step: UsageStep, baseClassName: string) {
  return [baseClassName, step.mediaVariant === "tablet" ? styles.usageMediaScreen : ""].filter(Boolean).join(" ");
}

function UsageStepMediaContent({ adSizes, imageSizes, step }: UsageStepMediaContentProps) {
  if (step.mediaVariant === "tablet") {
    return (
      <div className={styles.usageTabletMockup} key={step.image}>
        <Image
          alt=""
          aria-hidden="true"
          className={styles.usageTabletFrame}
          fill
          loading="eager"
          sizes={imageSizes}
          src={withBasePath("/images/vrink/usage/tablet-vertical.svg")}
        />
        <div className={styles.usageTabletScreen}>
          <Image
            alt={step.alt}
            className={styles.usageTabletScreenImage}
            fill
            loading="eager"
            sizes={imageSizes}
            src={withBasePath(step.image)}
          />
          {step.adImage ? (
            <div className={styles.usageTabletAdSlot}>
              <Image
                alt={step.adImageAlt ?? ""}
                fill
                loading="eager"
                sizes={adSizes}
                src={withBasePath(step.adImage)}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Image
      alt={step.alt}
      fill
      key={step.image}
      loading="eager"
      sizes={imageSizes}
      src={withBasePath(step.image)}
    />
  );
}

export function UsageStepsViewer({ steps }: UsageStepsViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);
  const mobileSlideRefs = useRef<Array<HTMLElement | null>>([]);
  const pointerStartX = useRef<number | null>(null);
  const activeStep = steps[activeIndex];
  const mediaClassName = getUsageMediaClassName(activeStep, styles.usageMedia);

  const goToStep = (index: number) => {
    setActiveIndex((index + steps.length) % steps.length);
  };

  const goToMobileStep = (index: number) => {
    goToStep(index);
    mobileSlideRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleMobileScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    mobileSlideRefs.current.forEach((slide, index) => {
      if (!slide) {
        return;
      }

      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - containerCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== activeIndex) {
      setActiveIndex(nearestIndex);
    }
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
          <UsageStepMediaContent
            adSizes="(max-width: 980px) 46vw, 22vw"
            imageSizes="(max-width: 980px) 58vw, 28vw"
            step={activeStep}
          />
        </figure>
      </div>

      <div
        className={styles.usageMobileCarousel}
        aria-label="브링크 이용 단계"
        onScroll={handleMobileScroll}
        ref={mobileCarouselRef}
      >
        {steps.map((step, index) => (
          <article
            className={styles.usageMobileSlide}
            key={step.title}
            ref={(element) => {
              mobileSlideRefs.current[index] = element;
            }}
          >
            <figure className={getUsageMediaClassName(step, styles.usageMobileMedia)}>
              <UsageStepMediaContent
                adSizes="82vw"
                imageSizes="82vw"
                step={step}
              />
            </figure>
            <div className={styles.usageMobileStepCopy}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{`${index + 1}단계: ${step.title}`}</h3>
              <p>{step.body}</p>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.usageMobileDots} aria-label="이용 단계 이동">
        {steps.map((step, index) => (
          <button
            aria-current={activeIndex === index ? "step" : undefined}
            aria-label={`${index + 1}단계로 이동: ${step.title}`}
            className={`${styles.usageMobileDot} ${
              activeIndex === index ? styles.usageMobileDotActive : ""
            }`}
            key={step.title}
            onClick={() => goToMobileStep(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
