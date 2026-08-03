import Image from "next/image";
import Link from "next/link";

import { CookieSettingsPopup } from "@/components/consent/cookie-settings-popup";
import { ActualKioskDemo } from "@/components/experience/actual-kiosk-demo";
import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { IntroOfferModal } from "@/components/promotions/intro-offer-modal";
import { LifestyleShowcase } from "@/components/sections/lifestyle-showcase";
import { PartnerLogoMarquee } from "@/components/sections/partner-logo-marquee";
import { ShotNutritionSection } from "@/components/sections/shot-nutrition-section";
import { withBasePath } from "@/lib/static-export";

import { ExpertReviewBackgroundVideo } from "./detail/expert-review-background-video";
import { ExpertReviewMoreModal } from "./detail/expert-review-more-modal";
import styles from "./page.module.css";

const productScenes = [
  {
    title: "태블릿에서 고르고, 바로 옆에서 받기",
    body: "태블릿에서 맛과 기능을 고르면 바로 옆 디스펜서에서 한 잔이 완성됩니다. 처음 이용해도 순서가 직관적입니다.",
    image: "/images/vrink/apple/vrink-product-angle-a.png",
    alt: "브링크 제로스테이션 상단과 태블릿 거치대",
  },
  {
    title: "어떤 공간에도 자연스럽게",
    body: "화이트와 메탈 중심의 절제된 외관으로 오피스, 피트니스, 병원, 행사장 어디에나 부담 없이 어울립니다.",
    image: "/images/vrink/apple/vrink-product-front.png",
    alt: "브링크 제로스테이션 정면",
  },
  {
    title: "사용도, 관리도 간단하게",
    body: "제조부와 배수부, 태블릿 거치대를 한 구조로 정리해 이용과 점검을 모두 간단하게 만들었습니다.",
    image: "/images/vrink/apple/vrink-product-top.png",
    alt: "브링크 제로스테이션 상단 구조",
  },
];

const systemItems = [
  {
    label: "스마트 스테이션",
    title: "350ml 한 잔, 평균 15초",
    body: "사용자가 많은 공간에서도 짧은 대기 흐름으로 음료를 받을 수 있게 설계했습니다.",
  },
  {
    label: "맞춤 조합",
    title: "5종 기능샷과 약 1,792가지 조합",
    body: "기능샷, 맛, 농도, 탄산을 조합해 공간과 사용자 목적에 맞는 한 잔을 만듭니다.",
  },
  {
    label: "운영 관리",
    title: "원액과 점검을 함께 관리",
    body: "잔량 확인, 주문 안내, 정기 점검 흐름을 묶어 운영자가 챙길 일을 줄입니다.",
  },
];

const adminScreenshots = [
  {
    title: "실시간 운영 대시보드",
    body: "회원, 주문, 매출, 이슈 현황을 한 화면에서 확인합니다.",
    image: "/images/vrink/admin/dashboard-masked.png",
    alt: "지점명이 가려진 브링크 관리자 대시보드 화면",
  },
  {
    title: "자사몰 주문 관리",
    body: "운영 소모품 주문과 배송 흐름을 관리자 화면에서 이어갑니다.",
    image: "/images/vrink/admin/own-mall-masked.png",
    alt: "지점명이 가려진 브링크 관리자 자사몰 화면",
  },
  {
    title: "매출 분석",
    body: "기간별 매출, 옵션 비중, 시간대별 주문 흐름을 비교합니다.",
    image: "/images/vrink/admin/sales-masked.png",
    alt: "지점명이 가려진 브링크 관리자 매출 분석 화면",
  },
];

const useCases = [
  ["피트니스", "운동 전후에 바로 고르는 기능샷 루틴"],
  ["오피스", "직원과 방문객이 함께 쓰는 상시 음료 스테이션"],
  ["병원·웰니스", "대기 시간에 가볍게 고르는 제로 당류 음료 옵션"],
  ["이벤트·팝업", "방문자가 직접 고르고 마시는 체험 접점"],
];

const welfareComparisons = [
  {
    label: "음료 복지 방식",
    before: "박스로 사두는 음료 복지는 보관, 유통기한, 폐기까지 계속 관리해야 합니다",
    after: "필요한 순간 한 잔씩 만들고, 직원이 맛과 기능샷을 직접 고릅니다",
  },
  {
    label: "직원 건강복지",
    before: "선택지는 적고 당류 높은 음료에 머물기 쉬워요",
    after: "제로 당류 베이스에 맛, 탄산, 기능샷을 직접 골라요",
  },
  {
    label: "기업 비용",
    before: "마신 만큼보다 사둔 만큼 먼저 지출돼요",
    after: "필요한 순간 한 잔씩 만들어 재고 비용을 줄여요",
  },
  {
    label: "재고 사이즈",
    before: "박스 보관 공간과 유통기한을 계속 확인해요",
    after: "개별 음료 재고를 줄이고 원액 중심으로 관리해요",
  },
  {
    label: "폐기 부담",
    before: "빈 병·캔과 지난 음료가 폐기 비용으로 남아요",
    after: "분리배출과 폐기물 처리 부담을 줄여요",
  },
  {
    label: "운영 관리",
    before: "구매, 보충, 정리까지 매번 챙겨야 해요",
    after: "한 대의 스테이션으로 음료 복지를 운영해요",
  },
];

const lifestyleImages = [
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1114.jpg",
    alt: "브링크 음료 두 잔을 들고 있는 사용 장면",
    position: "center 38%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1094.jpg",
    alt: "브링크 음료를 마시는 사용 장면",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1085.jpg",
    alt: "브링크 스테이션 앞에서 음료를 받는 장면",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1198.jpg",
    alt: "브링크 스테이션 옆에서 음료를 마시는 장면",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1193.jpg",
    alt: "태블릿 거치대와 함께 음료를 마시는 장면",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1089.jpg",
    alt: "브링크 스테이션 앞에서 음료를 들고 미소 짓는 장면",
    position: "center 42%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1138.jpg",
    alt: "노란색과 초록색 음료를 비교하는 장면",
    position: "center 40%",
  },
  {
    src: "/images/vrink/lifestyle/vrink-lifestyle-1124.jpg",
    alt: "브링크 음료 두 잔을 들고 선택하는 장면",
    position: "center 40%",
  },
];

const newsItems = [
  {
    title: "개인맞춤 영양 디스펜싱 플랫폼 ‘브링크’, CNT테크 투자 유치 확정…출시 3개월 만에 50개사 계약",
    category: "언론 보도",
    source: "한국목재신문",
    date: "2026.07",
    body: "개인맞춤 영양 추천과 무인 정밀 디스펜싱 플랫폼, 출시 3개월 내 50개사 계약 및 CNT테크 투자 유치 소식을 다룬 기사입니다.",
    image: "/images/vrink/news/cnt-tech-investment-20260731.jpg",
    href: "https://www.woodkorea.co.kr/news/articleView.html?idxno=90580",
  },
  {
    title: "브링크, CNT테크 투자 유치···출시 3개월 만에 50개 고객사 확보",
    category: "언론 보도",
    source: "이넷뉴스",
    date: "2026.07",
    body: "CNT테크 투자 유치와 공식 출시 후 3개월 만의 50개 고객사 확보 성과를 소개한 기사입니다.",
    image: "/images/vrink/news/cnt-tech-investment-20260731.jpg",
    href: "https://www.enetnews.co.kr/news/articleView.html?idxno=52979",
  },
  {
    title: "브링크, CNT스타디움 유망 스포츠 스타트업 최종 선정",
    category: "언론 보도",
    source: "전자신문",
    date: "2026.04",
    body: "브링크가 2026 스포츠 액셀러레이팅 프로그램 CNT스타디움 최종 선정기업으로 소개된 기사입니다.",
    image: "/images/vrink/news/etnews-cnt-stadium-20260430.jpg",
    href: "https://n.news.naver.com/article/030/0003423393?sid=101",
  },
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
          <h1>15초 만에 고르는 우리 공간의 한 잔.</h1>
          <span>
            5종 기능샷과 맛, 농도, 탄산을 조합해 오피스, 피트니스, 병원, 행사장에 맞게 제공합니다.
          </span>
          <div className={styles.heroActions}>
            <Link href="/product" className={styles.primaryButton}>제품 보기</Link>
            <a href="#contact" className={styles.linkButton}>상담 받아보기</a>
          </div>
        </div>
        <div className={styles.heroMedia} aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={withBasePath("/images/vrink/apple/vrink-hero-still.jpg")}
            preload="auto"
          >
            <source src={withBasePath("/images/vrink/apple/vrink-hero-h264.mp4")} type="video/mp4" />
          </video>
        </div>
      </section>

      <section id="product" className={styles.revealSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>제품 경험</p>
          <h2>맛과 기능을 고르면, 한 자리에서 한 잔이 완성됩니다.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.sceneGrid} stagger>
          {productScenes.map((scene) => (
            <article className={styles.sceneCard} key={scene.title}>
              <div className={styles.sceneImage}>
                <Image src={withBasePath(scene.image)} alt={scene.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
              </div>
              <div className={styles.sceneCopy}>
                <h3>{scene.title}</h3>
                <p>{scene.body}</p>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <PartnerLogoMarquee />

      <section id="usage" className={styles.usageSection} aria-labelledby="usage-title">
        <ActualKioskDemo locale="ko" variant="embedded" />
      </section>

      <section className={styles.darkSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>운영 구조</p>
          <h2>설치와 원액 관리까지 한 흐름으로 이어집니다.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.systemGrid} stagger>
          {systemItems.map((item) => (
            <article className={styles.systemItem} key={item.title}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <section className={styles.adminSection} aria-labelledby="admin-dashboard-title">
        <ScrollReveal className={styles.adminCopy}>
          <p>관리자 대시보드</p>
          <h2 id="admin-dashboard-title">매장 상태, 주문, 매출을 한 화면에서 봅니다.</h2>
          <span>
            설치 이후에도 관리자 페이지에서 지점 상태와 자사몰 주문, 매출 흐름을 확인할 수 있습니다.
          </span>
        </ScrollReveal>

        <ScrollReveal className={styles.adminShowcase} aria-label="브링크 관리자 화면 스크린샷" stagger>
          {adminScreenshots.map((item, index) => (
            <figure className={index === 0 ? styles.adminScreenshotPrimary : styles.adminScreenshot} key={item.title}>
              <div className={styles.adminScreenshotImage}>
                <Image src={withBasePath(item.image)} alt={item.alt} fill sizes="(max-width: 720px) 78vw, 31vw" />
              </div>
              <figcaption>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </figcaption>
            </figure>
          ))}
        </ScrollReveal>
        <div className={styles.adminDots} aria-hidden="true">
          {adminScreenshots.map((item, index) => (
            <span className={index === 0 ? styles.adminDotActive : undefined} key={item.title} />
          ))}
        </div>
      </section>

      <section id="blend" className={styles.blendSection}>
        <ShotNutritionSection />
      </section>

      <section id="expert-review" className={styles.expertSection} aria-labelledby="expert-review-title">
        <div className={styles.expertFrame}>
          <div className={styles.expertVideo} aria-hidden="true">
            <ExpertReviewBackgroundVideo
              poster={withBasePath("/images/vrink/detail/expert-review-background-0428-poster.jpg")}
              src={withBasePath("/videos/vrink/expert-review-background-0428.mp4")}
            />
          </div>
          <div className={styles.expertCopy}>
            <p>전문가 검수 기반 음료 구성</p>
            <h2 id="expert-review-title">5종 기능샷을 영양 관점으로 점검했습니다.</h2>
            <span>
              기능샷별 성분 조합과 선택 상황을 함께 검토해, 공간에 맞는 음료 루틴을 더 쉽게 제안합니다.
            </span>
            <ExpertReviewMoreModal
              poster={withBasePath("/images/vrink/detail/nutritionist-interview-poster.jpg")}
              src={withBasePath("/videos/vrink/nutritionist-interview-1080p-h264.mp4")}
            />
          </div>
        </div>
      </section>

      <LifestyleShowcase images={lifestyleImages} />

      <section id="space" className={styles.useCaseSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>적용 공간</p>
          <h2>공간별 쓰임을 분명하게 나눴습니다.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.useCaseGrid} stagger>
          {useCases.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </ScrollReveal>
      </section>

      <section id="welfare" className={styles.welfareSection} aria-labelledby="welfare-title">
        <ScrollReveal className={styles.welfareIntro}>
          <p>기업 음료 복지</p>
          <h2 id="welfare-title">직원 음료 복지, 쌓아두지 않고 바로 만들어주세요.</h2>
          <span>
            브링크는 병·캔 음료를 미리 사두는 방식 대신, 필요한 순간에 한 잔씩 만드는 음료 복지 시스템입니다.
          </span>
          <small className={styles.welfareIntroNote}>
            *비용 절감 효과는 기존 음료 구매 방식, 이용량, 설치 환경에 따라 달라질 수 있습니다.
          </small>
        </ScrollReveal>

        <ScrollReveal className={styles.welfareCompare} aria-label="기존 음료 복지와 브링크 도입 후 비교">
          <div className={styles.welfareCompareTop}>
            <article className={styles.welfareCompareProduct}>
              <h3>기존 방식</h3>
            </article>
            <article className={styles.welfareCompareProduct}>
              <h3>브링크 도입 후</h3>
            </article>
          </div>

          <div className={styles.welfareSpecRows}>
            {welfareComparisons.map((item) => (
              <div className={styles.welfareSpecRow} key={item.label}>
                <div className={styles.welfareSpecCell}>
                  <span>{item.label}</span>
                  <strong>{item.before}</strong>
                </div>
                <div className={`${styles.welfareSpecCell} ${styles.welfareSpecCellAfter}`}>
                  <span>{item.label}</span>
                  <strong>{item.after}</strong>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </section>

      <section id="operation" className={styles.operationSection}>
        <ScrollReveal className={styles.operationImage}>
          <Image
            src={withBasePath("/images/vrink/apple/vrink-product-back.png")}
            alt="브링크 제로스테이션 후면"
            fill
            sizes="(max-width: 900px) 100vw, 44vw"
          />
        </ScrollReveal>
        <ScrollReveal className={styles.operationCopy}>
          <p>운영 관리</p>
          <h2>원액과 점검, 필요한 때 바로 관리합니다.</h2>
          <span>
            정기 점검, 원액 공급, 소모품 지원, 유지보수 상담까지 운영에 필요한 순서를 함께 정합니다.
          </span>
          <ul>
            <li>소진 시점에 맞춘 원액 공급 안내</li>
            <li>전문 설치와 정기 관리 지원</li>
            <li>행사 활용과 장기 도입 구성 안내</li>
          </ul>
        </ScrollReveal>
      </section>

      <section id="news" className={styles.newsSection}>
        <ScrollReveal className={styles.sectionIntro}>
          <p>뉴스룸</p>
          <h2>브링크 소식을 한눈에 확인하세요.</h2>
        </ScrollReveal>
        <ScrollReveal className={styles.newsLayout}>
          <article className={styles.newsLead}>
            <a className={styles.newsLeadLink} href={newsItems[0].href} rel="noreferrer" target="_blank">
              <div className={styles.newsLeadImage}>
                <Image
                  src={withBasePath(newsItems[0].image)}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 62vw"
                />
              </div>
              <div className={styles.newsLeadCopy}>
                <span className={styles.newsMeta}>{`${newsItems[0].source} · ${newsItems[0].category} · ${newsItems[0].date}`}</span>
                <h3>{newsItems[0].title}</h3>
                <span className={styles.newsCta} aria-hidden="true">기사 보기 ›</span>
              </div>
            </a>
          </article>
          <div className={styles.newsList}>
            {newsItems.slice(1).map((item) => (
              <article key={item.title} className={styles.newsListItem}>
                <a className={styles.newsListLink} href={item.href} rel="noreferrer" target="_blank">
                  <div className={styles.newsListImage}>
                    <Image src={withBasePath(item.image)} alt="" fill sizes="(max-width: 560px) 30vw, 140px" />
                  </div>
                  <div className={styles.newsListCopy}>
                    <span className={styles.newsMeta}>{`${item.source} · ${item.category} · ${item.date}`}</span>
                    <h3>{item.title}</h3>
                    <span className={styles.newsCta} aria-hidden="true">기사 보기 ›</span>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section id="contact" className={styles.contactSection}>
        <ScrollReveal className={styles.contactCopy}>
          <p>문의</p>
          <h2>우리 공간에 맞는 도입 구성을 받아보세요.</h2>
          <span>
            기업·공간명, 담당자 성함, 이메일을 남겨주시면 필요한 내용을 확인해 제로스테이션 구성을 안내합니다.
          </span>
        </ScrollReveal>
        <LeadForm />
      </section>

      <VrinkFooter ctaHref="/#contact" showCta={false} />
      <IntroOfferModal />
      <CookieSettingsPopup />
    </main>
  );
}
