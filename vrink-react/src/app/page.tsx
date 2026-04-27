import Image from "next/image";
import Link from "next/link";

import { CookieSettingsPopup } from "@/components/consent/cookie-settings-popup";
import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { ShotNutritionSection } from "@/components/sections/shot-nutrition-section";
import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";

const productScenes = [
  {
    title: "선명한 제품 경험",
    body: "기기와 태블릿을 하나의 작업면에 배치해 누구나 같은 흐름으로 음료를 선택하고 제조할 수 있습니다.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "브링크 제로스테이션 상단과 태블릿 거치대",
  },
  {
    title: "공간에 맞는 설치감",
    body: "화이트와 메탈을 중심으로 정리된 외관은 오피스, 피트니스, 병원, 이벤트 공간에 자연스럽게 놓입니다.",
    image: "/images/vrink/apple/vrink-product-front.png",
    alt: "브링크 제로스테이션 정면",
  },
  {
    title: "운영을 고려한 구조",
    body: "음료 제조부, 배수부, 태블릿 거치부가 한 화면처럼 정리되어 관리와 사용이 단순해집니다.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "브링크 제로스테이션 상단 구조",
  },
];

const systemItems = [
  {
    label: "스마트 스테이션",
    title: "11초 안에 완성되는 한 잔",
    body: "350ml 기준 평균 11초 제조 흐름으로 장시간 운영 공간에서도 대기 부담을 줄입니다.",
  },
  {
    label: "맞춤 조합",
    title: "맛, 기능샷, 농도, 탄산 조합",
    body: "공간과 사용자 목적에 맞춰 약 1,750가지 조합으로 개인 맞춤 음료 경험을 제공합니다.",
  },
  {
    label: "운영 관리",
    title: "원액과 기기 관리를 함께",
    body: "잔량 확인, 자동 발송, 정기 점검 흐름을 묶어 운영자가 신경 쓸 일을 줄입니다.",
  },
];

const recipeSteps = [
  {
    title: "목적 선택",
    body: "운동 전, 업무 중, 회복, 데일리 관리처럼 공간에서 자주 쓰는 순간을 먼저 고릅니다.",
  },
  {
    title: "기능샷과 맛 조합",
    body: "부스터샷, 비타민샷, 릴렉스샷, 커팅샷, 아미노 샷과 플레이버를 조합합니다.",
  },
  {
    title: "농도와 탄산 조절",
    body: "은은하게 또는 진하게, 부드럽게 또는 탄산감 있게 같은 음료도 다르게 완성합니다.",
  },
];

const useCases = [
  ["피트니스", "운동 전후 루틴과 센터 차별화에 맞는 기능성 음료 경험"],
  ["오피스", "직원 복지와 라운지 사용성을 함께 높이는 상시 음료 스테이션"],
  ["병원·웰니스", "대기와 회복 사이에 가볍게 선택할 수 있는 건강한 음료 옵션"],
  ["이벤트·팝업", "방문자가 직접 고르고 경험하는 브랜드 접점"],
];

const lifestyleImages = [
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "브링크 음료 두 잔을 들고 있는 사용 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1094.jpg",
    alt: "브링크 음료를 마시는 사용 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1085.jpg",
    alt: "브링크 스테이션 앞에서 음료를 받는 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1198.jpg",
    alt: "브링크 스테이션 옆에서 음료를 마시는 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1193.jpg",
    alt: "태블릿 거치대와 함께 음료를 마시는 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1089.jpg",
    alt: "브링크 스테이션 앞에서 음료를 들고 미소 짓는 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1138.jpg",
    alt: "노란색과 초록색 음료를 비교하는 장면",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1124.jpg",
    alt: "브링크 음료 두 잔을 들고 선택하는 장면",
  },
];

const newsItems = [
  {
    title: "브링크, 기보벤처캠프 18기 선발…맞춤형 뉴트리션 기술력 인정",
    category: "언론 보도",
    source: "빌리어즈",
    date: "2026.04",
    body: "브링크의 개인 맞춤 뉴트리션 방향과 기술 창업 지원 프로그램 선발 소식을 소개한 기사입니다.",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    href: "https://www.thebilliards.kr/news/articleView.html?idxno=30505",
  },
  {
    title: "브링크, 스포츠 액셀러레이팅 선정…웰니스 음료로 피트니스 시장 공략",
    category: "언론 보도",
    source: "FT스포츠",
    date: "2026.04",
    body: "스포츠 액셀러레이팅 선정과 피트니스 시장 확장 방향을 다룬 기사입니다.",
    image: "/images/vrink/news/vrink-news-booth.jpg",
    href: "https://www.ftimes.kr/news/articleView.html?idxno=36836",
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <VrinkHeader variant="overlay" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>브링크 제로스테이션</p>
          <h1>공간마다 다르게 완성되는 한 잔.</h1>
          <span>
            맛, 기능샷, 농도, 탄산을 조합해 오피스, 피트니스, 병원, 이벤트 공간에 맞는 음료 경험을 제공합니다.
          </span>
          <div className={styles.heroActions}>
            <Link href="/product" className={styles.primaryButton}>더 알아보기</Link>
            <a href="#contact" className={styles.linkButton}>도입 문의</a>
          </div>
        </div>
        <div className={styles.heroMedia} aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={withBasePath("/images/vrink/apple/vrink-product-angle-a.png")}
          >
            <source src={withBasePath("/images/vrink/apple/vrink-hero.mp4")} type="video/mp4" />
          </video>
        </div>
      </section>

      <section id="product" className={styles.revealSection}>
        <div className={styles.sectionIntro}>
          <p>제품 경험</p>
          <h2>음료 스테이션을 하나의 제품 경험으로.</h2>
        </div>
        <div className={styles.sceneGrid}>
          {productScenes.map((scene) => (
            <article className={styles.sceneCard} key={scene.title}>
              <div className={styles.sceneImage}>
                <Image src={withBasePath(scene.image)} alt={scene.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <h3>{scene.title}</h3>
              <p>{scene.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.sectionIntro}>
          <p>운영 구조</p>
          <h2>설치부터 관리까지 한 흐름으로 이어집니다.</h2>
        </div>
        <div className={styles.systemGrid}>
          {systemItems.map((item) => (
            <article className={styles.systemItem} key={item.title}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="blend" className={styles.blendSection}>
        <div className={styles.blendCopy}>
          <p>맞춤 조합</p>
          <h2>선택은 간단하게, 조합은 풍부하게.</h2>
          <span>기능샷과 플레이버, 농도와 탄산을 더해 공간의 목적에 맞는 한 잔을 만듭니다.</span>
        </div>
        <div className={styles.blendSteps}>
          {recipeSteps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        <ShotNutritionSection />
      </section>

      <section id="experience" className={styles.lifestyleSection}>
        <div className={styles.sectionIntro}>
          <p>사용 장면</p>
          <h2>선택한 음료가 일상으로 이어지는 순간.</h2>
        </div>
        <div className={styles.lifestyleGrid}>
          {lifestyleImages.map((image, index) => (
            <figure
              className={`${styles.lifestyleTile} ${index === 0 ? styles.lifestyleTileLarge : ""}`}
              key={image.src}
            >
              <Image
                src={withBasePath(image.src)}
                alt={image.alt}
                fill
                sizes={index === 0 ? "(max-width: 980px) 100vw, 50vw" : "(max-width: 980px) 50vw, 25vw"}
              />
            </figure>
          ))}
        </div>
      </section>

      <section id="space" className={styles.useCaseSection}>
        <div className={styles.sectionIntro}>
          <p>적용 공간</p>
          <h2>하나의 기기, 여러 공간의 쓰임.</h2>
        </div>
        <div className={styles.useCaseGrid}>
          {useCases.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="operation" className={styles.operationSection}>
        <div className={styles.operationImage}>
          <Image
            src={withBasePath("/images/vrink/apple/vrink-product-back.png")}
            alt="브링크 제로스테이션 후면"
            fill
            sizes="(max-width: 900px) 100vw, 44vw"
          />
        </div>
        <div className={styles.operationCopy}>
          <p>운영 관리</p>
          <h2>운영자가 오래 쓰기 편한 구조.</h2>
          <span>
            정기 점검, 원액 공급, 소모품 지원, 유지보수 상담까지 공간 운영에 필요한 흐름을 함께 설계합니다.
          </span>
          <ul>
            <li>소진 시점 기준 원액 공급 상담</li>
            <li>전문 설치와 정기 관리 지원</li>
            <li>단기 행사와 장기 도입 모두 대응</li>
          </ul>
        </div>
      </section>

      <section id="news" className={styles.newsSection}>
        <div className={styles.sectionIntro}>
          <p>뉴스룸</p>
          <h2>브링크가 전해진 소식.</h2>
        </div>
        <div className={styles.newsFeature}>
          <div className={styles.newsFeatureImage}>
            <Image
              src={withBasePath(newsItems[0].image)}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
          <article className={styles.newsFeatureCopy}>
            <span>{`${newsItems[0].source} · ${newsItems[0].category} · ${newsItems[0].date}`}</span>
            <h3>{newsItems[0].title}</h3>
            <p>{newsItems[0].body}</p>
            <a href={newsItems[0].href} rel="noreferrer" target="_blank">기사 보기 ›</a>
          </article>
        </div>
        <div className={styles.newsGrid}>
          {newsItems.slice(1).map((item) => (
            <article key={item.title} className={styles.newsCard}>
              <div className={styles.newsCardImage}>
                <Image src={withBasePath(item.image)} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <div>
                <span>{`${item.source} · ${item.category} · ${item.date}`}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a href={item.href} rel="noreferrer" target="_blank">기사 보기 ›</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactCopy}>
          <p>문의</p>
          <h2>우리 공간에 맞는 브링크를 상담해보세요.</h2>
          <span>
            설치 환경, 예상 사용 인원, 운영 목적을 남겨주시면 브링크 팀이 확인 후 연락드립니다.
          </span>
        </div>
        <LeadForm />
      </section>

      <VrinkFooter ctaHref="/#contact" />
      <CookieSettingsPopup />
    </main>
  );
}
