"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { withBasePath } from "@/lib/static-export";

import styles from "./actual-kiosk-demo.module.css";

type Locale = "ko" | "en";
type Variant = "full" | "embedded";
type Screen = "welcome" | "flavor" | "options" | "dispensing" | "complete";
type DispensingPhase = "concentrate" | "function" | "finishing" | "complete";

type Localized = { ko: string; en: string };

type Flavor = {
  id: string;
  label: Localized;
  image: string;
};

type FunctionShot = {
  id: string;
  label: Localized;
  ingredients: Localized[];
  image: string;
  phase: "pre" | "during" | "post";
};

const assetRoot = "/images/vrink/experience/kiosk";
const figmaAssetRoot = `${assetRoot}/figma-v4`;

const flavors: Flavor[] = [
  { id: "apple", label: { ko: "사과", en: "Apple" }, image: `${figmaAssetRoot}/flavor-apple.png` },
  { id: "mango", label: { ko: "망고", en: "Mango" }, image: `${figmaAssetRoot}/flavor-mango.png` },
  { id: "cherry", label: { ko: "체리", en: "Cherry" }, image: `${figmaAssetRoot}/flavor-cherry.png` },
  { id: "lemon", label: { ko: "레몬", en: "Lemon" }, image: `${figmaAssetRoot}/flavor-lemon.png` },
  { id: "grape", label: { ko: "청포도", en: "Green Grape" }, image: `${figmaAssetRoot}/flavor-grape.png` },
  { id: "lemonwater", label: { ko: "레몬 수", en: "Lemon Water" }, image: `${figmaAssetRoot}/flavor-lemonwater.png` },
];

const functionShots: FunctionShot[] = [
  {
    id: "booster",
    label: { ko: "부스터", en: "Booster" },
    ingredients: [
      { ko: "카페인 55mg", en: "Caffeine 55mg" },
      { ko: "아르기닌 500mg", en: "Arginine 500mg" },
      { ko: "타우린 100mg", en: "Taurine 100mg" },
      { ko: "비타민B 10mg", en: "Vitamin B 10mg" },
    ],
    image: `${figmaAssetRoot}/shot-booster.png`,
    phase: "pre",
  },
  {
    id: "vitamin",
    label: { ko: "비타민", en: "Vitamin" },
    ingredients: [
      { ko: "비타민C 500mg", en: "Vitamin C 500mg" },
      { ko: "비타민B 10mg", en: "Vitamin B 10mg" },
      { ko: "아연 15mg", en: "Zinc 15mg" },
    ],
    image: `${figmaAssetRoot}/shot-vitamin.png`,
    phase: "pre",
  },
  {
    id: "cutting",
    label: { ko: "다이어트", en: "Diet" },
    ingredients: [
      { ko: "L-카르니틴 500mg", en: "L-Carnitine 500mg" },
      { ko: "녹차추출물 300mg", en: "Green Tea Extract 300mg" },
      { ko: "비타민B 10mg", en: "Vitamin B 10mg" },
    ],
    image: `${figmaAssetRoot}/shot-diet.png`,
    phase: "during",
  },
  {
    id: "amino",
    label: { ko: "아미노", en: "Amino" },
    ingredients: [
      { ko: "BCAA 300mg", en: "BCAA 300mg" },
      { ko: "글루타민 500mg", en: "Glutamine 500mg" },
      { ko: "타우린 1,000mg", en: "Taurine 1,000mg" },
    ],
    image: `${figmaAssetRoot}/shot-amino.png`,
    phase: "post",
  },
  {
    id: "relax",
    label: { ko: "릴렉스", en: "Relax" },
    ingredients: [
      { ko: "락티톨 600mg", en: "Lactitol 600mg" },
      { ko: "마그네슘 150mg", en: "Magnesium 150mg" },
      { ko: "구연산 100mg", en: "Citric Acid 100mg" },
    ],
    image: `${figmaAssetRoot}/shot-relax.png`,
    phase: "post",
  },
];

const copy = {
  ko: {
    landingTitle: "기분 좋은 내 몸의 영양 관리\n브링크로 시작하세요",
    landingSubtitle: "회원가입 후에 이용하시면\n최대 50% 할인된 금액으로 만나보실 수 있어요",
    startOrder: "주문하기",
    recommended: "추천",
    flavorTitle: "어떤 맛으로\n마실까요?",
    flavorSubtitle: "원하는 맛을 먼저 선택해주세요.",
    optionsTitle: "운동 목적을\n선택해주세요",
    optionsSubtitle: "기본 옵션은 보통 농도와 비탄산으로 설정되어 있어요.\n최대 3개까지 조합할 수 있어요.",
    selectedItems: "선택항목",
    reset: "초기화",
    pre: "운동 전",
    during: "운동 중",
    post: "운동 후",
    baseIncluded: "비타민 · 전해질 기본 포함",
    concentration: "농도 옵션",
    concentrationOptions: ["연하게", "보통", "진하게"],
    carbonation: "탄산 옵션",
    carbonationOptions: ["비탄산", "탄산"],
    selectionHint: "카드를 다시 누르면 수량이 바뀝니다.",
    functionalSummary: "기능 성분",
    selectedBasis: "선택 기준",
    emptyIngredients: "기능을 선택하면 성분이 표시돼요.",
    dispense: "출수하기",
    dispensingProgress: "출수 진행률",
    dispensingStatuses: {
      concentrate: {
        title: "맛 원액을 채우고 있어요",
        subtitle: "선택한 맛을 정확한 비율로 담고 있어요.",
      },
      function: {
        title: "기능샷을 더하고 있어요",
        subtitle: "선택한 기능 성분을 차례로 담고 있어요.",
      },
      finishing: {
        title: "마지막으로 혼합하고 있어요",
        subtitle: "거의 다 됐어요. 조금만 기다려 주세요.",
      },
      complete: {
        title: "한 잔이 완성됐어요",
        subtitle: "음료를 꺼내 맛있게 즐겨주세요.",
      },
    },
    completionTitle: "음료가 완성되었어요",
    completionSubtitle: "맛있게 드세요!\n음료를 가져가 주세요.",
    boosterBasis: "부스터 샷 기준",
    next: "다음 단계",
    selectedFlavor: "선택한 맛",
    defaultIngredients: "비타민 · 전해질",
    demoNotice: "웹 체험에서는 실제 주문이 접수되지 않습니다.",
    embeddedGuide: {
      welcome: {
        title: "아이패드 화면을 눌러 직접 시작해보세요.",
        body: "주문하기를 누르면 원하는 맛과 기능을 차례로 고를 수 있습니다.",
      },
      flavor: {
        title: "먼저, 원하는 맛을 골라보세요.",
        body: "사과부터 레몬수까지 여섯 가지 맛 중 하나를 선택하고 다음 단계로 넘어가세요.",
      },
      options: {
        title: "기능샷과 농도, 탄산을 조합해보세요.",
        body: "운동 목적에 맞는 기능샷을 최대 3개까지 고르고 원하는 옵션으로 바꿔보세요.",
      },
      dispensing: {
        title: "선택한 한 잔을 출수하고 있어요.",
        body: "실제 기기에서 음료가 만들어지는 마지막 단계를 화면으로 확인해보세요.",
      },
      complete: {
        title: "음료가 완성되었어요.",
        body: "완성 화면을 확인하고 처음으로 버튼을 눌러 체험을 다시 시작할 수 있습니다.",
      },
    },
    embeddedNotice: "실제 키오스크 화면과 기능은 현장 버전에 따라 다를 수 있습니다.",
    back: "뒤로",
    exit: "처음으로",
    summaryLabel: "지금 만든 한 잔",
    asideTitle: "운영 키오스크 화면을 바탕으로",
    asideBody: "현장 화면의 800×1280 비율과 선택 체계를 웹 체험용으로 옮겼습니다. 실제 키오스크와 일부 화면·동작이 다를 수 있습니다.",
    asideOrder: "실제 화면 순서",
    asideOrderBody: "맛 선택 → 기능샷·농도·탄산 조합 → 출수",
    asideSafety: "안전한 체험",
    asideSafetyBody: "회원, 카드, 주문 서버, 제조 장비에는 연결되지 않습니다.",
    sourceLabel: "운영 키오스크 UI 참고",
    inquiry: "도입 상담하기",
  },
  en: {
    landingTitle: "Feel-good nutrition for your body\nStart with VRINK",
    landingSubtitle: "Sign up to enjoy\ndiscounts of up to 50%",
    startOrder: "Order now",
    recommended: "Recommended",
    flavorTitle: "Which flavor\nwould you like?",
    flavorSubtitle: "Choose your flavor first.",
    optionsTitle: "Choose your\nworkout goal",
    optionsSubtitle: "Defaults are regular concentration and still water.\nCombine up to 3 functional shots.",
    selectedItems: "Selected Items",
    reset: "Reset",
    pre: "Pre-Workout",
    during: "During Workout",
    post: "Post-Workout",
    baseIncluded: "Vitamins & electrolytes included",
    concentration: "Concentration",
    concentrationOptions: ["Mild", "Regular", "Strong"],
    carbonation: "Sparkling",
    carbonationOptions: ["Still", "Sparkling"],
    selectionHint: "Tap a card again to change its quantity.",
    functionalSummary: "Functional ingredients",
    selectedBasis: "selected",
    emptyIngredients: "Choose a function to see its ingredients.",
    dispense: "Dispense",
    dispensingProgress: "Dispensing progress",
    dispensingStatuses: {
      concentrate: {
        title: "Dispensing your flavor concentrate",
        subtitle: "Adding your selected flavor in the right proportion.",
      },
      function: {
        title: "Adding your functional shots",
        subtitle: "Dispensing each selected functional ingredient.",
      },
      finishing: {
        title: "Mixing your drink",
        subtitle: "Almost ready. Please wait just a moment.",
      },
      complete: {
        title: "Your drink is ready",
        subtitle: "Pick it up and enjoy your VRINK.",
      },
    },
    completionTitle: "Your drink is ready",
    completionSubtitle: "Enjoy your drink!\nPlease take it with you.",
    boosterBasis: "Based on Booster shot",
    next: "Next",
    selectedFlavor: "Selected flavor",
    defaultIngredients: "Vitamins & electrolytes",
    demoNotice: "No order is placed during the web experience.",
    embeddedGuide: {
      welcome: {
        title: "Start directly from the iPad screen.",
        body: "Select Order now, then choose your flavor and functional blend step by step.",
      },
      flavor: {
        title: "First, choose your flavor.",
        body: "Pick one of six flavors, from apple to lemon water, then continue to the next step.",
      },
      options: {
        title: "Build your blend with shots, strength, and sparkling.",
        body: "Choose up to three functional shots, then adjust the drink to your preference.",
      },
      dispensing: {
        title: "Your selected drink is now dispensing.",
        body: "See the final step as the kiosk prepares the drink you just created.",
      },
      complete: {
        title: "Your drink is ready.",
        body: "Review the completion screen, then select Home to restart the experience.",
      },
    },
    embeddedNotice: "Screens and functions may differ from the kiosk installed on site.",
    back: "Back",
    exit: "Home",
    summaryLabel: "Your current blend",
    asideTitle: "Based on the operational kiosk",
    asideBody: "The 800×1280 proportions and selection system were adapted for the web experience. Some screens and actions may differ from the kiosk installed on site.",
    asideOrder: "Actual screen order",
    asideOrderBody: "Flavor → shots, strength and sparkling → dispense",
    asideSafety: "Safe simulation",
    asideSafetyBody: "It never connects to members, cards, the order server, or dispensing hardware.",
    sourceLabel: "Referencing the operational kiosk UI",
    inquiry: "Discuss an installation",
  },
} as const;

const screenOrder: Screen[] = ["welcome", "flavor", "options", "dispensing"];
const visibleStepCount = 4;
const dispensingDurationMs = 8000;
const completionRevealDelayMs = 450;

function Lines({ value }: { value: string }) {
  const parts = value.split("\n");
  return parts.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < parts.length - 1 && <br />}
    </span>
  ));
}

export function ActualKioskDemo({ locale, variant = "full" }: { locale: Locale; variant?: Variant }) {
  const t = copy[locale];
  const deviceRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [flavorId, setFlavorId] = useState<string | null>(null);
  const [shotCounts, setShotCounts] = useState<Record<string, number>>({});
  const [concentrationIndex, setConcentrationIndex] = useState(1);
  const [carbonationIndex, setCarbonationIndex] = useState(0);
  const [internalScrollEnabled, setInternalScrollEnabled] = useState(false);
  const [dispensingProgress, setDispensingProgress] = useState(0);

  const selectedFlavor = flavors.find((flavor) => flavor.id === flavorId);
  const totalShotCount = Object.values(shotCounts).reduce((total, count) => total + count, 0);
  const selectedShots = functionShots.filter((shot) => (shotCounts[shot.id] ?? 0) > 0);
  const embeddedGuide = t.embeddedGuide[screen];
  const currentStepIndex = screen === "complete" ? visibleStepCount - 1 : screenOrder.indexOf(screen);
  const inquiryHref = locale === "en" ? "/en#contact" : "/#contact";
  const dispensingPhase: DispensingPhase = dispensingProgress >= 100
    ? "complete"
    : dispensingProgress >= 75
      ? "finishing"
      : dispensingProgress >= 40
        ? "function"
        : "concentrate";
  const dispensingStatus = t.dispensingStatuses[dispensingPhase];
  const dispensingBarScale = Math.max(0, Math.min(1, (dispensingProgress - 8) / 84));

  const blendSummary = useMemo(() => {
    const flavor = selectedFlavor?.label[locale] ?? (locale === "ko" ? "맛을 선택해주세요" : "Choose a flavor");
    const shots = selectedShots.length
      ? selectedShots.map((shot) => `${shot.label[locale]}${(shotCounts[shot.id] ?? 0) > 1 ? ` ×${shotCounts[shot.id]}` : ""}`).join(" · ")
      : t.defaultIngredients;
    return `${flavor} · ${shots}`;
  }, [locale, selectedFlavor, selectedShots, shotCounts, t.defaultIngredients]);

  useEffect(() => {
    if (screen === "welcome") return;
    headingRef.current?.focus({ preventScroll: true });
    if (variant !== "full") return;
    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      deviceRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screen, variant]);

  useEffect(() => {
    if (!internalScrollEnabled || variant !== "embedded") return;

    function disableScrollOutsideDevice(event: PointerEvent) {
      if (event.target instanceof Node && !deviceRef.current?.contains(event.target)) {
        setInternalScrollEnabled(false);
      }
    }

    function disableScrollWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setInternalScrollEnabled(false);
    }

    document.addEventListener("pointerdown", disableScrollOutsideDevice, true);
    document.addEventListener("keydown", disableScrollWithEscape);
    return () => {
      document.removeEventListener("pointerdown", disableScrollOutsideDevice, true);
      document.removeEventListener("keydown", disableScrollWithEscape);
    };
  }, [internalScrollEnabled, variant]);

  useEffect(() => {
    if (screen !== "dispensing") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => setDispensingProgress(100));
      return () => window.cancelAnimationFrame(frame);
    }

    let elapsed = 0;
    let previousTime = performance.now();
    let frame = 0;

    function updateProgress(currentTime: number) {
      elapsed += Math.min(currentTime - previousTime, 64);
      previousTime = currentTime;
      const nextProgress = Math.min(100, Math.round((elapsed / dispensingDurationMs) * 100));
      setDispensingProgress((current) => current === nextProgress ? current : nextProgress);
      if (nextProgress < 100) frame = window.requestAnimationFrame(updateProgress);
    }

    frame = window.requestAnimationFrame(updateProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [screen]);

  useEffect(() => {
    if (screen !== "dispensing" || dispensingProgress < 100) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => {
      setInternalScrollEnabled(false);
      setScreen("complete");
    }, reducedMotion ? 0 : completionRevealDelayMs);

    return () => window.clearTimeout(timeout);
  }, [dispensingProgress, screen]);

  function changeScreen(next: Screen) {
    setInternalScrollEnabled(false);
    setScreen(next);
  }

  function goBack() {
    if (screen === "complete") {
      resetDemo();
      return;
    }
    const current = screenOrder.indexOf(screen);
    changeScreen(screenOrder[Math.max(0, current - 1)]);
  }

  function enableInternalScroll() {
    if (variant === "embedded") setInternalScrollEnabled(true);
  }

  function startOrderFlow() {
    setFlavorId("apple");
    changeScreen("flavor");
  }

  function goToOptions() {
    setShotCounts({ booster: 2, cutting: 1 });
    setConcentrationIndex(1);
    setCarbonationIndex(0);
    changeScreen("options");
  }

  function startDispensing() {
    setDispensingProgress(0);
    changeScreen("dispensing");
  }

  function resetDemo() {
    setFlavorId(null);
    setShotCounts({});
    setConcentrationIndex(1);
    setCarbonationIndex(0);
    setDispensingProgress(0);
    changeScreen("welcome");
  }

  function cycleShot(id: string) {
    setShotCounts((current) => {
      const currentCount = current[id] ?? 0;
      const currentTotal = Object.values(current).reduce((sum, count) => sum + count, 0);
      if (currentCount === 0 && currentTotal < 3) return { ...current, [id]: 1 };
      if (currentCount === 1 && currentTotal < 3) return { ...current, [id]: 2 };
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  const screenScrollClassName = `${styles.screenScroll} ${internalScrollEnabled ? styles.screenScrollEnabled : ""}`;

  return (
    <div className={`${styles.experienceStage} ${variant === "embedded" ? styles.embeddedStage : ""}`}>
      <aside className={styles.contextRail} aria-label={locale === "en" ? "Demo details" : "체험 안내"}>
        <div>
          <span className={styles.sourceBadge}><ShieldCheck aria-hidden="true" />{t.sourceLabel}</span>
          <h3>{t.asideTitle}</h3>
          <p className={styles.railBody}>{t.asideBody}</p>
        </div>
        <dl className={styles.railList}>
          <div>
            <dt>{t.asideOrder}</dt>
            <dd>{t.asideOrderBody}</dd>
          </div>
          <div>
            <dt>{t.asideSafety}</dt>
            <dd>{t.asideSafetyBody}</dd>
          </div>
        </dl>
        <div className={styles.currentBlend} aria-live="polite">
          {selectedFlavor ? <Image src={withBasePath(selectedFlavor.image)} alt="" width={72} height={72} /> : <span className={styles.emptyBlend} aria-hidden="true">V</span>}
          <div>
            <span>{t.summaryLabel}</span>
            <p>{blendSummary}</p>
          </div>
        </div>
        {variant === "full" && <Link href={inquiryHref} className={styles.inquiryLink}>{t.inquiry}<ChevronRight aria-hidden="true" /></Link>}
      </aside>

      {variant === "embedded" && (
        <aside className={styles.embeddedNarrative} aria-live="polite" aria-atomic="true">
          <ol className={styles.embeddedProgress} aria-label={locale === "ko" ? "키오스크 체험 단계" : "Kiosk demo steps"}>
            {Array.from({ length: visibleStepCount }, (_, index) => {
              const stateClass = index === currentStepIndex
                ? styles.progressStepActive
                : index < currentStepIndex
                  ? styles.progressStepComplete
                  : "";
              return (
                <li
                  key={index}
                  className={stateClass}
                  aria-current={index === currentStepIndex ? "step" : undefined}
                  aria-label={locale === "ko" ? `${index + 1}단계` : `Step ${index + 1}`}
                >
                  <span aria-hidden="true">{index + 1}</span>
                </li>
              );
            })}
          </ol>
          <div key={screen} className={styles.embeddedNarrativeCopy}>
            <h2 id="usage-title">{embeddedGuide.title}</h2>
            <p>{embeddedGuide.body}</p>
          </div>
        </aside>
      )}

      <div className={styles.deviceColumn}>
        <div className={styles.deviceShell} ref={deviceRef}>
          <div
            className={styles.deviceViewport}
            data-internal-scroll={internalScrollEnabled ? "enabled" : "disabled"}
            onClickCapture={enableInternalScroll}
          >
            <div className={styles.kioskCanvas} data-locale={locale}>
            {screen === "welcome" && (
              <section className={`${styles.kioskScreen} ${styles.welcomeScreen}`} aria-labelledby="kiosk-welcome-title">
                <div className={styles.welcomeContent}>
                  <header className={styles.welcomeHeader}>
                    <Image className={styles.welcomeLogo} src={withBasePath("/images/vrink/apple/vrink-logo.svg")} alt="VRINK" width={142} height={42} priority />
                    <div className={styles.languageSwitch} aria-label={locale === "ko" ? "언어 선택" : "Language selection"}>
                      <span className={locale === "ko" ? styles.languageActive : undefined}>🇰🇷 <strong>한국어</strong></span>
                      <span className={locale === "en" ? styles.languageActive : undefined}>🇺🇸 <strong>English</strong></span>
                    </div>
                  </header>
                  <div className={styles.welcomeCopy}>
                    <h3 id="kiosk-welcome-title"><Lines value={t.landingTitle} /></h3>
                    <p><Lines value={t.landingSubtitle} /></p>
                  </div>
                  <div className={styles.centerMark} aria-hidden="true">
                    <Image src={withBasePath(`${figmaAssetRoot}/onboarding-symbol.svg`)} alt="" width={191} height={191} />
                  </div>
                  <div className={styles.welcomeActions}>
                    <button type="button" className={styles.primaryButton} onClick={startOrderFlow}>{t.startOrder}</button>
                  </div>
                </div>
              </section>
            )}

            {screen === "flavor" && (
              <section className={`${styles.kioskScreen} ${styles.flavorScreen}`} aria-labelledby="kiosk-flavor-title">
                <header className={`${styles.kioskHeader} ${styles.flavorHeader}`}>
                  <button type="button" onClick={goBack} aria-label={t.back}>
                    <Image src={withBasePath(`${figmaAssetRoot}/icon-back.svg`)} alt="" width={34} height={34} />
                  </button>
                </header>
                <div className={`${screenScrollClassName} ${styles.flavorBody}`}>
                  <div className={styles.kioskHeading}>
                    <h3 id="kiosk-flavor-title" ref={headingRef} tabIndex={-1}><Lines value={t.flavorTitle} /></h3>
                    <p>{t.flavorSubtitle}</p>
                  </div>
                  <div className={styles.flavorGrid} role="radiogroup" aria-label={t.flavorSubtitle}>
                    {flavors.map((flavor) => {
                      const selected = flavor.id === flavorId;
                      return (
                        <button key={flavor.id} type="button" role="radio" aria-checked={selected} className={`${styles.flavorCard} ${selected ? styles.cardSelected : ""}`} onClick={() => setFlavorId(flavor.id)}>
                          {flavor.id === "apple" && <span className={styles.recommendedTag}>{t.recommended}</span>}
                          <Image src={withBasePath(flavor.image)} alt="" width={117} height={117} />
                          <strong>{flavor.label[locale]}</strong>
                          {selected && <Image className={styles.selectedCheck} src={withBasePath(`${figmaAssetRoot}/icon-check.svg`)} alt="" width={30} height={30} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={`${styles.bottomPanel} ${styles.flavorFooter}`}>
                  <button type="button" className={styles.primaryButton} disabled={!flavorId} onClick={goToOptions}>{t.next}</button>
                </div>
              </section>
            )}

            {screen === "options" && selectedFlavor && (
              <section className={`${styles.kioskScreen} ${styles.optionsScreen}`} aria-labelledby="kiosk-options-title">
                <header className={`${styles.kioskHeader} ${styles.optionsHeader}`}>
                  <button type="button" onClick={goBack} aria-label={t.back}>
                    <Image src={withBasePath(`${figmaAssetRoot}/icon-back-options.svg`)} alt="" width={34} height={34} />
                  </button>
                </header>
                <div className={styles.selectedFlavorTab}>
                  <Image src={withBasePath(selectedFlavor.image)} alt="" width={96} height={96} />
                  <span>{t.selectedFlavor}<strong>{selectedFlavor.label[locale]}</strong></span>
                </div>
                <div className={`${screenScrollClassName} ${styles.optionsBody}`}>
                  <div className={styles.kioskHeading}>
                    <h3 id="kiosk-options-title" ref={headingRef} tabIndex={-1}><Lines value={t.optionsTitle} /></h3>
                    <p><Lines value={t.optionsSubtitle} /></p>
                  </div>
                  <div className={styles.selectionToolbar}>
                    <button type="button" className={styles.resetButton} onClick={() => setShotCounts({})}>
                      <Image src={withBasePath(`${figmaAssetRoot}/icon-reset.svg`)} alt="" width={34} height={32} />{t.reset}
                    </button>
                    <div className={styles.selectionCount} aria-label={`${t.selectedItems} ${totalShotCount} / 3`}>
                      <div className={styles.pillCounter} aria-hidden="true">{[0, 1, 2].map((index) => <i key={index} className={index < totalShotCount ? styles.pillFilled : undefined} />)}</div>
                    </div>
                  </div>
                  <div className={styles.functionGrid} role="group" aria-label={t.optionsTitle.replace("\n", " ")}>
                    {functionShots.map((shot) => {
                      const count = shotCounts[shot.id] ?? 0;
                      const phaseClass = shot.phase === "pre" ? styles.phasePre : shot.phase === "during" ? styles.phaseDuring : styles.phasePost;
                      return (
                        <button
                          key={shot.id}
                          type="button"
                          aria-pressed={count > 0}
                          aria-label={`${shot.label[locale]} ${count ? `×${count}` : ""}`.trim()}
                          className={`${styles.functionCard} ${count ? styles.cardSelected : ""}`}
                          onClick={() => cycleShot(shot.id)}
                        >
                          {count > 0 && <span className={styles.functionSelected}>{count > 1 ? `×${count}` : <Image src={withBasePath(`${figmaAssetRoot}/icon-card-check-small.svg`)} alt="" width={26} height={26} />}</span>}
                          <Image className={styles.functionIcon} src={withBasePath(shot.image)} alt="" width={92} height={92} />
                          <span className={`${styles.phaseTag} ${phaseClass}`}>{t[shot.phase]}</span>
                          <strong className={styles.functionName}>{shot.label[locale]}</strong>
                        </button>
                      );
                    })}
                  </div>
                  <fieldset className={styles.optionGroup}>
                    <legend>{t.concentration}</legend>
                    <div>{t.concentrationOptions.map((option, index) => <button key={option} type="button" className={index === concentrationIndex ? styles.optionSelected : ""} onClick={() => setConcentrationIndex(index)}>{index === concentrationIndex && <Image src={withBasePath(`${figmaAssetRoot}/icon-option-check.svg`)} alt="" width={26} height={26} />}{option}</button>)}</div>
                  </fieldset>
                  <fieldset className={styles.optionGroup}>
                    <legend>{t.carbonation}</legend>
                    <div className={styles.optionRowTwo}>{t.carbonationOptions.map((option, index) => <button key={option} type="button" className={index === carbonationIndex ? styles.optionSelected : ""} onClick={() => setCarbonationIndex(index)}>{index === carbonationIndex && <Image src={withBasePath(`${figmaAssetRoot}/icon-option-check.svg`)} alt="" width={26} height={26} />}{option}</button>)}</div>
                  </fieldset>
                  <p className={styles.baseIncluded}><Image src={withBasePath(`${figmaAssetRoot}/icon-included-check.svg`)} alt="" width={22} height={22} />{t.baseIncluded}</p>
                  <section className={styles.ingredientSummary} aria-labelledby="functional-summary-title">
                    <div className={styles.ingredientSummaryHead}>
                      <strong id="functional-summary-title">{t.functionalSummary}</strong>
                      <span>{t.boosterBasis}</span>
                    </div>
                    <div className={styles.summaryChips} aria-live="polite">
                      {functionShots[0].ingredients.map((ingredient) => <span key={ingredient[locale]}>{ingredient[locale]}</span>)}
                    </div>
                  </section>
                </div>
                <div className={`${styles.bottomPanel} ${styles.optionsFooter}`}>
                  <button type="button" className={styles.primaryButton} onClick={startDispensing}>{t.dispense}</button>
                </div>
              </section>
            )}

            {screen === "dispensing" && (
              <section className={`${styles.kioskScreen} ${styles.dispensingScreen}`} aria-labelledby="kiosk-dispensing-title">
                <div className={styles.dispensingStage}>
                  <div className={styles.dispensingMarks} aria-hidden="true">
                    <i className={dispensingProgress < 8 ? styles.dispensingMarkActive : styles.dispensingMarkComplete} />
                    <i className={styles.dispensingMarkBar}>
                      <span style={{ transform: `scaleX(${dispensingBarScale})` }} />
                    </i>
                    <i className={dispensingProgress >= 100 ? styles.dispensingMarkComplete : dispensingProgress >= 92 ? styles.dispensingMarkActive : undefined} />
                  </div>
                  <div className={styles.dispensingCopy}>
                    <div key={dispensingPhase} className={styles.dispensingCopyInner} aria-live="polite" aria-atomic="true">
                      <h3 id="kiosk-dispensing-title" ref={headingRef} tabIndex={-1}>{dispensingStatus.title}</h3>
                      <p>{dispensingStatus.subtitle}</p>
                    </div>
                  </div>
                  <div
                    className={styles.dispensingPercent}
                    role="progressbar"
                    aria-label={t.dispensingProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={dispensingProgress}
                  >
                    <span className={dispensingProgress >= 100 ? styles.dispensingSpinnerComplete : undefined} aria-hidden="true" />
                    <strong>{dispensingProgress}%</strong>
                  </div>
                </div>
              </section>
            )}

            {screen === "complete" && (
              <section className={`${styles.kioskScreen} ${styles.completionScreen}`} aria-labelledby="kiosk-completion-title">
                <header className={`${styles.kioskHeader} ${styles.completionHeader}`}>
                  <button type="button" onClick={resetDemo} aria-label={t.back}>
                    <Image src={withBasePath(`${figmaAssetRoot}/icon-back.svg`)} alt="" width={34} height={34} />
                  </button>
                </header>
                <div className={styles.completionBody}>
                  <div className={styles.completionCheck} aria-hidden="true">
                    <Image src={withBasePath(`${figmaAssetRoot}/completion-check.svg`)} alt="" width={84} height={84} />
                  </div>
                  <h3 id="kiosk-completion-title" ref={headingRef} tabIndex={-1}>{t.completionTitle}</h3>
                  <p><Lines value={t.completionSubtitle} /></p>
                </div>
                <div className={`${styles.bottomPanel} ${styles.completionFooter}`}>
                  <button type="button" className={styles.primaryButton} onClick={resetDemo}>{t.exit}</button>
                </div>
              </section>
            )}
            </div>
          </div>
        </div>
        {variant === "embedded" && <p className={styles.embeddedFootnote}>{t.embeddedNotice}</p>}
      </div>
    </div>
  );
}
