/**
 * useLanguage.tsx
 * ─────────────────────────────────────────
 * keppin i18n Context + Provider + Hook
 *
 * - 지원 언어: ko, en
 * - localStorage 영속화 (키: __keppin_lang)
 * - t(key, params?) 함수로 번역 조회
 * - 플레이스홀더 보간: {key} → params.key
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import translations, { type Lang, LANG_LABELS } from '../data/translations';

/* ═══════════════════════════════════════
   Constants
   ═══════════════════════════════════════ */
const LS_LANG_KEY = '__keppin_lang';
const DEFAULT_LANG: Lang = 'ko';

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem(LS_LANG_KEY);
    if (stored === 'ko' || stored === 'en') return stored;
  } catch { /* ignore */ }
  return DEFAULT_LANG;
}

function persistLang(lang: Lang) {
  try {
    localStorage.setItem(LS_LANG_KEY, lang);
  } catch { /* ignore */ }
}

/* ═══════════════════════════════════════
   Context
   ═══════════════════════════════════════ */
interface LanguageContextValue {
  /** 현재 언어 코드 */
  lang: Lang;
  /** 언어 변경 */
  setLang: (lang: Lang) => void;
  /** 번역 함수 — t('settings.title') 또는 t('settings.push.desc', { weeklyMax: 3 }) */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
});

/* ═══════════════════════════════════════
   Provider
   ═══════════════════════════════════════ */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
    // html lang 속성 업데이트 — §4 한국어 텍스트 줄바꿈 정책 활성화에 필요
    document.documentElement.lang = next;
  }, []);

  // §4 컴포넌트 시스템화 보강판: 초기 마운트 시에도 lang 속성 설정
  // → CSS word-break: keep-all 적용을 위해 html:lang(ko) 선택자 활성화
  if (typeof document !== 'undefined' && document.documentElement.lang !== lang) {
    document.documentElement.lang = lang;
  }

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[lang] ?? translations[DEFAULT_LANG];
      let text = dict[key];

      // fallback → 기본 언어
      if (text === undefined) {
        text = translations[DEFAULT_LANG][key];
      }
      // fallback → key 자체
      if (text === undefined) {
        return key;
      }

      // 플레이스홀더 보간: {name} → params.name
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text!.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }

      return text;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ═══════════════════════════════════════
   Hook
   ═══════════════════════════════════════ */
export function useLanguage() {
  return useContext(LanguageContext);
}

/* Re-export for convenience */
export { LANG_LABELS };
export type { Lang };