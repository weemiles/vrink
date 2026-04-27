import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

import styles from "../legal.module.css";

export const metadata: Metadata = buildMetadata({
  title: "개인정보처리방침",
  description: "브링크 웹사이트와 도입 상담 서비스의 개인정보 처리 기준을 안내합니다.",
  path: "/privacy",
});

const sections = [
  {
    id: "scope",
    title: "1. 총칙 및 적용 범위",
    body: [
      "주식회사 브링크는 이용자의 개인정보를 중요하게 생각하며, 개인정보 보호 관련 법령을 준수하기 위해 본 개인정보처리방침을 공개합니다.",
      "본 방침은 브링크 공식 웹사이트, 도입 상담, 자료 요청, 고객지원 문의 및 이와 연계된 온라인 서비스에 적용됩니다.",
    ],
  },
  {
    id: "items",
    title: "2. 수집하는 개인정보 항목",
    list: [
      "도입 상담 및 문의: 기업/단체명, 담당자명, 연락처, 이메일, 상담 내용, 설치 희망 공간 및 예상 이용 정보",
      "소식 구독: 이메일 주소",
      "서비스 이용 과정: 접속 IP, 브라우저 정보, 방문 일시, 쿠키, 서비스 이용 기록",
      "계약 및 정산이 필요한 경우: 사업자 정보, 담당자 연락처, 세금계산서 발행에 필요한 정보",
    ],
  },
  {
    id: "purpose",
    title: "3. 개인정보의 이용 목적",
    list: [
      "도입 상담, 견적 안내, 설치 가능 여부 확인 및 고객 문의 응대",
      "제품 업데이트, 도입 사례, 운영 안내 등 브링크 소식 제공",
      "서비스 품질 개선, 웹사이트 이용 분석, 보안 및 부정 이용 방지",
      "계약 이행, 원액 공급, 정기 점검, A/S 및 운영 관리 지원",
    ],
  },
  {
    id: "retention",
    title: "4. 보유 및 이용 기간",
    body: [
      "브링크는 개인정보 수집 및 이용 목적이 달성되면 지체 없이 해당 정보를 파기합니다. 다만 법령상 보관 의무가 있거나 분쟁 대응을 위해 필요한 경우 해당 기간 동안 보관할 수 있습니다.",
    ],
    list: [
      "상담 및 문의 기록: 접수일로부터 3년",
      "계약 및 거래 관련 기록: 관련 법령에 따른 보존 기간",
      "웹사이트 접속 기록: 서비스 운영 및 보안 목적 범위 내에서 필요한 기간",
    ],
  },
  {
    id: "sharing",
    title: "5. 제3자 제공 및 처리위탁",
    body: [
      "브링크는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 근거가 있거나 이용자가 사전에 동의한 경우에는 예외로 합니다.",
      "서비스 운영 과정에서 클라우드 인프라, 이메일 발송, 문의 접수 관리, 결제 및 회계 처리 등 업무를 외부 서비스에 위탁할 수 있으며, 이 경우 필요한 범위 내에서만 개인정보를 처리하도록 관리합니다.",
    ],
  },
  {
    id: "rights",
    title: "6. 이용자의 권리와 행사 방법",
    body: [
      "이용자는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리 정지, 동의 철회를 요청할 수 있습니다. 요청은 이메일 또는 고객지원 채널을 통해 접수할 수 있으며, 브링크는 관련 법령에 따라 지체 없이 처리합니다.",
    ],
  },
  {
    id: "security",
    title: "7. 안전성 확보 조치",
    list: [
      "개인정보 접근 권한 최소화 및 내부 관리 기준 운영",
      "보안 연결, 접근 통제, 기록 관리 등 기술적 보호 조치",
      "상담 및 계약 관련 자료의 보관 범위 제한",
      "개인정보 처리 담당자 교육 및 관리",
    ],
  },
  {
    id: "cookies",
    title: "8. 쿠키 및 유사 기술",
    body: [
      "브링크 웹사이트는 이용 편의 개선, 방문 흐름 분석, 서비스 품질 향상을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.",
    ],
  },
  {
    id: "contact",
    title: "9. 개인정보 보호 문의",
    body: [
      `개인정보 보호 관련 문의는 ${siteConfig.contactEmail} 또는 ${siteConfig.contactPhone}으로 연락해 주세요.`,
      `${siteConfig.business.companyName} · 대표 ${siteConfig.business.owner} · 사업자번호 ${siteConfig.business.registrationNumber}`,
      siteConfig.business.address,
    ],
  },
  {
    id: "changes",
    title: "10. 고지 및 개정",
    body: [
      "본 개인정보처리방침은 법령, 서비스, 내부 운영 기준 변경에 따라 개정될 수 있습니다. 중요한 변경이 있을 경우 웹사이트를 통해 사전에 안내합니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>개인정보처리방침</h1>
          <span className={styles.lead}>
            브링크는 도입 상담, 고객지원, 소식 구독 과정에서 필요한 개인정보를 최소한으로 수집하고 안전하게 관리합니다.
          </span>
          <p className={styles.updated}>시행일: 2026년 4월 27일</p>
        </div>
      </section>

      <div className={styles.shell}>
        <nav className={styles.sideNav} aria-label="개인정보처리방침 목차">
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </nav>

        <div className={styles.content}>
          <p className={styles.notice}>
            본 페이지는 브링크 웹사이트 및 도입 상담 서비스 이용자를 위한 개인정보 처리 기준을 안내합니다.
          </p>
          {sections.map((section) => (
            <section className={styles.section} id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.list ? (
                <ul>
                  {section.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
      <VrinkFooter ctaHref="/support#inquiry" />
    </main>
  );
}
