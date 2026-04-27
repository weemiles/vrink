import type { Metadata } from "next";

import { VrinkFooter } from "@/components/layout/vrink-footer";
import { VrinkHeader } from "@/components/layout/vrink-header";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

import styles from "../legal.module.css";

export const metadata: Metadata = buildMetadata({
  title: "이용 약관",
  description: "브링크 웹사이트, 도입 상담, 제품 안내 서비스의 이용 조건을 안내합니다.",
  path: "/terms",
});

const sections = [
  {
    id: "purpose",
    title: "1. 목적",
    body: [
      "본 약관은 주식회사 브링크가 운영하는 공식 웹사이트와 도입 상담, 자료 요청, 고객지원 등 관련 서비스의 이용 조건과 절차를 정하는 것을 목적으로 합니다.",
    ],
  },
  {
    id: "definitions",
    title: "2. 용어의 정의",
    list: [
      "서비스: 브링크 웹사이트, 제품 안내, 도입 상담, 고객지원, 소식 구독 등 온라인으로 제공되는 기능",
      "이용자: 본 웹사이트에 접속하거나 브링크가 제공하는 서비스를 이용하는 개인 또는 법인",
      "상담 신청: 이용자가 설치 공간, 예상 이용량, 연락처 등을 입력해 도입 검토를 요청하는 행위",
      "제품: 브링크 제로스테이션, 기능샷, 원액, 소모품 및 관련 운영 지원 서비스",
    ],
  },
  {
    id: "effect",
    title: "3. 약관의 게시와 변경",
    body: [
      "브링크는 본 약관을 웹사이트에 게시하여 이용자가 확인할 수 있도록 합니다. 약관은 관련 법령, 서비스 정책, 운영 상황에 따라 변경될 수 있으며, 중요한 변경 사항은 웹사이트를 통해 안내합니다.",
    ],
  },
  {
    id: "service",
    title: "4. 서비스 제공",
    list: [
      "브링크 제로스테이션 및 음료 솔루션 정보 제공",
      "도입 상담, 견적 검토, 설치 가능 여부 안내",
      "고객지원, 자료 요청, 운영 관리 관련 문의 접수",
      "브링크 소식, 제품 업데이트, 도입 사례 안내",
    ],
  },
  {
    id: "request",
    title: "5. 상담 신청과 계약",
    body: [
      "웹사이트에서 상담 신청을 완료하더라도 제품 구매, 렌탈, 설치 계약이 자동으로 체결되는 것은 아닙니다. 실제 도입 조건은 별도 상담, 견적, 계약 절차를 통해 확정됩니다.",
      "이용자는 상담 신청 시 정확한 정보를 제공해야 하며, 잘못된 정보로 인해 발생한 불이익은 이용자에게 책임이 있을 수 있습니다.",
    ],
  },
  {
    id: "obligations",
    title: "6. 이용자의 의무",
    list: [
      "타인의 개인정보 또는 허위 정보를 사용하지 않아야 합니다.",
      "브링크 웹사이트, 상담 시스템, 문의 채널의 정상적인 운영을 방해해서는 안 됩니다.",
      "제품 이미지, 설명, 자료 등을 브링크의 동의 없이 무단 복제, 배포, 상업적으로 이용해서는 안 됩니다.",
      "관련 법령과 본 약관, 웹사이트 안내 사항을 준수해야 합니다.",
    ],
  },
  {
    id: "company",
    title: "7. 회사의 의무",
    body: [
      "브링크는 안정적인 서비스 제공을 위해 합리적인 노력을 다하며, 이용자가 안전하게 서비스를 이용할 수 있도록 개인정보 보호와 보안 관리에 필요한 조치를 취합니다.",
    ],
  },
  {
    id: "ip",
    title: "8. 지식재산권",
    body: [
      "웹사이트에 포함된 상표, 로고, 제품 이미지, 텍스트, 그래픽, 영상, UI 등 모든 콘텐츠에 대한 권리는 브링크 또는 정당한 권리자에게 있습니다. 이용자는 사전 동의 없이 이를 복제, 수정, 배포, 판매하거나 2차 저작물로 만들 수 없습니다.",
    ],
  },
  {
    id: "limitation",
    title: "9. 책임의 제한",
    body: [
      "브링크는 천재지변, 네트워크 장애, 외부 서비스 장애, 이용자의 귀책 사유 등 회사가 합리적으로 통제할 수 없는 사유로 발생한 서비스 이용 장애에 대해 책임을 지지 않습니다.",
      "웹사이트의 제품 정보는 이해를 돕기 위한 안내이며, 실제 도입 조건, 구성, 가격, 설치 가능 여부는 상담 및 계약 과정에서 달라질 수 있습니다.",
    ],
  },
  {
    id: "suspension",
    title: "10. 서비스 중단",
    body: [
      "브링크는 시스템 점검, 보안 조치, 서비스 개선, 운영상 필요가 있는 경우 서비스의 전부 또는 일부를 일시적으로 중단할 수 있습니다. 가능한 경우 사전에 안내합니다.",
    ],
  },
  {
    id: "law",
    title: "11. 준거법 및 관할",
    body: [
      "본 약관은 대한민국 법령을 기준으로 해석됩니다. 서비스 이용과 관련하여 분쟁이 발생하는 경우 관련 법령에 따른 관할 법원을 제1심 관할 법원으로 합니다.",
    ],
  },
  {
    id: "contact",
    title: "12. 문의",
    body: [
      `서비스 이용 및 약관 관련 문의는 ${siteConfig.contactEmail} 또는 ${siteConfig.contactPhone}으로 연락해 주세요.`,
      `${siteConfig.business.companyName} · 대표 ${siteConfig.business.owner} · 사업자번호 ${siteConfig.business.registrationNumber}`,
      siteConfig.business.address,
    ],
  },
];

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <VrinkHeader />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>이용 약관</h1>
          <span className={styles.lead}>
            브링크 웹사이트와 도입 상담 서비스를 이용하기 전에 확인해야 할 기본 조건을 안내합니다.
          </span>
          <p className={styles.updated}>시행일: 2026년 4월 27일</p>
        </div>
      </section>

      <div className={styles.shell}>
        <nav className={styles.sideNav} aria-label="이용 약관 목차">
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </nav>

        <div className={styles.content}>
          <p className={styles.notice}>
            본 약관은 브링크 공식 웹사이트와 도입 상담 서비스 이용에 적용됩니다.
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
