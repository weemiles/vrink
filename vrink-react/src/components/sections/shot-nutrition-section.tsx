"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { withBasePath } from "@/lib/static-export";
import styles from "./shot-nutrition-section.module.css";

type ShotItem = {
  id: string;
  name: string;
  purpose: string;
  description: string;
  image: string;
  accent: string;
  ingredients: string[];
};

const shotFacts = [
  { term: "기준 용량", value: "350ml 1잔" },
  { term: "당류", value: "0g" },
  { term: "열량", value: "100g당 0kcal" },
];

const shotItems: ShotItem[] = [
  {
    id: "booster",
    name: "부스터샷",
    purpose: "집중과 활력이 필요한 순간",
    description: "과라나추출분말과 아르지닌을 더해 업무와 운동 전 루틴에 맞춘 기능샷입니다.",
    image: "/images/vrink/shots/booster-shot.png",
    accent: "#b80f28",
    ingredients: ["과라나추출분말 250mg(카페인 55mg)", "L-아르지닌 500mg", "타우린 100mg"],
  },
  {
    id: "vitamin",
    name: "비타민샷",
    purpose: "기초 영양과 컨디션 관리",
    description: "비타민B군믹스와 비타민C를 더해 데일리 컨디션 관리에 맞춘 기능샷입니다.",
    image: "/images/vrink/shots/vitamin-shot.png",
    accent: "#e2bd00",
    ingredients: ["비타민B군믹스 150mg", "비타민C 300mg"],
  },
  {
    id: "relax",
    name: "릴렉스샷",
    purpose: "차분한 균형이 필요한 시간",
    description: "L-테아닌과 타우린을 조합해 리프레시가 필요한 오후에 어울리는 기능샷입니다.",
    image: "/images/vrink/shots/relax-shot.png",
    accent: "#009f7d",
    ingredients: ["L-테아닌 100mg", "타우린 100mg"],
  },
  {
    id: "cutting",
    name: "커팅샷",
    purpose: "일상 속 가벼운 관리 루틴",
    description: "L-카르니틴과 녹차농축액으로 산뜻한 밸런스 관리를 돕는 기능샷입니다.",
    image: "/images/vrink/shots/cutting-shot.png",
    accent: "#008ed6",
    ingredients: ["L-카르니틴 500mg", "녹차농축액 300mg"],
  },
  {
    id: "amino",
    name: "아미노샷",
    purpose: "운동 전후 회복 루틴",
    description: "필수아미노산 9종과 타우린을 담아 활동 후 루틴에 맞춥니다.",
    image: "/images/vrink/shots/amino-shot.png",
    accent: "#ed6c1b",
    ingredients: ["필수아미노산 9종 200mg", "타우린 100mg"],
  },
];

export function ShotNutritionSection() {
  const [activeShot, setActiveShot] = useState<ShotItem | null>(null);

  useEffect(() => {
    if (!activeShot) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveShot(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeShot]);

  const shotModal = activeShot ? (
    <div className={styles.modalBackdrop} onClick={() => setActiveShot(null)} role="presentation">
      <section
        aria-labelledby={`${activeShot.id}-shot-modal-title`}
        aria-modal="true"
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{ "--shot-accent": activeShot.accent } as CSSProperties}
      >
        <button
          aria-label="상세 성분 닫기"
          className={styles.modalClose}
          onClick={() => setActiveShot(null)}
          type="button"
        />

        <div className={styles.modalHero}>
          <Image
            src={withBasePath(activeShot.image)}
            alt={`${activeShot.name} 이미지`}
            width={156}
            height={180}
            sizes="(max-width: 760px) 96px, 156px"
          />
          <div>
            <p>상세 성분</p>
            <h3 id={`${activeShot.id}-shot-modal-title`}>{activeShot.name}</h3>
            <span>{activeShot.purpose}</span>
          </div>
        </div>

        <p className={styles.modalDescription}>{activeShot.description}</p>

        <ul className={styles.modalIngredients}>
          {activeShot.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>

        <dl className={styles.modalFacts}>
          {shotFacts.map((fact) => (
            <div key={fact.term}>
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  ) : null;

  return (
    <>
      <section className={styles.section} aria-labelledby="shot-nutrition-title">
        <div className={styles.intro}>
          <h2 id="shot-nutrition-title">기능샷 둘러보기</h2>
          <p>샷별 특징을 고르고, 필요한 영양성분은 눌러서 확인합니다.</p>
        </div>

        <div className={styles.grid}>
          {shotItems.map((shot) => (
            <button
              aria-label={`${shot.name} 상세 성분 보기`}
              className={styles.card}
              key={shot.id}
              onClick={() => setActiveShot(shot)}
              style={{ "--shot-accent": shot.accent } as CSSProperties}
              type="button"
            >
              <span className={styles.cardCopy}>
                <strong>{shot.name}</strong>
                <small>{shot.purpose}</small>
                <em>영양성분 보기 ›</em>
              </span>
              <span className={styles.cardVisual}>
                <Image src={withBasePath(shot.image)} alt={`${shot.name} 캡슐 이미지`} width={130} height={150} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {shotModal && typeof document !== "undefined" ? createPortal(shotModal, document.body) : null}
    </>
  );
}
