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
    { label: "제품", href: "/product" },
    { label: "라이트 예정", href: "/business", disabled: true },
    { label: "원료소개", href: "/ingredients" },
    { label: "도입 지점", href: "/locations" },
    { label: "소식", href: "/#news" },
    { label: "고객지원", href: "/support" },
  ],
  en: [
    { label: "Product", href: "/en/product" },
    { label: "Light Soon", href: "/en/business", disabled: true },
    { label: "Ingredients", href: "/en/ingredients" },
    { label: "Locations", href: "/en/locations" },
    { label: "News", href: "/en#news" },
    { label: "Support", href: "/en/support" },
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
  const ctaLabel = locale === "en" ? "Get setup" : "상담받기";
  const ctaHref = locale === "en" ? "/en#contact" : "/#contact";
  const logoHref = locale === "en" ? "/en" : "/";
  const logoLabel = locale === "en" ? "VRINK English home" : "브링크 홈";
  const menuLabel = mobileMenuOpen
    ? locale === "en" ? "Close menu" : "메뉴 닫기"
    : locale === "en" ? "Open menu" : "메뉴 열기";
  const navLabel = locale === "en" ? "VRINK primary navigation" : "브링크 주요 메뉴";
  const languageLabel = locale === "en" ? "Select language" : "언어 선택";
  const mobileNavLabel = locale === "en" ? "VRINK mobile menu" : "브링크 모바일 메뉴";

  function getLanguageHref(code: "EN" | "KO") {
    if (code === "EN") {
      if (pathname?.startsWith("/en")) return pathname;
      if (pathname === "/product") return "/en/product";
      if (pathname === "/experience") return "/en/experience";
      if (pathname === "/business") return "/en/business";
      if (pathname === "/ingredients") return "/en/ingredients";
      if (pathname === "/locations") return "/en/locations";
      if (pathname === "/support") return "/en/support";
      if (pathname === "/inquiry") return "/en/inquiry";
      if (pathname === "/privacy") return "/en/privacy";
      if (pathname === "/terms") return "/en/terms";

      return "/en";
    }

    if (!pathname?.startsWith("/en")) return pathname || "/";
    if (pathname === "/en/product") return "/product";
    if (pathname === "/en/experience") return "/experience";
    if (pathname === "/en/business") return "/business";
    if (pathname === "/en/ingredients") return "/ingredients";
    if (pathname === "/en/locations") return "/locations";
    if (pathname === "/en/support") return "/support";
    if (pathname === "/en/inquiry") return "/inquiry";
    if (pathname === "/en/privacy") return "/privacy";
    if (pathname === "/en/terms") return "/terms";

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
        aria-label={menuLabel}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <Link href={logoHref} className={styles.logo} aria-label={logoLabel} onClick={() => setMobileMenuOpen(false)}>
        <Image src={withBasePath("/images/vrink/apple/vrink-logo.svg")} alt="" width={140} height={40} priority />
      </Link>
      <nav className={styles.nav} aria-label={navLabel}>
        {navItems[locale].map((item) => (
          item.disabled ? (
            <span className={styles.navDisabled} aria-disabled="true" key={item.label}>
              {item.label}
            </span>
          ) : (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          )
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
            aria-label={languageLabel}
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
        <nav className={styles.mobileNav} aria-label={mobileNavLabel}>
          {navItems[locale].map((item) => (
            item.disabled ? (
              <span className={styles.mobileNavDisabled} aria-disabled="true" key={item.label}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} key={item.label} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </Link>
            )
          ))}
        </nav>
        <div className={styles.mobileMenuMeta}>
          <div className={styles.mobileLanguageLinks} aria-label={languageLabel}>
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
