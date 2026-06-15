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

type LifestyleShowcaseProps = {
  images: LifestyleImage[];
};

const slideIntervalMs = 6500;

export function LifestyleShowcase({ images }: LifestyleShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);

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
          <p>사용 장면</p>
          <h2 id="lifestyle-title">선택한 음료가 일상으로 이어지는 순간.</h2>
          <span>운동 전후, 업무 사이, 웰니스 공간 안에서 브링크가 자연스럽게 놓이는 장면을 담았습니다.</span>
        </div>
      </div>
    </section>
  );
}
