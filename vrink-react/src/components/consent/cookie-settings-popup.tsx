"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  CONSENT_OPEN_EVENT,
  CONSENT_STORAGE_KEY,
  readConsent,
  subscribeConsent,
  writeConsent,
  type CookiePreferences,
} from "@/lib/consent";

import styles from "./cookie-settings-popup.module.css";

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

const getConsentSnapshot = () => {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

const getServerConsentSnapshot = () => true;

type Locale = "ko" | "en";

const COPY = {
  ko: {
    ariaLabel: "쿠키 설정",
    eyebrow: "쿠키 설정",
    heading: "브링크 경험을 더 편하게 만들기 위해 쿠키를 사용합니다.",
    descriptionCompact:
      "필수 쿠키는 항상 사용되며, 분석 및 마케팅 쿠키는 선택 동의 후에만 사용됩니다.",
    descriptionFullPrefix:
      "필수 쿠키는 서비스 제공을 위해 항상 사용되며, 분석 및 마케팅 쿠키는 선택 동의 후에만 사용됩니다. 자세한 내용은 ",
    privacyLinkLabel: "개인정보처리방침",
    descriptionFullSuffix: "에서 확인할 수 있습니다.",
    essentialTitle: "필수 쿠키",
    essentialDesc: "보안, 페이지 이동, 기본 기능 제공에 필요합니다.",
    analyticsTitle: "분석 쿠키",
    analyticsDesc: "방문 흐름과 사용성을 이해해 서비스를 개선합니다.",
    marketingTitle: "마케팅 쿠키",
    marketingDesc: "브링크 소식과 맞춤형 안내를 제공하는 데 활용합니다.",
    alwaysOn: "항상 사용",
    settings: "설정",
    closeSettings: "설정 닫기",
    essentialOnly: "필수만 허용",
    saveSelection: "선택 저장",
    allowAll: "모두 허용",
  },
  en: {
    ariaLabel: "Cookie settings",
    eyebrow: "Cookie settings",
    heading: "We use cookies to make VRINK work better for you.",
    descriptionCompact:
      "Essential cookies are always on. Analytics and marketing cookies only run if you say yes.",
    descriptionFullPrefix:
      "Essential cookies are always on so the service works. Analytics and marketing cookies only run if you say yes. Want the details? Check our ",
    privacyLinkLabel: "Privacy Policy",
    descriptionFullSuffix: ".",
    essentialTitle: "Essential cookies",
    essentialDesc: "Needed for security, navigation, and core features.",
    analyticsTitle: "Analytics cookies",
    analyticsDesc: "Help us see how you use VRINK so we can make it better.",
    marketingTitle: "Marketing cookies",
    marketingDesc: "Used to share VRINK news and tips made for you.",
    alwaysOn: "Always on",
    settings: "Settings",
    closeSettings: "Close settings",
    essentialOnly: "Essential only",
    saveSelection: "Save choices",
    allowAll: "Allow all",
  },
} as const;

export function CookieSettingsPopup({ locale = "ko" }: { locale?: Locale } = {}) {
  const pathname = usePathname();
  const activeLocale = /(^|\/)en(?:\/|$)/.test(pathname) ? "en" : locale;
  const t = COPY[activeLocale];
  const hasStoredConsent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [isForcedOpen, setIsForcedOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const openSettings = () => {
      const storedConsent = readConsent();

      setPreferences({
        essential: true,
        analytics: storedConsent?.analytics ?? false,
        marketing: storedConsent?.marketing ?? false,
      });
      setIsDismissed(false);
      setIsForcedOpen(true);
      setIsSettingsOpen(true);
    };

    window.addEventListener(CONSENT_OPEN_EVENT, openSettings);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openSettings);
  }, []);

  const savePreferences = (nextPreferences: CookiePreferences) => {
    // 동의값 저장 + 변경 이벤트 발행(같은 탭에서 GA가 즉시 반응하도록).
    writeConsent(nextPreferences);
    setIsDismissed(true);
    setIsForcedOpen(false);
  };

  const updatePreference = (key: "analytics" | "marketing", value: boolean) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }));
  };

  if ((hasStoredConsent && !isForcedOpen) || isDismissed) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="false"
        aria-label={t.ariaLabel}
      >
        <div className={styles.summary}>
          <div className={styles.copyBlock}>
            <div className={styles.header}>
              <p>{t.eyebrow}</p>
              <h2>{t.heading}</h2>
            </div>

            <p className={styles.description}>
              {t.descriptionFullPrefix}
              <Link href={activeLocale === "en" ? "/en/privacy" : "/privacy"}>
                {t.privacyLinkLabel}
              </Link>
              {t.descriptionFullSuffix}
            </p>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() =>
                savePreferences({
                  essential: true,
                  analytics: true,
                  marketing: true,
                })
              }
            >
              {t.allowAll}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => savePreferences(defaultPreferences)}
            >
              {t.essentialOnly}
            </button>
            <button
              aria-expanded={isSettingsOpen}
              className={styles.settingsButton}
              type="button"
              onClick={() => setIsSettingsOpen((current) => !current)}
            >
              {isSettingsOpen ? t.closeSettings : t.settings}
            </button>
          </div>
        </div>

        {isSettingsOpen ? (
          <div className={styles.optionList}>
            <div className={styles.option}>
              <span>
                <strong>{t.essentialTitle}</strong>
                <small>{t.essentialDesc}</small>
              </span>
              <button
                aria-checked="true"
                aria-label={`${t.essentialTitle}: ${t.alwaysOn}`}
                className={styles.switchControl}
                disabled
                role="switch"
                type="button"
              >
                <span className={styles.switchThumb} />
              </button>
            </div>

            <div className={styles.option}>
              <span>
                <strong>{t.analyticsTitle}</strong>
                <small>{t.analyticsDesc}</small>
              </span>
              <button
                aria-checked={preferences.analytics}
                aria-label={t.analyticsTitle}
                className={styles.switchControl}
                onClick={() => updatePreference("analytics", !preferences.analytics)}
                role="switch"
                type="button"
              >
                <span className={styles.switchThumb} />
              </button>
            </div>

            <div className={styles.option}>
              <span>
                <strong>{t.marketingTitle}</strong>
                <small>{t.marketingDesc}</small>
              </span>
              <button
                aria-checked={preferences.marketing}
                aria-label={t.marketingTitle}
                className={styles.switchControl}
                onClick={() => updatePreference("marketing", !preferences.marketing)}
                role="switch"
                type="button"
              >
                <span className={styles.switchThumb} />
              </button>
            </div>

            <button
              className={styles.saveButton}
              type="button"
              onClick={() => savePreferences(preferences)}
            >
              {t.saveSelection}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
