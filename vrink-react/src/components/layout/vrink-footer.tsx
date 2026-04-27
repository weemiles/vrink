import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { withBasePath } from "@/lib/static-export";

import styles from "./vrink-footer.module.css";

type FooterColumn = {
  title: string;
  links: Array<[label: string, href: string]>;
};

type VrinkFooterProps = {
  ctaHref?: string;
  locale?: "ko" | "en";
};

const footerContent = {
  ko: {
    ctaTitle: "브링크 도입 상담 전용",
    ctaBody: "공간 조건과 운영 목적에 맞춰 제로스테이션 도입 구성을 상담해보세요.",
    ctaLabel: "상담 신청",
    subscribeTitle: "소식 구독",
    subscribeBody: "브링크의 도입 사례와 제품 업데이트를 받아보세요.",
    subscribePlaceholder: "이메일 주소",
    quickLinks: [
      ["회사 소개", "/#product"],
      ["문의하기", "/#contact"],
      ["제휴 문의", "/support#inquiry"],
      ["고객지원", "/support"],
    ],
    legalLinks: [
      ["개인정보처리방침", "/privacy"],
      ["이용 약관", "/terms"],
    ],
    companyLine: `${siteConfig.business.companyName} · 대표 ${siteConfig.business.owner} · 사업자번호 ${siteConfig.business.registrationNumber}`,
    copyright: "Copyright © 2025 VRINK. 모든 권리 보유.",
    columns: [
      {
        title: "제품",
        links: [
          ["제로스테이션", "/product"],
          ["기능샷", "/#blend"],
          ["사용 장면", "/#experience"],
        ],
      },
      {
        title: "도입 안내",
        links: [
          ["도입 상담", "/#contact"],
          ["설치 프로세스", "/support#install"],
          ["렌탈·구매 문의", "/support#inquiry"],
        ],
      },
      {
        title: "운영 관리",
        links: [
          ["원액 공급", "/support#operation"],
          ["정기 점검", "/support#operation"],
          ["자주 묻는 질문", "/support#faq"],
        ],
      },
      {
        title: "고객지원",
        links: [
          ["적용 공간", "/#space"],
          ["자료 요청", "/support#inquiry"],
          ["이메일 문의", `mailto:${siteConfig.contactEmail}`],
        ],
      },
    ],
  },
  en: {
    ctaTitle: "VRINK consultation",
    ctaBody: "Tell us about your space, traffic, and operating goals. We will help shape the right Zero Station setup.",
    ctaLabel: "Contact us",
    subscribeTitle: "Updates",
    subscribeBody: "Receive VRINK news, product updates, and installation stories.",
    subscribePlaceholder: "Email address",
    quickLinks: [
      ["About", "/en#product"],
      ["Contact", "/en#contact"],
      ["Partnership", "/en/support#inquiry"],
      ["Support", "/en/support"],
    ],
    legalLinks: [
      ["Privacy Policy", "/en/privacy"],
      ["Terms", "/en/terms"],
    ],
    companyLine: `${siteConfig.business.companyName} · CEO ${siteConfig.business.owner} · Business No. ${siteConfig.business.registrationNumber}`,
    copyright: "Copyright © 2025 VRINK. All rights reserved.",
    columns: [
      {
        title: "Product",
        links: [
          ["Zero Station", "/en/product"],
          ["Functional shots", "/en#blend"],
          ["Use cases", "/en#space"],
        ],
      },
      {
        title: "Getting Started",
        links: [
          ["Consultation", "/en#contact"],
          ["Installation", "/en/support#install"],
          ["Rental & purchase", "/en/support#inquiry"],
        ],
      },
      {
        title: "Operation",
        links: [
          ["Ingredient supply", "/en/support#operation"],
          ["Regular care", "/en/support#operation"],
          ["FAQ", "/en/support#faq"],
        ],
      },
      {
        title: "Support",
        links: [
          ["Spaces", "/en#space"],
          ["Request materials", "/en/support#inquiry"],
          ["Email", `mailto:${siteConfig.contactEmail}`],
        ],
      },
    ],
  },
} satisfies Record<
  "ko" | "en",
  {
    ctaTitle: string;
    ctaBody: string;
    ctaLabel: string;
    subscribeTitle: string;
    subscribeBody: string;
    subscribePlaceholder: string;
    quickLinks: Array<[label: string, href: string]>;
    legalLinks: Array<[label: string, href: string]>;
    companyLine: string;
    copyright: string;
    columns: FooterColumn[];
  }
>;

function FooterLink({ href, children }: { href: string; children: string }) {
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return <a href={href}>{children}</a>;
  }

  return <Link href={href}>{children}</Link>;
}

export function VrinkFooter({ ctaHref = "/#contact", locale = "ko" }: VrinkFooterProps) {
  const content = footerContent[locale];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerCta}>
        <h2>{content.ctaTitle}</h2>
        <p>{content.ctaBody}</p>
        <Link href={ctaHref}>{content.ctaLabel}</Link>
      </div>

      <div className={styles.footerDivider} />

      <div className={styles.footerGrid}>
        {content.columns.map((column) => (
          <nav key={column.title} aria-label={column.title} className={styles.footerColumn}>
            <h3>{column.title}</h3>
            {column.links.map(([label, href]) => (
              <FooterLink key={label} href={href}>
                {label}
              </FooterLink>
            ))}
          </nav>
        ))}

        <div className={styles.footerSubscribe}>
          <h3>{content.subscribeTitle}</h3>
          <p>{content.subscribeBody}</p>
          <form aria-label={locale === "en" ? "Subscribe to VRINK updates" : "브링크 소식 구독"}>
            <input
              type="email"
              placeholder={content.subscribePlaceholder}
              aria-label={content.subscribePlaceholder}
            />
            <button type="button" aria-label="구독 신청">→</button>
          </form>
        </div>
      </div>

      <div className={styles.footerBrandRow}>
        <Link href="/" className={styles.footerBrand} aria-label="브링크 홈">
          <Image src={withBasePath("/images/vrink/apple/vrink-logo.svg")} alt="" width={140} height={40} />
        </Link>
        <div className={styles.footerQuickLinks}>
          {content.quickLinks.map(([label, href]) => (
            <FooterLink key={label} href={href}>
              {label}
            </FooterLink>
          ))}
        </div>
        <div className={styles.footerSocial} aria-label="브링크 채널">
          <a href={siteConfig.baseUrl}>Web</a>
          <a href={`mailto:${siteConfig.contactEmail}`}>Mail</a>
          <a href={`tel:${siteConfig.contactPhone}`}>Tel</a>
        </div>
      </div>

      <div className={styles.footerLegal}>
        <div>
          <FooterLink href={content.legalLinks[0][1]}>{content.legalLinks[0][0]}</FooterLink>
          <span>·</span>
          <FooterLink href={content.legalLinks[1][1]}>{content.legalLinks[1][0]}</FooterLink>
        </div>
        <p>{content.companyLine}</p>
        <p>{siteConfig.business.address}</p>
        <p>{content.copyright}</p>
      </div>
    </footer>
  );
}
