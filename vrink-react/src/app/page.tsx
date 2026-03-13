import { AccordionFeatureSection } from "@/components/blocks/accordion-feature-section";
import { AnimatedHero } from "@/components/blocks/animated-hero";
import { Contact2 } from "@/components/blocks/contact2";
import { Footer7 } from "@/components/blocks/footer7";
import { Gallery4, type Gallery4Item } from "@/components/blocks/gallery4";

import styles from "./page.module.css";

type Plan = {
  name: string;
  price: string;
  billing: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const galleryItems: Gallery4Item[] = [
  {
    id: "lobby-experience",
    title: "로비 경험을 바꾸는 A.I 음료 스테이션",
    description: "방문자 체류 시간을 늘리고, 공간 브랜딩 완성도를 높인 실제 도입 사례입니다.",
    href: "#",
    image: "/images/vrink/reference/331be0e5-51e1-43ad-8f72-0d43a9f945fc.png",
  },
  {
    id: "smart-office",
    title: "오피스 복지 자동화와 운영 절감",
    description: "직원 만족도와 운영 효율을 동시에 개선한 스마트 오피스 구축 프로젝트입니다.",
    href: "#",
    image: "/images/vrink/reference/6230920b-1874-4b17-aacf-aa0b098e9c0e.png",
  },
  {
    id: "hospitality-scale",
    title: "다중 지점 운영을 위한 통합 대시보드",
    description: "여러 지점의 재고, 사용량, 유지보수를 한 화면에서 관리하는 확장형 운영 사례입니다.",
    href: "#",
    image: "/images/vrink/reference/fcef618e-5c24-41be-a59f-d61e33aaee5d.png",
  },
  {
    id: "design-led-space",
    title: "프리미엄 공간을 위한 미니멀 설치",
    description: "인테리어 동선을 해치지 않으면서도 강한 브랜드 인상을 남긴 적용 사례입니다.",
    href: "#",
    image: "/images/vrink/reference/2fe2ef05-ab3a-4b12-b019-1e78f233dc0a.png",
  },
  {
    id: "team-zone",
    title: "팀 라운지 활성화를 위한 리프레시 포인트",
    description: "업무 몰입과 짧은 회복 루틴을 연결하도록 설계한 팀 커뮤니케이션 허브 사례입니다.",
    href: "#",
    image: "/images/vrink/reference/427a2f83-496d-4630-a80f-53090dc5d288.jpg",
  },
];

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$0",
    billing: "/month",
    description: "개인 실험과 루틴 구축을 위한 시작 플랜",
    features: ["개인 워크스페이스", "기본 자동화 5개", "주간 인사이트 리포트"],
  },
  {
    name: "Pro",
    price: "$24",
    billing: "/month",
    description: "전문가용 분석과 고급 자동화 플랜",
    features: ["AI 우선순위 엔진", "무제한 자동화", "실험 로그 비교 분석", "우선 지원"],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$79",
    billing: "/month",
    description: "성장 팀을 위한 협업·보안 확장 플랜",
    features: ["SSO / SCIM", "권한 정책 템플릿", "감사 로그", "전담 온보딩"],
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer} aria-hidden="true" />
      <div className={styles.gridLayer} aria-hidden="true" />
      <div className={styles.particleLayer} aria-hidden="true" />

      <header className={styles.header}>
        <a href="#" className={styles.logo}>
          NEUTRIX
        </a>
        <nav className={styles.nav} aria-label="Primary">
          <a href="#faq">FAQ</a>
          <a href="#reviews">Reviews</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#pricing" className={styles.navCta}>
          Start Free
        </a>
      </header>

      <section className={styles.hero}>
        <AnimatedHero />
      </section>

      <Gallery4
        id="reviews"
        className={styles.section}
        title="Gallery"
        description="브링크가 실제 공간에서 어떻게 경험을 바꾸는지 대표 사례를 슬라이드로 확인해보세요."
        items={galleryItems}
      />

      <section id="pricing" className={styles.section}>
        <header className={styles.sectionHead}>
          <p>Pricing Section</p>
          <h2>Creative pricing cards for every growth stage</h2>
        </header>
        <div className={styles.pricingGrid}>
          {plans.map((plan) => (
            <article key={plan.name} className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingCardHighlighted : ""}`}>
              <h3>{plan.name}</h3>
              <p className={styles.priceLine}>
                <strong>{plan.price}</strong>
                <span>{plan.billing}</span>
              </p>
              <p className={styles.planDescription}>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a href="#" className={styles.planButton}>
                {plan.highlighted ? "Get Pro" : "Choose Plan"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <AccordionFeatureSection id="faq" />

      <Contact2 id="contact" />

      <Footer7 />
    </main>
  );
}
