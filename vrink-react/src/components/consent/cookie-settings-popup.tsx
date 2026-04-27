"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import styles from "./cookie-settings-popup.module.css";

const STORAGE_KEY = "vrink-cookie-consent-v1";

type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

const subscribeToConsentStore = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getConsentSnapshot = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

const getServerConsentSnapshot = () => true;

export function CookieSettingsPopup() {
  const hasStoredConsent = useSyncExternalStore(
    subscribeToConsentStore,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  const savePreferences = (nextPreferences: CookiePreferences) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...nextPreferences,
          essential: true,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // If storage is unavailable, close the popup for this page view.
    }

    setIsDismissed(true);
  };

  const updatePreference = (key: "analytics" | "marketing", value: boolean) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }));
  };

  if (hasStoredConsent || isDismissed) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="쿠키 설정">
        <div className={styles.header}>
          <p>쿠키 설정</p>
          <h2>브링크 경험을 더 편하게 만들기 위해 쿠키를 사용합니다.</h2>
        </div>

        <p className={styles.description}>
          필수 쿠키는 서비스 제공을 위해 항상 사용되며, 분석 및 마케팅 쿠키는 선택 동의 후에만 사용됩니다.
          자세한 내용은{" "}
          <Link href="/privacy">개인정보처리방침</Link>
          에서 확인할 수 있습니다.
        </p>

        <div className={styles.optionList}>
          <label className={styles.option}>
            <span>
              <strong>필수 쿠키</strong>
              <small>보안, 페이지 이동, 기본 기능 제공에 필요합니다.</small>
            </span>
            <input checked disabled type="checkbox" />
            <span className={styles.switch} aria-hidden="true" />
          </label>

          <label className={styles.option}>
            <span>
              <strong>분석 쿠키</strong>
              <small>방문 흐름과 사용성을 이해해 서비스를 개선합니다.</small>
            </span>
            <input
              checked={preferences.analytics}
              type="checkbox"
              onChange={(event) => updatePreference("analytics", event.target.checked)}
            />
            <span className={styles.switch} aria-hidden="true" />
          </label>

          <label className={styles.option}>
            <span>
              <strong>마케팅 쿠키</strong>
              <small>브링크 소식과 맞춤형 안내를 제공하는 데 활용합니다.</small>
            </span>
            <input
              checked={preferences.marketing}
              type="checkbox"
              onChange={(event) => updatePreference("marketing", event.target.checked)}
            />
            <span className={styles.switch} aria-hidden="true" />
          </label>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => savePreferences(defaultPreferences)}
          >
            필수만 허용
          </button>
          <button
            className={styles.outlineButton}
            type="button"
            onClick={() => savePreferences(preferences)}
          >
            선택 저장
          </button>
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
            모두 허용
          </button>
        </div>
      </section>
    </div>
  );
}
