"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { withBasePath } from "@/lib/static-export";

import styles from "./lifestyle-showcase.module.css";

type LifestyleImage = {
  src: string;
  alt: string;
  position?: string;
};

type Locale = "ko" | "en";

type LifestyleShowcaseProps = {
  images: LifestyleImage[];
  locale?: Locale;
};

const copyByLocale: Record<Locale, { eyebrow: string; title: string; description: string }> = {
  ko: {
    eyebrow: "사용 장면",
    title: "운동 전후, 업무 사이에 바로 고르는 한 잔.",
    description: "브링크가 놓인 공간에서 사용자가 직접 고르고 마시는 장면을 담았습니다.",
  },
  en: {
    eyebrow: "In the moment",
    title: "A personalized drink for workouts, workdays, and everything in between.",
    description: "See how people choose and enjoy VRINK in the spaces where it is installed.",
  },
};

const slideIntervalMs = 6500;

export function LifestyleShowcase({ images, locale = "ko" }: LifestyleShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const copy = copyByLocale[locale];

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, slideIntervalMs);

    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <section id="experience" className={styles.section} aria-labelledby="lifestyle-title">
      <div className={styles.frame}>
        {images.map((image, index) => {
          const isActive = index === activeIndex;
          const imageStyle = {
            "--slide-position": image.position ?? "center",
          } as CSSProperties;

          return (
            <figure
              aria-hidden={!isActive}
              className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
              key={image.src}
              style={imageStyle}
            >
              <Image
                src={withBasePath(image.src)}
                alt={isActive ? image.alt : ""}
                fill
                quality={94}
                sizes="100vw"
              />
            </figure>
          );
        })}

        <div className={styles.copy}>
          <p>{copy.eyebrow}</p>
          <h2 id="lifestyle-title">{copy.title}</h2>
          <span>{copy.description}</span>
        </div>
      </div>
    </section>
  );
}
