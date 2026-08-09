export const CONSENT_STORAGE_KEY = "vrink-cookie-consent-v1";
export const CONSENT_CHANGE_EVENT = "vrink:consent-change";
export const CONSENT_OPEN_EVENT = "vrink:consent-open";

export type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type StoredConsent = CookiePreferences & {
  savedAt?: string;
};

export function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

export function writeConsent(preferences: CookiePreferences): void {
  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        ...preferences,
        essential: true,
        savedAt: new Date().toISOString(),
      }),
    );

    // 같은 탭에서도 즉시 반영되도록 커스텀 이벤트를 발행한다.
    // (storage 이벤트는 다른 탭에서만 발생하기 때문)
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  } catch {
    // localStorage 사용 불가(시크릿 모드 등) — 저장만 건너뛴다.
  }
}

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true;
}
