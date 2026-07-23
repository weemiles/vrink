"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { withBasePath } from "@/lib/static-export";
import styles from "./shot-nutrition-section.module.css";

type Locale = "ko" | "en";

type LocalizedText = Record<Locale, string>;

type ShotItem = {
  id: string;
  name: LocalizedText;
  purpose: LocalizedText;
  description: LocalizedText;
  image: string;
  accent: string;
  ingredients: LocalizedText[];
};

const sectionCopy = {
  title: { ko: "5종 기능샷 고르기", en: "Choose from 5 functional shots" },
  subtitle: {
    ko: "목적을 고르고, 필요한 성분은 카드에서 바로 확인하세요.",
    en: "Pick a purpose, then tap a card to see what's inside.",
  },
  cardCta: { ko: "성분 보기 ›", en: "See details ›" },
  modalLabel: { ko: "상세 성분", en: "What's inside" },
} satisfies Record<string, LocalizedText>;

const shotFacts: { term: LocalizedText; value: LocalizedText }[] = [
  { term: { ko: "기준 용량", en: "Serving" }, value: { ko: "350ml 1잔", en: "One 350ml cup" } },
  { term: { ko: "당류", en: "Sugar" }, value: { ko: "0g", en: "0g" } },
  { term: { ko: "열량", en: "Calories" }, value: { ko: "100g당 0kcal", en: "0kcal per 100g" } },
];

const shotItems: ShotItem[] = [
  {
    id: "booster",
    name: { ko: "부스터샷", en: "Booster Shot" },
    purpose: { ko: "업무 전, 운동 전 활력 루틴", en: "For work and pre-workout routines" },
    description: {
      ko: "카페인 55mg이 포함된 과라나추출분말과 L-아르지닌을 더한 기능샷입니다.",
      en: "A functional shot with guarana extract containing 55mg caffeine and L-arginine.",
    },
    image: "/images/vrink/shots/booster-shot.png",
    accent: "#b80f28",
    ingredients: [
      { ko: "과라나추출분말 250mg(카페인 55mg)", en: "Guarana extract 250mg (55mg caffeine)" },
      { ko: "L-아르지닌 500mg", en: "L-arginine 500mg" },
      { ko: "타우린 100mg", en: "Taurine 100mg" },
    ],
  },
  {
    id: "vitamin",
    name: { ko: "비타민샷", en: "Vitamin Shot" },
    purpose: { ko: "매일 고르기 쉬운 기초 루틴", en: "An easy everyday base routine" },
    description: {
      ko: "비타민B군믹스와 비타민C를 더해 데일리 루틴에 맞춘 기능샷입니다.",
      en: "B-vitamin mix and vitamin C for a simple daily routine.",
    },
    image: "/images/vrink/shots/vitamin-shot.png",
    accent: "#e2bd00",
    ingredients: [
      { ko: "비타민B군믹스 150mg", en: "B-vitamin mix 150mg" },
      { ko: "비타민C 300mg", en: "Vitamin C 300mg" },
    ],
  },
  {
    id: "relax",
    name: { ko: "릴렉스샷", en: "Relax Shot" },
    purpose: { ko: "오후에 고르는 리프레시 루틴", en: "An afternoon refresh routine" },
    description: {
      ko: "L-테아닌과 타우린을 조합해 리프레시가 필요한 시간에 맞춘 기능샷입니다.",
      en: "L-theanine and taurine for the moments when you want a refresh.",
    },
    image: "/images/vrink/shots/relax-shot.png",
    accent: "#009f7d",
    ingredients: [
      { ko: "L-테아닌 100mg", en: "L-theanine 100mg" },
      { ko: "타우린 100mg", en: "Taurine 100mg" },
    ],
  },
  {
    id: "cutting",
    name: { ko: "커팅샷", en: "Cutting Shot" },
    purpose: { ko: "운동과 함께하는 가벼운 루틴", en: "A light routine with exercise" },
    description: {
      ko: "L-카르니틴과 녹차농축액으로 운동 전후에 고르기 쉬운 기능샷입니다.",
      en: "L-carnitine and green tea concentrate for an easy before-or-after workout choice.",
    },
    image: "/images/vrink/shots/cutting-shot.png",
    accent: "#008ed6",
    ingredients: [
      { ko: "L-카르니틴 500mg", en: "L-carnitine 500mg" },
      { ko: "녹차농축액 300mg", en: "Green tea concentrate 300mg" },
    ],
  },
  {
    id: "amino",
    name: { ko: "아미노샷", en: "Amino Shot" },
    purpose: { ko: "운동 전후 아미노 루틴", en: "Amino routine before or after workouts" },
    description: {
      ko: "필수아미노산 9종과 타우린을 담아 운동 전후 루틴에 맞춥니다.",
      en: "9 essential amino acids plus taurine for a workout routine.",
    },
    image: "/images/vrink/shots/amino-shot.png",
    accent: "#ed6c1b",
    ingredients: [
      { ko: "필수아미노산 9종 200mg", en: "9 essential amino acids 200mg" },
      { ko: "타우린 100mg", en: "Taurine 100mg" },
    ],
  },
];

type ShotNutritionSectionProps = {
  locale?: Locale;
};

export function ShotNutritionSection({ locale = "ko" }: ShotNutritionSectionProps) {
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
          aria-label={locale === "en" ? "Close ingredient details" : "상세 성분 닫기"}
          className={styles.modalClose}
          onClick={() => setActiveShot(null)}
          type="button"
        />

        <div className={styles.modalHero}>
          <Image
            src={withBasePath(activeShot.image)}
            alt={
              locale === "en"
                ? `${activeShot.name.en} image`
                : `${activeShot.name.ko} 이미지`
            }
            width={118}
            height={136}
            sizes="(max-width: 760px) 84px, 118px"
          />
          <div>
            <p>{sectionCopy.modalLabel[locale]}</p>
            <h3 id={`${activeShot.id}-shot-modal-title`}>{activeShot.name[locale]}</h3>
            <span>{activeShot.purpose[locale]}</span>
          </div>
        </div>

        <p className={styles.modalDescription}>{activeShot.description[locale]}</p>

        <ul className={styles.modalIngredients}>
          {activeShot.ingredients.map((ingredient) => (
            <li key={ingredient.ko}>{ingredient[locale]}</li>
          ))}
        </ul>

        <dl className={styles.modalFacts}>
          {shotFacts.map((fact) => (
            <div key={fact.term.ko}>
              <dt>{fact.term[locale]}</dt>
              <dd>{fact.value[locale]}</dd>
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
          <h2 id="shot-nutrition-title">{sectionCopy.title[locale]}</h2>
          <p>{sectionCopy.subtitle[locale]}</p>
        </div>

        <div className={styles.grid}>
          {shotItems.map((shot) => (
            <button
              aria-label={
                locale === "en"
                  ? `See ${shot.name.en} ingredients`
                  : `${shot.name.ko} 상세 성분 보기`
              }
              className={styles.card}
              key={shot.id}
              onClick={() => setActiveShot(shot)}
              style={{ "--shot-accent": shot.accent } as CSSProperties}
              type="button"
            >
              <span className={styles.cardCopy}>
                <strong>{shot.name[locale]}</strong>
                <small>{shot.purpose[locale]}</small>
                <em>{sectionCopy.cardCta[locale]}</em>
              </span>
              <span className={styles.cardVisual}>
                <Image
                  src={withBasePath(shot.image)}
                  alt={
                    locale === "en"
                      ? `${shot.name.en} capsule image`
                      : `${shot.name.ko} 캡슐 이미지`
                  }
                  width={130}
                  height={150}
                  loading="eager"
                />
              </span>
            </button>
          ))}
        </div>
      </section>

      {shotModal && typeof document !== "undefined" ? createPortal(shotModal, document.body) : null}
    </>
  );
}
