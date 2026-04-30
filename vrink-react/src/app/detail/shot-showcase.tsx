"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";

type ShotItem = {
  name: string;
  purpose: string;
  description: string;
  image: string;
  accent: string;
  ingredients: string[];
};

const shotItems: ShotItem[] = [
  {
    name: "부스터샷",
    purpose: "집중과 활력이 필요한 순간",
    description: "과라나추출분말과 아르지닌을 더해 업무와 운동 전 루틴에 맞춘 기능샷입니다.",
    image: "/images/vrink/shots/booster-shot.png",
    accent: "#b80f28",
    ingredients: ["과라나추출분말 250mg(카페인 55mg)", "L-아르지닌 500mg", "타우린 100mg"],
  },
  {
    name: "릴렉스샷",
    purpose: "차분한 균형이 필요한 시간",
    description: "L-테아닌과 타우린을 조합해 리프레시가 필요한 오후에 어울리는 기능샷입니다.",
    image: "/images/vrink/shots/relax-shot.png",
    accent: "#009f7d",
    ingredients: ["L-테아닌 100mg", "타우린 100mg"],
  },
  {
    name: "커팅샷",
    purpose: "일상 속 가벼운 관리 루틴",
    description: "L-카르니틴과 녹차농축액으로 산뜻한 밸런스 관리를 돕는 기능샷입니다.",
    image: "/images/vrink/shots/cutting-shot.png",
    accent: "#008ed6",
    ingredients: ["L-카르니틴 500mg", "녹차농축액 300mg"],
  },
  {
    name: "아미노샷",
    purpose: "운동 전후 회복 루틴",
    description: "필수아미노산 9종과 타우린을 담아 활동 후 루틴에 맞춘 기능샷입니다.",
    image: "/images/vrink/shots/amino-shot.png",
    accent: "#ed6c1b",
    ingredients: ["필수아미노산 9종 200mg", "타우린 100mg"],
  },
  {
    name: "비타민샷",
    purpose: "기초 영양과 컨디션 관리",
    description: "비타민B군믹스와 비타민C를 더해 데일리 컨디션 관리에 맞춘 기능샷입니다.",
    image: "/images/vrink/shots/vitamin-shot.png",
    accent: "#e2bd00",
    ingredients: ["비타민B군믹스 150mg", "비타민C 300mg"],
  },
];

export function ShotShowcase() {
  const [selectedShot, setSelectedShot] = useState<ShotItem | null>(null);

  useEffect(() => {
    if (!selectedShot) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedShot(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedShot]);

  const shotModal = selectedShot ? (
    <div className={styles.shotModalBackdrop} onClick={() => setSelectedShot(null)} role="presentation">
      <section
        aria-labelledby="shot-modal-title"
        aria-modal="true"
        className={styles.shotModal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{ "--shot-accent": selectedShot.accent } as CSSProperties}
      >
        <button
          aria-label="상세 성분 닫기"
          className={styles.shotModalClose}
          onClick={() => setSelectedShot(null)}
          type="button"
        />
        <div className={styles.shotModalHero}>
          <Image
            src={withBasePath(selectedShot.image)}
            alt={`${selectedShot.name} 이미지`}
            width={120}
            height={140}
            sizes="120px"
          />
          <div>
            <p>상세 성분</p>
            <h3 id="shot-modal-title">{selectedShot.name}</h3>
            <span>{selectedShot.purpose}</span>
          </div>
        </div>
        <p className={styles.shotModalDescription}>{selectedShot.description}</p>
        <ul className={styles.shotModalIngredients}>
          {selectedShot.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
        <dl className={styles.shotModalFacts}>
          <div>
            <dt>기준 용량</dt>
            <dd>350ml 1잔</dd>
          </div>
          <div>
            <dt>당류</dt>
            <dd>0g</dd>
          </div>
          <div>
            <dt>열량</dt>
            <dd>100g당 0kcal</dd>
          </div>
        </dl>
      </section>
    </div>
  ) : null;

  return (
    <>
      <div className={styles.shotShowcaseGrid}>
        {shotItems.map((shot) => (
          <article
            className={styles.shotShowcaseCard}
            key={shot.name}
            style={{ "--shot-accent": shot.accent } as CSSProperties}
          >
            <button
              aria-label={`${shot.name} 상세 성분 보기`}
              className={styles.shotPlus}
              onClick={() => setSelectedShot(shot)}
              type="button"
            />
            <span className={styles.shotCardImage}>
              <Image
                src={withBasePath(shot.image)}
                alt={`${shot.name} 이미지`}
                width={210}
                height={240}
                sizes="(max-width: 760px) 46vw, 170px"
              />
            </span>
            <span className={styles.shotCardCopy}>
              <strong>{shot.name}</strong>
              <small>{shot.purpose}</small>
            </span>
          </article>
        ))}
      </div>

      {shotModal && typeof document !== "undefined" ? createPortal(shotModal, document.body) : null}
    </>
  );
}
