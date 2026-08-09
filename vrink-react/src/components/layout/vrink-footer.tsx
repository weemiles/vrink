import Image from "next/image";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
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
  showCta?: boolean;
};

const businessInfoLabels = {
  ko: {
    companyName: "상호명 :",
    owner: "대표자명 :",
    registrationNumber: "사업자등록번호 :",
    address: "사업장 주소 :",
    phone: "유선번호 :",
  },
  en: {
    companyName: "Company :",
    owner: "CEO :",
    registrationNumber: "Business Registration No. :",
    address: "Business Address :",
    phone: "Phone :",
  },
} satisfies Record<
  "ko" | "en",
  Record<"companyName" | "owner" | "registrationNumber" | "address" | "phone", string>
>;

const footerContent = {
  ko: {
    ctaTitle: "우리 공간에 맞는 도입 구성을 받아보세요",
    ctaBody: "기업·공간명, 담당자 성함, 이메일만 남겨주시면 필요한 내용을 확인해 제로스테이션 구성을 안내합니다.",
    ctaLabel: "도입 구성 요청하기",
    subscribeTitle: "소식 구독",
    subscribeBody: "브링크 도입 사례와 제품 업데이트를 받아보세요.",
    subscribePlaceholder: "이메일 주소",
    quickLinks: [
      ["회사 소개", "/#product"],
      ["상담받기", "/#contact"],
      ["제휴 문의", "/support#inquiry"],
      ["고객지원", "/support"],
    ],
    legalLinks: [
      ["개인정보처리방침", "/privacy"],
      ["이용 약관", "/terms"],
    ],
    cookieSettingsLabel: "쿠키 설정",
    copyright: "Copyright © 2026 VRINK. 모든 권리 보유.",
    columns: [
      {
        title: "제품",
        links: [
          ["제로스테이션", "/product"],
          ["브링크 라이트(예정)", "/business"],
          ["기능샷", "/#blend"],
          ["사용 장면", "/#experience"],
        ],
      },
      {
        title: "도입 안내",
        links: [
          ["상담받기", "/#contact"],
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
    ctaTitle: "Tell us about your space",
    ctaBody: "Leave your organization or venue, name, and work email. We’ll follow up and recommend the right Zero Station setup.",
    ctaLabel: "Plan your setup",
    subscribeTitle: "Updates",
    subscribeBody: "Receive VRINK news, product updates, and installation stories.",
    subscribePlaceholder: "Email address",
    quickLinks: [
      ["About", "/en#product"],
      ["Plan your setup", "/en#contact"],
      ["Issue report", "/en/inquiry"],
      ["Partnership", "/en#contact"],
      ["Support", "/en/support"],
    ],
    legalLinks: [
      ["Privacy Policy", "/en/privacy"],
      ["Terms", "/en/terms"],
    ],
    cookieSettingsLabel: "Cookie settings",
    copyright: "Copyright © 2026 VRINK. All rights reserved.",
    columns: [
      {
        title: "Product",
        links: [
          ["Zero Station", "/en/product"],
          ["VRINK Light (Coming Soon)", "/en/business"],
          ["Ingredients", "/en/ingredients"],
          ["Functional shots", "/en#blend"],
          ["Use cases", "/en#space"],
        ],
      },
      {
        title: "Getting Started",
        links: [
          ["Plan your setup", "/en#contact"],
          ["Installation", "/en/support#install"],
          ["Rental & purchase", "/en#contact"],
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
          ["Issue report", "/en/inquiry"],
          ["Request materials", "/en#contact"],
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
    cookieSettingsLabel: string;
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

export function VrinkFooter({ ctaHref = "/#contact", locale = "ko", showCta = true }: VrinkFooterProps) {
  const content = footerContent[locale];
  const labels = businessInfoLabels[locale];
  const businessInfo =
    locale === "en"
      ? {
          companyName: "VRINK Co., Ltd.",
          owner: "Minsoo Kim",
          registrationNumber: siteConfig.business.registrationNumber,
          address: "46 Dongnam-ro 406beon-gil, Hanam-si, Gyeonggi-do, Korea",
        }
      : siteConfig.business;
  const businessInfoRows = [
    [labels.companyName, businessInfo.companyName],
    [labels.owner, businessInfo.owner],
    [labels.registrationNumber, businessInfo.registrationNumber],
    [labels.address, businessInfo.address],
    [labels.phone, siteConfig.contactPhone],
  ];

  return (
    <footer className={styles.footer}>
      {showCta && (
        <>
          <div className={styles.footerCta}>
            <h2>{content.ctaTitle}</h2>
            <p>{content.ctaBody}</p>
            <Link href={ctaHref}>{content.ctaLabel}</Link>
          </div>

          <div className={styles.footerDivider} />
        </>
      )}

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
            <button type="button" aria-label={locale === "en" ? "Subscribe" : "구독 신청"}>→</button>
          </form>
        </div>
      </div>

      <div className={styles.footerBrandRow}>
        <Link
          href={locale === "en" ? "/en" : "/"}
          className={styles.footerBrand}
          aria-label={locale === "en" ? "VRINK English home" : "브링크 홈"}
        >
          <Image src={withBasePath("/images/vrink/apple/vrink-logo.svg")} alt="" width={140} height={40} />
        </Link>
        <div className={styles.footerQuickLinks}>
          {content.quickLinks.map(([label, href]) => (
            <FooterLink key={label} href={href}>
              {label}
            </FooterLink>
          ))}
        </div>
        <div className={styles.footerSocial} aria-label={locale === "en" ? "VRINK channels" : "브링크 채널"}>
          <a href={siteConfig.baseUrl}>Web</a>
          <a href={`mailto:${siteConfig.contactEmail}`}>Mail</a>
          <a href={`tel:${siteConfig.contactPhone}`}>Tel</a>
        </div>
      </div>

      <div className={styles.footerLegal}>
        <div className={styles.footerLegalLinks}>
          <FooterLink href={content.legalLinks[0][1]}>{content.legalLinks[0][0]}</FooterLink>
          <span>·</span>
          <FooterLink href={content.legalLinks[1][1]}>{content.legalLinks[1][0]}</FooterLink>
          <span>·</span>
          <CookieSettingsButton className={styles.footerConsentButton}>
            {content.cookieSettingsLabel}
          </CookieSettingsButton>
        </div>
        <dl className={styles.footerBusinessInfo}>
          {businessInfoRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p>{content.copyright}</p>
      </div>
    </footer>
  );
}
