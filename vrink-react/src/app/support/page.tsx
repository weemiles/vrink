import type { Metadata } from "next";

import { LeadForm } from "@/components/forms/lead-form";
import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { buildMetadata } from "@/lib/seo";

import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  title: "고객지원",
  description: "브링크 도입, 설치, 운영 관리, 기능샷과 음료 구성에 대한 자주 묻는 질문과 문의 안내입니다.",
  path: "/support",
});

const categories = [
  ["자주 묻는 질문", "#faq"],
  ["도입문의", "#intro"],
  ["설치", "#install"],
  ["운영관리", "#operation"],
  ["기능샷·음료", "#blend"],
  ["위생", "#clean"],
  ["행사·팝업", "#event"],
  ["문의하기", "#inquiry"],
];

const faqGroups = [
  {
    id: "intro",
    title: "도입문의",
    items: [
      [
        "어떤 공간에 설치할 수 있나요?",
        "오피스, 피트니스 센터, 병원·웰니스 공간, 이벤트·팝업처럼 장시간 운영되거나 방문자 경험이 중요한 공간에 맞춰 상담합니다.",
      ],
      [
        "도입 절차는 어떻게 되나요?",
        "문의 접수 후 공간 조건과 예상 사용량을 확인하고, 맞춤 견적, 계약, 설치, 관리 순서로 진행합니다.",
      ],
      [
        "구매와 렌탈 모두 상담할 수 있나요?",
        "운영 기간, 예상 사용량, 설치 환경에 따라 적합한 도입 방식을 함께 검토합니다.",
      ],
    ],
  },
  {
    id: "install",
    title: "설치",
    items: [
      [
        "설치 전에 어떤 정보를 준비하면 좋나요?",
        "설치 공간의 크기, 전원과 급배수 조건, 예상 사용 인원, 운영 기간을 알려주시면 더 빠르게 구성을 제안할 수 있습니다.",
      ],
      [
        "방문 설치는 어떻게 진행되나요?",
        "사전 확인 후 일정에 맞춰 설치와 기본 사용 안내를 진행합니다. 단기 행사나 팝업은 운영 시간과 현장 동선까지 함께 확인합니다.",
      ],
    ],
  },
  {
    id: "operation",
    title: "운영관리",
    items: [
      [
        "원액은 어떻게 관리하나요?",
        "사용량과 잔량을 기준으로 원액 공급 흐름을 설계하고, 정기 배송과 관리 기준을 함께 안내합니다.",
      ],
      [
        "정기 점검은 어떤 방식으로 진행되나요?",
        "기기 상태, 음료 제조부, 소모품과 원액 사용 흐름을 확인해 공간 운영에 맞는 관리 기준을 유지합니다.",
      ],
    ],
  },
  {
    id: "blend",
    title: "기능샷·음료",
    items: [
      [
        "기능샷과 맛 조합은 어떻게 정하나요?",
        "공간의 목적과 사용자의 선호를 기준으로 부스터샷, 비타민샷, 릴렉스샷, 커팅샷, 아미노 샷과 플레이버 조합을 제안합니다.",
      ],
      [
        "영양성분은 어디에서 확인할 수 있나요?",
        "홈페이지의 기능샷 둘러보기에서 각 샷의 영양성분을 확인할 수 있고, 도입 상담 시 운영 공간에 맞는 안내 자료도 함께 제공합니다.",
      ],
    ],
  },
  {
    id: "clean",
    title: "위생",
    items: [
      [
        "위생 관리는 어떻게 하나요?",
        "필터 여과, 자동 세척 기능, 정기 점검 알림을 기반으로 운영 환경에 맞는 관리 기준을 제공합니다.",
      ],
      [
        "사용자가 많은 공간에서도 안정적으로 운영할 수 있나요?",
        "예상 사용량과 운영 시간에 맞춰 원액 공급, 점검 주기, 사용 안내 방식을 함께 설계합니다.",
      ],
    ],
  },
  {
    id: "event",
    title: "행사·팝업",
    items: [
      [
        "단기 행사에도 사용할 수 있나요?",
        "팝업, 컨퍼런스, 프로모션 행사처럼 단기 운영이 필요한 경우 별도 조건으로 상담할 수 있습니다.",
      ],
      [
        "행사장 동선에 맞춰 구성할 수 있나요?",
        "방문자 흐름, 대기 시간, 전원과 급배수 조건을 확인해 현장에 맞는 배치와 운영 방식을 제안합니다.",
      ],
    ],
  },
];

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p>고객지원</p>
          <h1>브링크 고객지원</h1>
          <span>
            도입 전 확인할 질문부터 설치, 운영, 위생 관리까지 한곳에서 확인하세요.
          </span>
          <nav className={styles.categoryNav} aria-label="고객지원 카테고리">
            {categories.map(([label, href], index) => (
              <a className={index === 0 ? styles.activeCategory : ""} href={href} key={label}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section id="faq" className={styles.faqSection}>
        <div className={styles.faqShell}>
          {faqGroups.map((group) => (
            <section className={styles.faqGroup} id={group.id} key={group.id}>
              <div className={styles.groupHeader}>
                <p>{group.title}</p>
              </div>
              <div className={styles.faqList}>
                {group.items.map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      <span>Q. {question}</span>
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section id="inquiry" className={styles.inquirySection}>
        <div className={styles.inquiryGrid}>
          <div className={styles.inquiryCopy}>
            <p>도입문의</p>
            <h2>우리 공간에 맞는 구성을 상담해보세요.</h2>
            <span>
              설치 환경, 예상 사용 인원, 운영 목적을 남겨주시면 브링크 팀이 확인 후 연락드립니다.
            </span>
          </div>
          <div className={styles.formPanel}>
            <LeadForm />
          </div>
        </div>
      </section>

      <VrinkFooter ctaHref="/support#inquiry" />
    </main>
  );
}
