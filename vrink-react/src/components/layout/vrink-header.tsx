"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { withBasePath } from "@/lib/static-export";
import styles from "./vrink-header.module.css";

const navItems = {
  ko: [
    ["제품", "/product"],
    ["상세페이지", "/detail"],
    ["도입 지점", "/locations"],
    ["소식", "/#news"],
    ["고객지원", "/support"],
  ],
  en: [
    ["Product", "/en/product"],
    ["News", "/en#news"],
    ["Support", "/en/support"],
  ],
};

const languages = [
  { code: "EN", label: "English" },
  { code: "KO", label: "한국어" },
];

type VrinkHeaderProps = {
  locale?: "ko" | "en";
  variant?: "default" | "overlay";
};

export function VrinkHeader({ locale = "ko", variant = "default" }: VrinkHeaderProps) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const headerClassName =
    variant === "overlay" ? `${styles.header} ${styles.headerOverlay}` : styles.header;
  const currentLanguage = locale === "en" ? "EN" : "KO";
  const ctaLabel = locale === "en" ? "Contact" : "도입문의";
  const ctaHref = locale === "en" ? "/en#contact" : "/#contact";
  const logoHref = locale === "en" ? "/en" : "/";
  const logoLabel = locale === "en" ? "VRINK English home" : "브링크 홈";

  function getLanguageHref(code: "EN" | "KO") {
    if (code === "EN") {
      if (pathname === "/product") return "/en/product";
      if (pathname === "/support") return "/en/support";

      return "/en";
    }

    if (pathname === "/en/product") return "/product";
    if (pathname === "/en/support") return "/support";

    return "/";
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!languageRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className={headerClassName}>
      <button
        type="button"
        className={styles.menuButton}
        aria-controls="vrink-mobile-menu"
        aria-expanded={mobileMenuOpen}
        aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <Link href={logoHref} className={styles.logo} aria-label={logoLabel} onClick={() => setMobileMenuOpen(false)}>
        <Image src={withBasePath("/images/vrink/apple/vrink-logo.svg")} alt="" width={140} height={40} priority />
      </Link>
      <nav className={styles.nav} aria-label="브링크 주요 메뉴">
        {navItems[locale].map(([label, href]) => (
          <Link href={href} key={label}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <div
          className={`${styles.language} ${languageOpen ? styles.languageOpen : ""}`}
          ref={languageRef}
        >
          <button
            type="button"
            className={styles.languageButton}
            aria-expanded={languageOpen}
            aria-haspopup="menu"
            aria-label="언어 선택"
            onClick={() => setLanguageOpen((open) => !open)}
          >
            <Globe2 aria-hidden="true" />
            <span>{currentLanguage}</span>
          </button>
          <div className={styles.languageMenu} role="menu">
            {languages.map((language) => (
              <Link
                href={getLanguageHref(language.code as "EN" | "KO")}
                key={language.code}
                onClick={() => setLanguageOpen(false)}
                role="menuitem"
                aria-current={language.code === currentLanguage ? "page" : undefined}
              >
                {language.label}
              </Link>
            ))}
          </div>
        </div>
        <Link href={ctaHref} className={styles.navCta}>
          {ctaLabel}
        </Link>
      </div>
      <div
        className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}
        id="vrink-mobile-menu"
      >
        <nav className={styles.mobileNav} aria-label="브링크 모바일 메뉴">
          {navItems[locale].map(([label, href]) => (
            <Link href={href} key={label} onClick={() => setMobileMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.mobileMenuMeta}>
          <div className={styles.mobileLanguageLinks} aria-label="언어 선택">
            {languages.map((language) => (
              <Link
                href={getLanguageHref(language.code as "EN" | "KO")}
                key={language.code}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={language.code === currentLanguage ? "page" : undefined}
              >
                {language.code}
              </Link>
            ))}
          </div>
          <Link href={ctaHref} className={styles.mobileCta} onClick={() => setMobileMenuOpen(false)}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
