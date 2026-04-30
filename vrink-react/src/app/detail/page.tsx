import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Droplets,
  Dumbbell,
  HeartPulse,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";
import { ExpertReviewBackgroundVideo } from "./expert-review-background-video";
import { ExpertReviewMoreModal } from "./expert-review-more-modal";
import { ShotShowcase } from "./shot-showcase";

export const metadata: Metadata = buildMetadata({
  title: "상세페이지",
  description: "브링크 제로스테이션의 도입 방식, 맞춤 음료 구성, 운영 관리 흐름을 소개합니다.",
  path: "/detail",
});

const metrics = [
  ["1,750", "매일 다르게 고르는 음료 조합"],
  ["15초", "기다림이 짧은 평균 제조 시간"],
  ["5종", "목적에 맞춰 제안하는 기능샷"],
  ["24H", "상시 운영 가능한 복지 스테이션"],
];

const storyItems = [
  {
    label: "고민",
    title: "커피와 탄산음료만으로는 부족한 순간",
    body: "직원과 방문객은 더 건강한 선택지를 원하지만, 운영자는 관리 부담 때문에 새로운 음료 복지를 쉽게 시작하기 어렵습니다.",
  },
  {
    label: "선택",
    title: "사용자가 직접 고르는 한 잔",
    body: "기능샷, 맛, 농도, 탄산을 고르면 약 15초 안에 공간 목적에 맞는 음료 경험이 완성됩니다.",
  },
  {
    label: "도입 후",
    title: "한 번 설치하면 계속 쓰이는 공간 자산",
    body: "브링크는 기기, 원액, 점검, 위생 관리 흐름을 함께 설계해 오래 운영되는 음료 스테이션으로 자리 잡게 합니다.",
  },
];

const plans = [
  {
    title: "구매형",
    summary: "장기 운영 공간에 맞춘 소유형 도입",
    price: "도입가 8,800,000원부터",
    values: ["기기 구매", "공간별 초기 세팅", "원액 공급 상담", "정기 점검 안내"],
  },
  {
    title: "렌탈형",
    summary: "초기 부담을 낮춘 월 운영형 구성",
    price: "월 조건별 맞춤 견적",
    values: ["렌탈 계약", "설치 조건 확인", "원액·소모품 운영", "A/S 상담"],
  },
  {
    title: "맞춤 운영형",
    summary: "사용량과 공간 목적에 맞춘 운영 설계",
    price: "공간 조건별 상담",
    values: ["이용량 기준 설계", "기능샷 구성 제안", "운영 동선 상담", "관리 기준 안내"],
  },
];

const spaces = [
  {
    icon: Building2,
    title: "오피스",
    body: "직원 복지, 라운지 경험, 방문객 응대를 위한 상시 음료 스테이션",
  },
  {
    icon: Dumbbell,
    title: "피트니스",
    body: "운동 전후 수분 보충과 기능샷 루틴을 자연스럽게 연결하는 공간 경험",
  },
  {
    icon: HeartPulse,
    title: "병원·웰니스",
    body: "대기와 회복 사이에 가볍게 선택할 수 있는 건강한 음료 옵션",
  },
  {
    icon: Sparkles,
    title: "행사·팝업",
    body: "방문자가 직접 고르고 마시는 체험형 브랜드 접점",
  },
];

const purchaseReasons = [
  ["복지 체감", "커피 외에 직접 고르는 건강 음료 선택지가 생깁니다."],
  ["방문 경험", "기다리는 시간과 운동 전후 루틴에 기억에 남는 접점을 만듭니다."],
  ["운영 부담 감소", "원액 공급과 점검 흐름을 함께 잡아 담당자의 관리 부담을 줄입니다."],
];

const operationItems = [
  {
    icon: Droplets,
    title: "원액 공급",
    body: "사용량과 잔량을 기준으로 원액 공급 흐름을 설계합니다.",
  },
  {
    icon: Wrench,
    title: "정기 점검",
    body: "기기 상태, 제조부, 소모품 흐름을 확인해 운영 기준을 유지합니다.",
  },
  {
    icon: ShieldCheck,
    title: "위생 관리",
    body: "필터 여과, 반자동 세척, 점검 안내로 안정적인 사용 환경을 돕습니다.",
  },
  {
    icon: Settings2,
    title: "운영 설정",
    body: "탄산량과 토출량을 공간 목적에 맞춰 세밀하게 조정합니다.",
  },
];

const technologyItems = [
  {
    title: "해바라기 밸브",
    body: "여러 원액 라인을 하나의 제조 지점으로 모아 기능샷과 플레이버가 안정적으로 토출되도록 설계한 핵심 구조입니다.",
  },
  {
    title: "링겔식 원액 교체",
    body: "원액 팩을 걸고 연결하는 방식으로 교체 흐름을 단순화해 운영자가 빠르고 위생적으로 관리할 수 있습니다.",
  },
  {
    title: "0.1초 단위 토출 설정",
    body: "시럽, 기주, 탄산량을 세밀하게 조정해 공간별 메뉴와 맛 기준을 안정적으로 맞춥니다.",
  },
];

const proofItems = [
  ["기보벤처캠프 18기 선발", "개인 맞춤 뉴트리션 방향과 기술 창업 역량을 인정받았습니다."],
  ["스포츠 액셀러레이팅 선정", "피트니스와 웰니스 시장에 맞춘 기능성 음료 운영 가능성을 검증했습니다."],
  ["현장 체험 운영", "전시와 팝업, 기업 공간에서 사용자가 직접 조합하고 마시는 경험을 만들 수 있습니다."],
];

const processItems = [
  ["01", "도입 문의", "공간과 운영 목적을 남겨주세요."],
  ["02", "조건 확인", "전원, 급배수, 동선, 예상 사용량을 확인합니다."],
  ["03", "구성 제안", "구매·렌탈 방식과 기능샷 구성을 함께 검토합니다."],
  ["04", "설치 안내", "일정에 맞춰 설치와 기본 사용 안내를 진행합니다."],
  ["05", "운영 관리", "원액 공급, 점검, A/S 상담 흐름을 이어갑니다."],
];

const faqItems = [
  [
    "어떤 공간에 설치할 수 있나요?",
    "오피스, 피트니스, 병원·웰니스, 행사·팝업처럼 음료 경험과 운영 효율이 중요한 공간에 맞춰 상담합니다.",
  ],
  [
    "구매와 렌탈 모두 가능한가요?",
    "운영 기간, 예상 사용량, 설치 환경에 따라 구매형과 렌탈형을 함께 검토할 수 있습니다.",
  ],
  [
    "전원과 급배수 조건은 어떻게 확인하나요?",
    "상담 과정에서 설치 위치, 전원, 급배수 가능 여부, 사용자 동선을 확인한 뒤 적합한 구성을 안내합니다.",
  ],
  [
    "원액은 어떻게 교체하나요?",
    "링겔식 원액 교체 구조를 활용해 원액 팩을 걸고 연결하는 방식으로 빠르고 위생적인 교체가 가능합니다.",
  ],
  [
    "평균 제조 시간은 얼마나 걸리나요?",
    "350ml 기준 평균 약 15초 흐름으로 한 잔을 제조하도록 설계되어 있습니다.",
  ],
  [
    "기능샷 구성은 바꿀 수 있나요?",
    "공간의 목적과 사용자 선호에 맞춰 부스터샷, 릴렉스샷, 커팅샷, 아미노샷, 비타민샷 구성을 상담할 수 있습니다.",
  ],
];

export default function DetailPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

      <div className={styles.noticeBar}>
        <p>공간 맞춤 도입 상담 진행 중</p>
        <Link href="#consult">
          견적 받기
          <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
        </Link>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>브링크 제로스테이션</p>
          <h1>공간마다 다르게 완성되는 한 잔.</h1>
          <span>구매·렌탈 상담부터 설치와 운영 관리까지.</span>
          <strong>
            맛, 기능샷, 농도, 탄산을 조합해 오피스·피트니스·웰니스 공간에 맞는 음료 경험을 제공합니다.
          </strong>
          <div className={styles.heroActions}>
            <Link href="#consult" className={styles.primaryButton}>
              도입 상담
            </Link>
            <Link href="#composition" className={styles.secondaryButton}>
              상품 구성 보기
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual} style={{ position: "relative" }}>
          <Image
            src={withBasePath("/images/vrink/detail/vrink-hero-product.png")}
            alt="브링크 제로스테이션 제품 이미지"
            fill
            priority
            sizes="100vw"
          />
        </div>
      </section>

      <section className={styles.metricsSection} aria-label="브링크 핵심 수치">
        {metrics.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className={styles.storySection}>
        <div className={styles.sectionHeader}>
          <p>도입 이유</p>
          <h2>음료 하나가 공간에 머무는 이유가 됩니다.</h2>
          <span>새로운 복지와 방문 경험을 만들면서도, 운영자가 감당할 수 있는 방식으로 설계합니다.</span>
        </div>
        <div className={styles.storyMedia} style={{ position: "relative" }}>
          <Image
            src={withBasePath("/images/vrink/detail/vrink-experience.jpg")}
            alt="브링크 부스에서 제품을 설명하고 있는 모습"
            fill
            sizes="(max-width: 900px) 100vw, 1180px"
          />
        </div>
        <div className={styles.storyTrack}>
          {storyItems.map((item) => (
            <article key={item.label}>
              <p>{item.label}</p>
              <h3>{item.title}</h3>
              <span>{item.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="composition" className={styles.compositionSection}>
        <div className={styles.sectionHeader}>
          <p>기능샷 구성</p>
          <h2>목적에 맞춰 고르는 브링크 기능샷.</h2>
          <span>공간과 사용자 상태에 맞춰 샷을 선택하고, 필요한 성분은 카드에서 바로 확인합니다.</span>
        </div>
        <ShotShowcase />
      </section>

      <section id="expert-review" className={styles.expertReviewSection}>
        <div className={styles.expertReviewFrame}>
          <div className={styles.expertReviewVideo} aria-hidden="true">
            <ExpertReviewBackgroundVideo
              poster={withBasePath("/images/vrink/detail/expert-review-background-0428-poster.jpg")}
              src={withBasePath("/videos/vrink/expert-review-background-0428.mp4")}
            />
          </div>
          <div className={styles.expertReviewCopy}>
            <p>전문가 검수 기반 음료 구성</p>
            <h2>영양사의 영양 관점으로 기능샷 구성을 다듬었습니다.</h2>
            <span>
              브링크는 기능샷별 성분 조합과 일상에서 선택하는 상황을 영양 관점으로 검토해, 공간에 맞는
              음료 루틴을 더 신뢰감 있게 제안합니다.
            </span>
            <ExpertReviewMoreModal
              poster={withBasePath("/images/vrink/detail/nutritionist-interview-poster.jpg")}
              src={withBasePath("/videos/vrink/nutritionist-interview-1080p-h264.mp4")}
            />
          </div>
        </div>
      </section>

      <section className={styles.purchaseCueSection}>
        <div className={styles.purchaseVideo}>
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={withBasePath("/images/vrink/detail/vrink-experience.jpg")}
          >
            <source src={withBasePath("/images/vrink/detail/vrink-usage-demo.mp4")} type="video/mp4" />
          </video>
        </div>
        <div className={styles.purchaseCueContent}>
          <div className={styles.purchaseCueCopy}>
            <p>사용자가 다시 찾는 이유</p>
            <h2>직접 고르는 과정이, 한 잔의 만족을 더 크게 만듭니다.</h2>
            <span>브링크는 음료를 제공하는 데서 끝나지 않고, 공간 안에서 반복되는 작은 경험을 만듭니다.</span>
          </div>
          <div className={styles.purchaseReasonList}>
            {purchaseReasons.map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className={styles.planSection}>
        <div className={styles.sectionHeader}>
          <p>도입 방식</p>
          <h2>공간 조건에 맞춰 구매와 렌탈 구성을 상담합니다.</h2>
          <span>초기 비용, 운영 기간, 예상 사용량에 따라 적합한 도입 방식을 함께 검토합니다.</span>
        </div>
        <div className={styles.offerLine}>
          <p>도입 상담에서 설치 조건, 구매·렌탈 견적, 기능샷 구성을 한 번에 확인할 수 있습니다.</p>
          <Link href="#consult">견적 문의하기</Link>
        </div>
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <article className={styles.planCard} key={plan.title}>
              <div>
                <p>{plan.title}</p>
                <h3>{plan.summary}</h3>
                <strong>{plan.price}</strong>
              </div>
              <ul>
                {plan.values.map((value) => (
                  <li key={value}>
                    <Check aria-hidden="true" size={16} strokeWidth={1.8} />
                    {value}
                  </li>
                ))}
              </ul>
              <Link href="#consult">상담하기</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.spaceSection}>
        <div className={styles.sectionHeader}>
          <p>설치 공간</p>
          <h2>브링크는 공간의 목적에 맞춰 다른 음료 경험을 만듭니다.</h2>
        </div>
        <div className={styles.spaceList}>
          {spaces.map((space) => {
            const Icon = space.icon;

            return (
              <article key={space.title}>
                <Icon aria-hidden="true" size={26} strokeWidth={1.7} />
                <h3>{space.title}</h3>
                <p>{space.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="operation" className={styles.operationSection}>
        <div className={styles.operationIntro}>
          <p>운영 관리</p>
          <h2>기기만 설치하는 것이 아니라, 오래 운영되도록 관리 흐름까지 설계합니다.</h2>
          <span>원액, 소모품, 위생, 점검 기준을 함께 잡아 운영자의 부담을 줄입니다.</span>
        </div>
        <div className={styles.operationGrid}>
          {operationItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title}>
                <Icon aria-hidden="true" size={25} strokeWidth={1.7} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="technology" className={styles.technologySection}>
        <div className={styles.techVisual} style={{ position: "relative" }}>
          <Image
            src={withBasePath("/images/vrink/detail/vrink-detail-texture.png")}
            alt="브링크 제로스테이션 스테인리스 상판 디테일"
            fill
            sizes="(max-width: 1080px) 100vw, 42vw"
          />
        </div>
        <div className={styles.techCopy}>
          <p>기술 신뢰</p>
          <h2>맛과 기능샷이 안정적으로 섞이고, 운영자가 쉽게 관리할 수 있도록 구조부터 설계했습니다.</h2>
          <div className={styles.techList}>
            {technologyItems.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.proofSection}>
        <div className={styles.sectionHeader}>
          <p>검증</p>
          <h2>브링크는 현장에서 검토되고 있는 새로운 음료 운영 시스템입니다.</h2>
        </div>
        <div className={styles.proofMedia} style={{ position: "relative" }}>
          <Image
            src={withBasePath("/images/vrink/detail/vrink-field-crowd.jpg")}
            alt="현장에서 브링크 음료를 체험하는 방문객들"
            fill
            sizes="(max-width: 900px) 100vw, 1180px"
          />
        </div>
        <div className={styles.proofGrid}>
          {proofItems.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.processSection}>
        <div className={styles.sectionHeader}>
          <p>도입 프로세스</p>
          <h2>상담부터 운영 관리까지 한 흐름으로 진행합니다.</h2>
        </div>
        <ol className={styles.processList}>
          {processItems.map(([step, title, body]) => (
            <li key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="faq" className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <p>자주 묻는 질문</p>
          <h2>도입 전 확인할 질문을 먼저 정리했습니다.</h2>
        </div>
        <div className={styles.faqList}>
          {faqItems.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="consult" className={styles.consultSection}>
        <div className={styles.consultCopy}>
          <p>도입 상담</p>
          <h2>우리 공간에 맞는 브링크 구성을 상담해보세요.</h2>
          <span>설치 환경, 예상 사용 인원, 운영 목적을 남겨주시면 브링크 팀이 확인 후 연락드립니다.</span>
        </div>
        <div className={styles.formWrap}>
          <LeadForm />
        </div>
      </section>

      <div className={styles.purchaseBar} aria-label="브링크 도입 상담 바로가기">
        <div>
          <span>브링크 제로스테이션</span>
          <strong>도입가 8,800,000원부터 · 구매/렌탈 상담 가능</strong>
        </div>
        <Link href="#consult">견적 받기</Link>
      </div>

      <VrinkFooter ctaHref="/detail#consult" />
    </main>
  );
}
