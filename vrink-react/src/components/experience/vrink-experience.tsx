"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useRef } from "react";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { withBasePath } from "@/lib/static-export";

import { ActualKioskDemo } from "./actual-kiosk-demo";
import styles from "./vrink-experience.module.css";

type Locale = "ko" | "en";

const pageCopy = {
  ko: {
    heroEyebrow: "VRINK INTERACTIVE EXPERIENCE",
    heroTitle: "실제 키오스크를 먼저 눌러보세요.",
    heroBody:
      "기존 iPad 키오스크의 화면과 선택 흐름을 웹에서 직접 체험할 수 있게 옮겼습니다. 기능샷부터 맛, 결제, 제조까지 한 잔이 완성되는 과정을 확인해 보세요.",
    heroPrimary: "키오스크 체험 시작",
    heroSecondary: "제품 먼저 보기",
    heroNote: "인터랙티브 데모 · 실제 결제 및 음료 출수 없음",
    previewLabel: "실제 화면 흐름",
    previewBody: "기능샷 → 조합 → 확인 → 결제 → 제조",
    demoEyebrow: "ACTUAL KIOSK UI",
    demoTitle: "설명용 목업이 아닌, 실제 세로형 UI입니다.",
    demoBody:
      "현장에서 보게 되는 800×1280 화면 비율과 선택 구조를 그대로 살리고, 웹과 모바일에서 편하게 누를 수 있도록 반응형으로 다듬었습니다.",
    processEyebrow: "현장에서는",
    processTitle: "고르고, 기다리고, 바로 받습니다.",
    processBody:
      "웹 체험에서 본 순서는 실제 제로스테이션에서도 이어집니다. 화면에서 조합을 정하면 제조부가 한 잔을 빠르게 완성합니다.",
    processSteps: [
      ["01", "키오스크에서 선택", "목적과 기능샷, 맛, 농도와 탄산을 화면에서 직접 고릅니다."],
      ["02", "약 15초 제조", "350ml 기준으로 선택한 조합이 한 잔으로 빠르게 완성됩니다."],
      ["03", "바로 이어지는 루틴", "오피스와 피트니스, 이벤트 공간에서 기다림 없이 음료를 받습니다."],
    ],
    fieldEyebrow: "VRINK IN THE FIELD",
    fieldTitle: "처음 만난 사람도 스스로 끝까지 고르는 경험.",
    fieldBody:
      "브링크는 화면의 선택 경험과 현장의 제조 경험이 자연스럽게 이어지도록 제품과 운영 흐름을 함께 설계합니다.",
    fieldCta: "우리 공간 도입 상담받기",
  },
  en: {
    heroEyebrow: "VRINK INTERACTIVE EXPERIENCE",
    heroTitle: "Try the real kiosk before you visit.",
    heroBody:
      "We brought the original iPad kiosk screens and selection flow to the web. Experience the complete journey from functional shot and flavor to payment and preparation.",
    heroPrimary: "Start the kiosk experience",
    heroSecondary: "See the product first",
    heroNote: "Interactive demo · No real payment or beverage dispense",
    previewLabel: "Real screen sequence",
    previewBody: "Shot → blend → review → payment → preparation",
    demoEyebrow: "ACTUAL KIOSK UI",
    demoTitle: "The real portrait interface, not an illustrative mockup.",
    demoBody:
      "The on-site 800×1280 proportions and choice structure are preserved, then adapted so the experience remains easy to use on the web and mobile.",
    processEyebrow: "AT THE STATION",
    processTitle: "Choose, wait, and take your drink.",
    processBody:
      "The sequence shown in the web experience continues at a real Zero Station. Once you choose a blend, the dispense unit prepares it quickly.",
    processSteps: [
      ["01", "Choose at the kiosk", "Select your purpose, functional shot, flavor, strength, and bubbles on screen."],
      ["02", "Made in about 15 seconds", "Your selected 350 ml blend is prepared quickly as one drink."],
      ["03", "Continue your routine", "Pick up your drink without a long wait at work, the gym, or an event."],
    ],
    fieldEyebrow: "VRINK IN THE FIELD",
    fieldTitle: "An experience anyone can finish on their first try.",
    fieldBody:
      "VRINK designs the product and operation together so the on-screen choice flows naturally into the physical drink experience.",
    fieldCta: "Discuss VRINK for your space",
  },
} satisfies Record<Locale, Record<string, string | string[][]>>;

export function VrinkExperience({ locale = "ko" }: { locale?: Locale }) {
  const copy = pageCopy[locale];
  const demoRef = useRef<HTMLElement>(null);
  const inquiryHref = locale === "en" ? "/en#contact" : "/#contact";
  const productHref = locale === "en" ? "/en/product" : "/product";

  function scrollToDemo() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    demoRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <VrinkHeader locale={locale} />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{copy.heroEyebrow as string}</p>
              <h1>{copy.heroTitle as string}</h1>
              <p className={styles.heroBody}>{copy.heroBody as string}</p>
              <div className={styles.heroActions}>
                <button type="button" className={styles.primaryAction} onClick={scrollToDemo}>
                  {copy.heroPrimary as string}
                  <ArrowDown aria-hidden="true" />
                </button>
                <Link href={productHref} className={styles.secondaryAction}>
                  {copy.heroSecondary as string}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <p className={styles.demoDisclosure}>{copy.heroNote as string}</p>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroProductImage}>
                <Image
                  src={withBasePath("/images/vrink/lifestyle/vrink-lifestyle-1138.jpg")}
                  alt={locale === "en" ? "A visitor using the VRINK kiosk" : "브링크 키오스크를 이용하는 방문객"}
                  fill
                  priority
                  sizes="(max-width: 767px) 88vw, 48vw"
                />
              </div>
              <div className={styles.heroScreenPreview}>
                <span>{copy.previewLabel as string}</span>
                <p>{copy.previewBody as string}</p>
                <div className={styles.previewProgress} aria-hidden="true"><i /><i /><i /><i /><i /></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.demoSection} id="demo" ref={demoRef}>
          <header className={styles.sectionIntro}>
            <p className={styles.eyebrow}>{copy.demoEyebrow as string}</p>
            <h2>{copy.demoTitle as string}</h2>
            <p>{copy.demoBody as string}</p>
          </header>
          <ActualKioskDemo locale={locale} />
        </section>

        <section className={styles.processSection}>
          <div className={styles.processInner}>
            <header className={styles.processIntro}>
              <p className={styles.eyebrow}>{copy.processEyebrow as string}</p>
              <h2>{copy.processTitle as string}</h2>
              <p>{copy.processBody as string}</p>
            </header>
            <ol className={styles.processList}>
              {(copy.processSteps as string[][]).map(([number, title, body]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.fieldSection}>
          <div className={styles.fieldImage}>
            <Image
              src={withBasePath("/images/vrink/detail/vrink-experience.jpg")}
              alt={locale === "en" ? "Visitors experiencing VRINK drinks at an event" : "행사 현장에서 브링크 음료를 체험하는 방문객"}
              fill
              sizes="(max-width: 767px) 100vw, 58vw"
            />
          </div>
          <div className={styles.fieldCopy}>
            <p className={styles.eyebrow}>{copy.fieldEyebrow as string}</p>
            <h2>{copy.fieldTitle as string}</h2>
            <p>{copy.fieldBody as string}</p>
            <Link href={inquiryHref} className={styles.primaryAction}>
              {copy.fieldCta as string}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <VrinkFooter locale={locale} ctaHref={inquiryHref} showCta={false} />
    </>
  );
}
