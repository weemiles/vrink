"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { withBasePath } from "@/lib/static-export";

import styles from "./manufacturing-story.module.css";

type Locale = "ko" | "en";

type ManufacturingStoryProps = {
  locale?: Locale;
};

type ManufacturingSceneCopy = {
  alt: string;
  body: string;
  image: string;
  label: string;
  title: string;
};

const copyByLocale = {
  ko: {
    sectionTitle: "브링크 제로스테이션 제작 과정",
    scenes: [
      {
        label: "국내 설계·제작",
        title: "국내 제작 현장에서 완성합니다.",
        body: "브링크 제로스테이션은 금속 가공부터 조립과 출수 테스트까지 국내에서 제작하고 점검합니다.",
        image: "/images/vrink/manufacturing/domestic-production-welding.jpg",
        alt: "국내 제작 현장에서 브링크 제로스테이션의 금속 부품을 용접하는 모습",
      },
      {
        label: "제작 전문가와 공동 검토",
        title: "도면에서 끝내지 않고, 현장에서 다시 확인합니다.",
        body: "설계 도면과 가공 부품을 제작 담당자와 함께 살펴 구조와 조립 방식을 제품에 맞게 다듬습니다.",
        image: "/images/vrink/manufacturing/expert-production-review.jpg",
        alt: "브링크 담당자와 제작 전문가가 설계 도면과 가공 부품을 함께 검토하는 모습",
      },
    ],
  },
  en: {
    sectionTitle: "How the VRINK Zero Station is made",
    scenes: [
      {
        label: "Designed and built in Korea",
        title: "Built and checked on the production floor.",
        body: "VRINK Zero Station is designed and built in Korea, from metal fabrication and assembly to dispensing tests.",
        image: "/images/vrink/manufacturing/domestic-production-welding.jpg",
        alt: "A technician welding a metal component for the VRINK Zero Station at a production facility in Korea",
      },
      {
        label: "Reviewed with production specialists",
        title: "The design is checked again where it is made.",
        body: "We review drawings, fabricated parts, and assembly details with the production team before the station is completed.",
        image: "/images/vrink/manufacturing/expert-production-review.jpg",
        alt: "The VRINK team reviewing drawings and fabricated parts with a production specialist",
      },
    ],
  },
} as const;

function ManufacturingScene({ index, scene }: { index: number; scene: ManufacturingSceneCopy }) {
  const sceneRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });
  const frameClip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(16.5% 0% 16.5% 0%)", "inset(0% 0% 0% 0%)"],
  );
  const imageTransform = useTransform(scrollYProgress, [0, 1], ["scale(1.06)", "scale(1)"]);

  return (
    <article
      className={`${styles.scene} ${index === 0 ? styles.productionScene : styles.reviewScene}`}
      ref={sceneRef}
    >
      <div className={styles.stickyScene}>
        <motion.div
          className={styles.frame}
          style={{ clipPath: frameClip }}
        >
          <motion.div
            className={styles.imageLayer}
            style={{ transform: imageTransform }}
          >
            <Image
              alt={scene.alt}
              className={styles.image}
              fill
              quality={94}
              sizes="100vw"
              src={withBasePath(scene.image)}
            />
          </motion.div>
        </motion.div>

        <div className={styles.copyShell}>
          <div className={styles.copy}>
            <p className={styles.label}>{scene.label}</p>
            <h3>{scene.title}</h3>
            <p className={styles.body}>{scene.body}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ManufacturingStory({ locale = "ko" }: ManufacturingStoryProps) {
  const copy = copyByLocale[locale];

  return (
    <section className={styles.section} aria-labelledby="manufacturing-story-title">
      <h2 className={styles.visuallyHidden} id="manufacturing-story-title">
        {copy.sectionTitle}
      </h2>

      {copy.scenes.map((scene, index) => (
        <ManufacturingScene index={index} key={scene.title} scene={scene} />
      ))}
    </section>
  );
}
