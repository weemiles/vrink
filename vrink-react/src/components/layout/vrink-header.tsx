"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { withBasePath } from "@/lib/static-export";
import styles from "./vrink-header.module.css";

const navItems = {
  ko: [
    ["제품", "/product"],
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
      <Link href={logoHref} className={styles.logo} aria-label={logoLabel}>
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
    </header>
  );
}
