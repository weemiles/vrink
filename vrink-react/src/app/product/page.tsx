import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headphones, ShieldCheck, Wrench } from "lucide-react";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";
import { withBasePath } from "@/lib/static-export";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "제품 소개",
  description: "브링크 제로스테이션의 제품 구조, 맞춤 조합, 운영 관리 흐름을 소개합니다.",
  path: "/product",
});

const features = [
  {
    title: "하나의 작업면에서 끝나는 선택",
    body: "태블릿에서 목적과 맛을 고르고, 바로 옆 스테이션에서 한 잔이 완성됩니다. 처음 사용하는 사람도 같은 흐름으로 자연스럽게 이용할 수 있습니다.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "브링크 제로스테이션 상단과 태블릿 거치대",
  },
  {
    title: "11초 안에 완성되는 제조 흐름",
    body: "350ml 기준 평균 11초 제조 흐름으로 오피스, 피트니스, 행사 공간처럼 사용자가 많은 환경에서도 대기 부담을 줄입니다.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "브링크 제로스테이션 상단 구조",
  },
  {
    title: "기능샷과 맛을 조합하는 개인 맞춤 경험",
    body: "부스터샷, 비타민샷, 릴렉스샷, 커팅샷, 아미노 샷과 플레이버, 농도, 탄산을 조합해 공간의 목적에 맞는 음료 경험을 제공합니다.",
    image: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "브링크 음료 두 잔을 들고 있는 사용 장면",
  },
  {
    title: "운영자를 위한 관리 구조",
    body: "원액 공급, 소모품, 정기 점검, 위생 관리 흐름을 함께 설계해 도입 이후에도 안정적으로 운영할 수 있도록 돕습니다.",
    image: "/images/vrink/apple/vrink-product-back.png",
    alt: "브링크 제로스테이션 후면",
  },
];

const mobileFeatureStats = [
  {
    value: "11초",
    label: "평균 제조 시간",
  },
  {
    value: "2,000ml",
    label: "탄산수 토출 용량",
  },
  {
    value: "24H",
    label: "운영 가능",
  },
  {
    value: "0.1초",
    label: "커스텀 설정 단위",
  },
];

const mobileFeatureNav = [
  ["개요", "#features"],
  ["사양", "#specifications"],
  ["기술", "#technology"],
  ["문의", "/#contact"],
];

const productIntroTiles = [
  {
    eyebrow: "Personal Recipe",
    title: "취향과 컨디션에 맞춘 한 잔",
    body: "기능샷, 플레이버, 농도, 탄산을 조합해 사용자의 목적에 맞는 음료 경험을 만듭니다.",
    image: "/images/vrink/lifestyle/vrink-lifestyle-1198.jpg",
    alt: "브링크 제로스테이션에서 음료를 마시는 사용자",
  },
  {
    eyebrow: "Fast Serving",
    title: "약 11초, 빠르게 완성되는 제조 흐름",
    body: "350ml 기준 평균 약 11초 제조 흐름으로 많은 사용자가 오가는 공간에서도 부담을 줄입니다.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "브링크 제로스테이션 상단 제조 구조",
  },
  {
    eyebrow: "Station Design",
    title: "하나의 작업면에서 이어지는 선택과 제조",
    body: "태블릿 선택 화면과 제조부가 한 작업면에 놓여 처음 쓰는 사람도 직관적으로 사용할 수 있습니다.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "브링크 제로스테이션 작업면과 태블릿",
  },
  {
    eyebrow: "Operation Care",
    title: "원액과 위생, 정기 점검까지 설계된 운영 구조",
    body: "도입 이후의 원액 공급, 소모품 관리, 위생 점검 흐름까지 함께 설계합니다.",
    image: "/images/vrink/apple/vrink-product-back.png",
    alt: "브링크 제로스테이션 후면",
  },
];

const galleryMoments = [
  {
    image: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "브링크 음료를 든 사용자",
  },
  {
    image: "/images/vrink/lifestyle/vrink-lifestyle-1094.jpg",
    alt: "브링크 음료를 들고 있는 라이프스타일 장면",
  },
  {
    image: "/images/vrink/lifestyle/vrink-lifestyle-1138.jpg",
    alt: "브링크 제로스테이션 사용 장면",
  },
];

const proofStories = [
  {
    title: "공간 운영을 위한 스마트 음료 시스템",
    body: "브링크는 음료 제공을 넘어 복지, 체험, 운영 관리까지 연결하는 공간 맞춤 솔루션을 제안합니다.",
    image: "/images/vrink/news/vrink-news-consulting.jpg",
    alt: "브링크 상담 및 운영 소개 장면",
  },
  {
    title: "현장에서 바로 경험하는 제로스테이션",
    body: "전시와 팝업, 기업 공간에서 사용자가 직접 조합하고 마시는 경험을 만들 수 있습니다.",
    image: "/images/vrink/news/vrink-news-booth.jpg",
    alt: "브링크 전시 부스 현장",
  },
];

const technologyItems = [
  {
    number: "01",
    title: "해바라기 밸브",
    body: "여러 원액 라인을 하나의 제조 지점으로 모아, 기능샷과 플레이버가 안정적으로 토출되도록 설계한 브링크의 핵심 밸브 구조입니다.",
  },
  {
    number: "02",
    title: "링겔식 원액 교체",
    body: "운영자가 원액을 빠르고 위생적으로 교체할 수 있도록, 원액 팩을 걸고 연결하는 방식의 교체 흐름을 적용했습니다.",
  },
];

const technologyVisualImages = [
  {
    src: "/images/vrink/technology/sunflower-valve.png",
    alt: "해바라기 밸브 구조 이미지",
    className: `${styles.technologyImage} ${styles.technologyImagePrimary}`,
  },
  {
    src: "/images/vrink/technology/iv-replacement.png",
    alt: "링겔식 원액 교체 이미지",
    className: `${styles.technologyImage} ${styles.technologyImageSecondary}`,
  },
];

const fieldCards = [
  {
    title: "오피스",
    body: "직원 복지와 방문객 응대를 위한 상시 음료 경험",
    image: "/images/vrink/lifestyle/vrink-office.jpg",
    alt: "오피스에 어울리는 브링크 음료 장면",
  },
  {
    title: "피트니스",
    body: "운동 전후 목적에 맞춘 기능샷과 수분 보충 루틴",
    image: "/images/vrink/lifestyle/vrink-fitness.png",
    alt: "피트니스 공간에서 브링크 음료를 마시는 사용자",
  },
  {
    title: "이벤트",
    body: "브랜드 체험과 현장 참여를 높이는 맞춤 제조 경험",
    image: "/images/vrink/news/ftimes-36836.jpg",
    alt: "브링크 이벤트 소개 이미지",
  },
];

const serviceItems = [
  {
    icon: Headphones,
    title: "도입 상담",
    body: "공간 목적과 예상 이용량에 맞춰 설치 구성을 제안합니다.",
  },
  {
    icon: Wrench,
    title: "운영 지원",
    body: "원액 공급과 소모품 관리 흐름을 함께 설계합니다.",
  },
  {
    icon: ShieldCheck,
    title: "정기 점검",
    body: "위생과 기기 상태를 안정적으로 관리할 수 있도록 돕습니다.",
  },
];

const productSpecs = [
  {
    label: "제품 구성",
    values: ["기능성 음료 머신 본체", "시럽 및 가스통 수납용 하부장"],
  },
  {
    label: "운영 시간",
    values: ["24시간 운영 가능"],
  },
  {
    label: "메뉴 개수",
    values: ["수십 가지 메뉴 등록 및 제조 가능"],
  },
  {
    label: "제조 시간",
    values: ["1잔 평균 약 10초", "320ml 잔 기준"],
  },
  {
    label: "정격 전압",
    values: ["탄산수 머신: AC220V / 60Hz / 0.7A", "기능성 음료 디스펜서: DC24V / 5A"],
  },
  {
    label: "토출 용량",
    values: ["1회 토출 가능한 탄산수 용량 약 2,000ml", "출수압에 따라 상이"],
  },
  {
    label: "세척 기능",
    values: ["반자동 세척 기능"],
  },
  {
    label: "메뉴 커스텀 기능",
    values: ["시럽 / 기주 토출량 조절", "탄산량 조절", "0.1초 단위 설정"],
  },
  {
    label: "냉각 온도",
    values: ["2°C ~ 6°C"],
  },
  {
    label: "제조국",
    values: ["대한민국"],
  },
];

const finalHighlights = [
  "11초 제조",
  "약 1,750가지 조합",
  "5종 기능샷",
  "맞춤 원액 구성",
  "정기 점검 지원",
  "오피스·피트니스·행사 도입",
];

export default function ProductPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>브링크 제로스테이션</p>
          <h1>공간에 맞춰 완성되는 스마트 드링크 시스템</h1>
          <span>
            선택, 제조, 관리 흐름을 하나로 묶어 오피스와 피트니스, 이벤트 공간에 맞는 음료 경험을 만듭니다.
          </span>
          <div className={styles.heroActions}>
            <Link href="/#contact" className={styles.primaryButton}>
              도입 문의
            </Link>
            <Link href="#features" className={styles.linkButton}>
              특징 보기
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Image
            src={withBasePath("/images/vrink/apple/vrink-product-angle-b.png")}
            alt="브링크 제로스테이션 제품"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 62vw"
          />
        </div>
      </section>

      <section id="features" className={styles.productIntroSection} aria-labelledby="product-intro-title">
        <div className={styles.productIntroCopy}>
          <h2 id="product-intro-title">
            브링크 제로스테이션은 선택, 제조, 관리가 한 화면에서 이어지는 스마트 드링크 시스템입니다.
            기능샷과 맛, 농도, 탄산을 조합해 공간마다 다른 음료 경험을 안정적으로 제공합니다.
          </h2>
        </div>
        <div className={styles.productIntroGrid}>
          {productIntroTiles.map((tile, index) => (
            <article className={styles.productIntroTile} key={tile.title}>
              <Image
                src={withBasePath(tile.image)}
                alt={tile.alt}
                fill
                loading={index < 2 ? "eager" : "lazy"}
                sizes="(max-width: 980px) 100vw, 50vw"
              />
              <div className={styles.productIntroTileCopy}>
                <p>{tile.eyebrow}</p>
                <h3>{tile.title}</h3>
                <span>{tile.body}</span>
                <Link href="/#contact">
                  상담하기
                  <ArrowRight aria-hidden="true" size={15} strokeWidth={1.8} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.gallerySection} aria-labelledby="gallery-title">
        <div className={styles.galleryCopy}>
          <p>Scene</p>
          <h2 id="gallery-title">브링크가 놓이는 순간, 공간은 더 자주 머무는 경험이 됩니다.</h2>
        </div>
        <div className={styles.galleryGrid}>
          {galleryMoments.map((moment) => (
            <figure className={styles.galleryItem} key={moment.image}>
              <Image src={withBasePath(moment.image)} alt={moment.alt} fill sizes="(max-width: 780px) 100vw, 33vw" />
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.proofSection} aria-labelledby="proof-title">
        <div className={styles.sectionHeading}>
          <p>Innovation</p>
          <h2 id="proof-title">공간 운영의 앞단에서, 새로운 음료 경험을 설계합니다.</h2>
          <span>전시, 상담, 실제 사용 장면까지 이어지는 브링크의 운영 방식을 소개합니다.</span>
        </div>
        <div className={styles.proofGrid}>
          {proofStories.map((story) => (
            <article className={styles.proofCard} key={story.title}>
              <div className={styles.proofImage}>
                <Image src={withBasePath(story.image)} alt={story.alt} fill sizes="(max-width: 760px) 100vw, 38vw" />
              </div>
              <div>
                <h3>{story.title}</h3>
                <p>{story.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="technology" className={styles.technologySection} aria-labelledby="technology-title">
        <div className={styles.technologyHeader}>
          <p>Technology</p>
          <h2 id="technology-title">브링크가 가진 기술력을 구조로 보여줍니다.</h2>
          <span>제조 안정성과 운영 편의성을 높이기 위해 설계한 핵심 기술입니다.</span>
        </div>
        <div className={styles.technologyShowcase}>
          <div className={styles.technologyList}>
            {technologyItems.map((item) => (
              <article className={styles.technologyItem} key={item.title}>
                <p>{item.number}</p>
                <h3>{item.title}</h3>
                <span>{item.body}</span>
              </article>
            ))}
          </div>
          <div className={styles.technologyVisual}>
            {technologyVisualImages.map((image) => (
              <Image
                src={withBasePath(image.src)}
                alt={image.alt}
                className={image.className}
                fill
                key={image.src}
                sizes="(max-width: 980px) 100vw, 58vw"
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.fieldSection} aria-labelledby="field-title">
        <div className={styles.sectionHeading}>
          <p>Fields</p>
          <h2 id="field-title">공간마다 다른 목적에 맞춰 구성합니다.</h2>
        </div>
        <div className={styles.fieldGrid}>
          {fieldCards.map((field) => (
            <article className={styles.fieldCard} key={field.title}>
              <Image src={withBasePath(field.image)} alt={field.alt} fill sizes="(max-width: 760px) 100vw, 31vw" />
              <div>
                <h3>{field.title}</h3>
                <p>{field.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.featureStack} aria-label="브링크 제품 특징">
        <div className={styles.mobileFeatureHeader}>
          <div className={styles.mobileFeatureTop}>
            <h2>VRINK ZERO STATION</h2>
            <Link href="/#contact">문의하기</Link>
          </div>
          <nav className={styles.mobileFeatureNav} aria-label="제품 상세 메뉴">
            {mobileFeatureNav.map(([label, href], index) => (
              <Link href={href} key={label} aria-current={index === 0 ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.mobileFeatureStats} aria-label="제품 핵심 수치">
          {mobileFeatureStats.map((item) => (
            <div className={styles.mobileFeatureStat} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        {features.map((feature, index) => (
          <article className={styles.featureRow} key={feature.title}>
            <div className={styles.featureImage}>
              <Image
                src={withBasePath(feature.image)}
                alt={feature.alt}
                fill
                sizes="(max-width: 980px) 100vw, 52vw"
              />
            </div>
            <div className={styles.featureCopy}>
              <p>{String(index + 1).padStart(2, "0")}</p>
              <h2>{feature.title}</h2>
              <span>{feature.body}</span>
            </div>
          </article>
        ))}
      </section>

      <section id="specifications" className={styles.specSection} aria-labelledby="spec-title">
        <div className={styles.specInner}>
          <h2 id="spec-title">제품 사양을 한눈에 확인해보세요</h2>
          <div className={styles.specHeader}>
            <p>제품 사양</p>
          </div>
          <div className={styles.specGrid}>
            {productSpecs.map((item) => (
              <article className={styles.specItem} key={item.label}>
                <h3>{item.label}</h3>
                <div>
                  {item.values.map((value) => (
                    <p key={value}>{value}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className={styles.specNote}>제품 사양과 구성은 설치 환경 및 운영 조건에 따라 일부 조정될 수 있습니다.</p>
        </div>
      </section>

      <section className={styles.serviceStrip} aria-label="브링크 도입 지원">
        {serviceItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title}>
              <Icon aria-hidden="true" size={26} strokeWidth={1.65} />
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.finalProductSection} aria-labelledby="final-product-title">
        <div className={styles.finalProductCopy}>
          <p>브링크 제로스테이션</p>
          <h2 id="final-product-title">VRINK ZERO STATION</h2>
          <span>공간에 맞춰 물, 탄산, 기능샷을 한 번에 제공하는 스마트 드링크 시스템.</span>
        </div>
        <div className={styles.finalProductImage}>
          <Image
            src={withBasePath("/images/vrink/apple/vrink-product-angle-a.png")}
            alt="브링크 제로스테이션 제품 이미지"
            fill
            sizes="(max-width: 900px) 100vw, 860px"
          />
        </div>
        <ul className={styles.finalProductFeatures} aria-label="제품 핵심 특징">
          {finalHighlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
        <div className={styles.finalProductPurchase}>
          <p>
            <span>도입가</span>
            <strong>8,800,000원</strong>
          </p>
          <Link href="/#contact">도입문의</Link>
        </div>
      </section>

      <VrinkFooter ctaHref="/support#inquiry" />
    </main>
  );
}
