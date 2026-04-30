"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { withBasePath } from "@/lib/static-export";
import styles from "./shot-nutrition-section.module.css";

type NutritionFact = {
  name: string;
  amount: string;
  daily?: string;
};

type ShotItem = {
  id: string;
  name: string;
  purpose: string;
  description: string;
  image: string;
  accent: string;
  extras: NutritionFact[];
};

const commonFacts: NutritionFact[] = [
  { name: "나트륨", amount: "20mg", daily: "1%" },
  { name: "탄수화물", amount: "0g", daily: "0%" },
  { name: "당류", amount: "0g", daily: "0%" },
  { name: "지방", amount: "0g", daily: "0%" },
  { name: "트랜스지방", amount: "0g" },
  { name: "포화지방", amount: "0g", daily: "0%" },
  { name: "콜레스테롤", amount: "0mg", daily: "0%" },
  { name: "단백질", amount: "0g", daily: "0%" },
];

const shotItems: ShotItem[] = [
  {
    id: "booster",
    name: "부스터샷",
    purpose: "집중이 필요한 순간",
    description: "과라나추출분말과 아르지닌을 더해 활력 있는 루틴을 만듭니다.",
    image: "/images/vrink/shots/booster-shot.png",
    accent: "#b80f28",
    extras: [
      { name: "과라나추출분말", amount: "250mg(카페인 55mg)" },
      { name: "L-아르지닌", amount: "500mg" },
      { name: "타우린", amount: "100mg" },
    ],
  },
  {
    id: "vitamin",
    name: "비타민샷",
    purpose: "데일리 컨디션 관리",
    description: "비타민B군믹스와 비타민C를 담아 가볍게 선택할 수 있습니다.",
    image: "/images/vrink/shots/vitamin-shot.png",
    accent: "#e2bd00",
    extras: [
      { name: "비타민B군믹스", amount: "150mg" },
      { name: "비타민C", amount: "300mg" },
    ],
  },
  {
    id: "relax",
    name: "릴렉스샷",
    purpose: "차분한 회복 루틴",
    description: "L-테아닌과 타우린을 조합해 휴식이 필요한 시간에 어울립니다.",
    image: "/images/vrink/shots/relax-shot.png",
    accent: "#009f7d",
    extras: [
      { name: "L-테아닌", amount: "100mg" },
      { name: "타우린", amount: "100mg" },
    ],
  },
  {
    id: "cutting",
    name: "커팅샷",
    purpose: "가벼운 밸런스 선택",
    description: "L-카르니틴과 녹차농축액으로 산뜻한 관리 경험을 더합니다.",
    image: "/images/vrink/shots/cutting-shot.png",
    accent: "#008ed6",
    extras: [
      { name: "L-카르니틴", amount: "500mg" },
      { name: "녹차농축액", amount: "300mg" },
    ],
  },
  {
    id: "amino",
    name: "아미노샷",
    purpose: "운동 전후 회복 루틴",
    description: "필수아미노산 9종과 타우린을 담아 활동 후 루틴에 맞춥니다.",
    image: "/images/vrink/shots/amino-shot.png",
    accent: "#ed6c1b",
    extras: [
      { name: "필수아미노산 9종", amount: "200mg" },
      { name: "타우린", amount: "100mg" },
    ],
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

  return (
    <section className={styles.section} aria-labelledby="shot-nutrition-title">
      <div className={styles.intro}>
        <h2 id="shot-nutrition-title">기능샷 둘러보기</h2>
        <p>샷별 특징을 고르고, 필요한 영양성분은 눌러서 확인합니다.</p>
      </div>

      <div className={styles.grid}>
        {shotItems.map((shot) => (
          <button
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

      {activeShot ? (
        <div className={styles.overlay} onMouseDown={() => setActiveShot(null)}>
          <div
            aria-labelledby={`${activeShot.id}-nutrition-title`}
            aria-modal="true"
            className={styles.dialog}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            style={{ "--shot-accent": activeShot.accent } as CSSProperties}
          >
            <button className={styles.closeButton} onClick={() => setActiveShot(null)} type="button">
              닫기
            </button>

            <div className={styles.dialogHero}>
              <div className={styles.dialogImage}>
                <Image src={withBasePath(activeShot.image)} alt="" width={156} height={180} />
              </div>
              <div>
                <h3 id={`${activeShot.id}-nutrition-title`}>{activeShot.name}</h3>
                <p>{activeShot.description}</p>
              </div>
            </div>

            <div className={styles.summary}>
              <span>총 내용량 350g</span>
              <span>1잔(5g+345g=350g)</span>
              <span>100g 당 0 kcal</span>
            </div>

            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>영양성분</th>
                    <th>총내용량당</th>
                    <th>기준치</th>
                  </tr>
                </thead>
                <tbody>
                  {commonFacts.map((fact) => (
                    <tr key={fact.name}>
                      <td>{fact.name}</td>
                      <td>{fact.amount}</td>
                      <td>{fact.daily ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.extraList}>
              <h4>추가영양</h4>
              {activeShot.extras.map((fact) => (
                <p key={fact.name}>
                  <span>{fact.name}</span>
                  <strong>{fact.amount}</strong>
                </p>
              ))}
            </div>

            <p className={styles.note}>
              1일 영양성분 기준치에 대한 비율(%)은 2,000kcal 기준이므로 개인의 필요 열량에 따라 다를 수 있습니다.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
