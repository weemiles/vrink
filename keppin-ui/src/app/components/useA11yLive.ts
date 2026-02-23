import { useRef, useCallback } from 'react';

/**
 * TDS 제품 운영 확장 2-10, §1 — 접근성(A11y) 실운용 훅
 *
 * §1.1 스크린리더 라벨 품질 기준
 *   - 권장 10~30자, 절대 최대 45자 (초과 시 정보 구조 분리)
 *   - 라벨은 "명사+행동" 순서 고정 (예: "계좌번호 복사")
 *
 * §1.4 동적 콘텐츠 읽힘 규칙
 *   - 로딩 2초 초과 → 스크린리더용 상태 텍스트 1회만 제공
 *   - 성공/실패 → 스크린리더 공지 최대 1회
 *   - 10초 내 동일 이벤트(동일 메시지) 재공지 금지
 *
 * §1.5 입력 오류(Validation) 접근성
 *   - 필드당 오류 메시지 최대 1개
 *   - 오류 메시지 최대 40자
 *   - 오류 2개+ → 화면 상단 오류 요약 1개
 *
 * §1.6 접근성 회귀 체크 최소 5항목
 */

/* ─── 라벨 품질 상수 ─── */

const LABEL_MIN = 10;     // §1.1 권장 최소
const LABEL_MAX = 30;     // §1.1 권장 최대
const LABEL_HARD_MAX = 45; // §1.1 절대 최대

/* ─── 동적 콘텐츠 안내 상수 ─── */

const LOADING_ANNOUNCE_THRESHOLD = 2000; // §1.4 로딩 2초
const ANNOUNCE_DEDUP_MS = 10000;         // §1.4 동일 메시지 10초 재공지 금지
const ANNOUNCE_MAX = 1;                  // §1.4 상태 공지 최대 1회

/* ─── 입력 오류 접근성 상수 ─── */

const ERROR_PER_FIELD_MAX = 1;           // §1.5
const ERROR_MSG_MAX_CHARS = 40;          // §1.5
const ERROR_SUMMARY_THRESHOLD = 2;       // §1.5

/* ─── §1.1 라벨 품질 검사 ─── */

export interface LabelQualityResult {
  valid: boolean;
  length: number;
  warnings: string[];
}

/** §1.1 스크린리더 라벨 품질 검사 */
export function checkLabelQuality(label: string): LabelQualityResult {
  const length = label.length;
  const warnings: string[] = [];

  if (length < LABEL_MIN) {
    warnings.push(`라벨이 ${length}자입니다 (권장 최소 ${LABEL_MIN}자)`);
  }
  if (length > LABEL_HARD_MAX) {
    warnings.push(`라벨이 ${length}자입니다 (최대 ${LABEL_HARD_MAX}자, 정보 구조를 분리하세요)`);
  } else if (length > LABEL_MAX) {
    warnings.push(`라벨이 ${length}자입니다 (권장 최대 ${LABEL_MAX}자)`);
  }

  return {
    valid: length >= LABEL_MIN && length <= LABEL_HARD_MAX,
    length,
    warnings,
  };
}

/** §1.1 라벨 길이 안전 절단 (45자 초과 시 말줄임) */
export function truncateLabel(label: string): string {
  if (label.length <= LABEL_HARD_MAX) return label;
  return label.slice(0, LABEL_HARD_MAX - 1) + '\u2026'; // '…'
}

/* ─── §1.4 동적 콘텐츠 안내 훅 ─── */

// 전역 싱글톤: 최근 공지 메시지 중복 방지 맵
const recentAnnouncements = new Map<string, number>();

/**
 * §1.4 스크린리더 라이브 영역 안내 훅
 *
 * - 로딩 2초 초과 시 1회 안내
 * - 성공/실패 시 최대 1회 안내
 * - 10초 내 동일 메시지 재공지 금지
 */
export function useA11yLive() {
  const announceCountRef = useRef(new Map<string, number>());
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** aria-live 영역에 메시지 주입 (DOM 기반) */
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // §1.4 중복 체크: 10초 내 동일 메시지 재공지 금지
    const lastTime = recentAnnouncements.get(message);
    if (lastTime && Date.now() - lastTime < ANNOUNCE_DEDUP_MS) {
      return; // 중복 — 무시
    }

    // §1.4 동일 상태 최대 1회 체크
    const key = message;
    const count = announceCountRef.current.get(key) || 0;
    if (count >= ANNOUNCE_MAX) {
      return; // 이미 공지됨
    }

    // 공지 실행
    announceCountRef.current.set(key, count + 1);
    recentAnnouncements.set(message, Date.now());

    // aria-live 영역에 주입
    const liveRegion = document.getElementById(`a11y-live-${politeness}`);
    if (liveRegion) {
      liveRegion.textContent = '';
      // 짧은 딜레이로 스크린리더가 변경 감지하도록 함
      requestAnimationFrame(() => {
        liveRegion.textContent = message;
      });
    }
  }, []);

  /** §1.4 로딩 2초 초과 시 1회 안내 시작 */
  const startLoadingAnnounce = useCallback((message: string = '데이터를 불러오고 있습니다') => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      announce(message, 'polite');
    }, LOADING_ANNOUNCE_THRESHOLD);
  }, [announce]);

  /** 로딩 완료 시 타이머 해제 */
  const stopLoadingAnnounce = useCallback(() => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  /** §1.4 성공/실패 상태 공지 (1회) */
  const announceStatus = useCallback((status: 'success' | 'error', message: string) => {
    announce(message, status === 'error' ? 'assertive' : 'polite');
  }, [announce]);

  /** 공지 카운트 리셋 (화면 전환 시) */
  const resetAnnouncements = useCallback(() => {
    announceCountRef.current.clear();
  }, []);

  return {
    announce,
    startLoadingAnnounce,
    stopLoadingAnnounce,
    announceStatus,
    resetAnnouncements,
  };
}

/* ─── §1.5 입력 오류 접근성 ─── */

export interface FieldError {
  fieldId: string;
  fieldLabel: string;
  message: string;
}

export interface ValidationA11yResult {
  /** 검증 통과 여부 */
  valid: boolean;
  /** 필드별 오류 (1개씩만) */
  fieldErrors: FieldError[];
  /** §1.5 오류 2개+ 시 상단 요약 메시지 */
  summaryMessage: string | null;
  /** 오류 메시지 길이 위반 경고 */
  warnings: string[];
}

/** §1.5 입력 오류 접근성 규칙 적용 */
export function buildValidationA11y(errors: FieldError[]): ValidationA11yResult {
  const warnings: string[] = [];

  // §1.5 필드당 오류 1개만 유지 (첫 번째만)
  const fieldMap = new Map<string, FieldError>();
  for (const err of errors) {
    if (!fieldMap.has(err.fieldId)) {
      fieldMap.set(err.fieldId, err);
    }
  }
  const fieldErrors = Array.from(fieldMap.values()).slice(0, errors.length);

  // §1.5 오류 메시지 40자 제한 검사
  for (const err of fieldErrors) {
    if (err.message.length > ERROR_MSG_MAX_CHARS) {
      warnings.push(
        `"${err.fieldLabel}" 오류 메시지가 ${err.message.length}자입니다 (최대 ${ERROR_MSG_MAX_CHARS}자)`,
      );
    }
  }

  // §1.5 오류 2개+ → 상단 요약 1개
  const summaryMessage =
    fieldErrors.length >= ERROR_SUMMARY_THRESHOLD
      ? `${fieldErrors.length}개 항목을 확인해주세요`
      : null;

  return {
    valid: fieldErrors.length === 0,
    fieldErrors,
    summaryMessage,
    warnings,
  };
}

/* ─── §1.6 접근성 회귀 체크 (최소 5항목) ─── */

export interface A11yRegressionCheck {
  /** 1) 스크린리더 읽기 순서 */
  readingOrder: boolean;
  /** 2) 오버레이 포커스 트랩 */
  focusTrap: boolean;
  /** 3) 동적 상태 공지 중복 */
  dynamicAnnounce: boolean;
  /** 4) 입력 오류 연결 */
  inputErrorLink: boolean;
  /** 5) 중복 라벨 여부 */
  duplicateLabels: boolean;
}

/** §1.6 접근성 회귀 체크 실행 */
export function checkA11yRegression(checks: A11yRegressionCheck): {
  passed: boolean;
  failedItems: string[];
} {
  const failedItems: string[] = [];

  if (!checks.readingOrder) failedItems.push('스크린리더 읽기 순서');
  if (!checks.focusTrap) failedItems.push('오버레이 포커스 트랩');
  if (!checks.dynamicAnnounce) failedItems.push('동적 상태 공지 중복');
  if (!checks.inputErrorLink) failedItems.push('입력 오류 연결');
  if (!checks.duplicateLabels) failedItems.push('중복 라벨');

  return {
    passed: failedItems.length === 0,
    failedItems,
  };
}

/** 접근성 회귀 체크 세션 초기화 */
export function resetA11yLiveSession() {
  recentAnnouncements.clear();
}
