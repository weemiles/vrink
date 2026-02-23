/**
 * TDS 제품 운영 확장 4-12, §1 — Input 실무 운영 규칙
 * + 제품 운영 확장 (수치 중심) 7, §2 — Form 검증/마스킹/에러 표준화
 *
 * §1.1 입력 길이 기준: name 30, address 200, search 50, pin 6, govId 13
 * §1.2 검증 타이밍: onChange=포맷만, onBlur=형식검증+에러, submit=서버검증+첫에러포커스
 * §1.3 에러: 필드당 1문장, 최대 30자, 우선순위 필수>형식>범위/정책
 * §1.4 자동 포맷: 숫자→toLocaleString, 전화→3-4-4, 카드/계좌→마스킹
 * §1.5 키보드/포커스: Next→다음 필드, 7개 이상→그룹분리
 * §1.6 삭제/초기화: Clear 버튼(필드 내부), 3개+ 폼→'전체 지우기' CTA
 *
 * [확장7 §2 신규]
 * §2.1 검증 타이밍 정책: 입력 중 형식 경고 최소화, blur 시 형식 검증 1회, submit 시 전체+에러 요약
 * §2.2 에러 메시지 1문장 + 해결 행동 1개 + 같은 필드 에러 1개만
 * §2.3 에러 우선순위: Required > Format > Range > Server validation
 * §2.4 입력 길이 기본값(권장): 이름 20자, 검색어 50자, 메모/요청사항 200자
 * §2.5 마스킹/포맷: 전화 3-4-4 자동하이픈, 카드 4-4-4-4, 생년월일 YYYY.MM.DD (1900~현재)
 * §2.6 제출 중 UX: 2초 초과 → 진행 상태 문구 1줄 + 취소 가능 시 "취소" 제공
 */

/** §1.1 — 용도별 최대 입력 길이 */
export const INPUT_MAX_LENGTH = {
  name: 30,
  address: 200,
  search: 50,
  pin: 6,
  govId: 13,
  email: 100,
  password: 64,
  memo: 500,
  general: 200,
} as const;

/** §1.3 에러 메시지 최대 문자 수 */
export const ERROR_MAX_CHARS = 30;

/** §1.3 에러 우선순위 */
export type ValidationErrorType = 'required' | 'format' | 'range' | 'server';

interface ValidationError {
  type: ValidationErrorType;
  message: string;
}

/** §1.3 에러 우선순위 정렬 — 필수>형식>범위/정책>서버 (확장7 §2.3 서버 검증 추가) */
const ERROR_PRIORITY: Record<ValidationErrorType, number> = {
  required: 0,
  format: 1,
  range: 2,
  server: 3,
};

/**
 * §1.3 여러 에러 중 우선순위가 가장 높은 1개만 반환 (최대 30자)
 */
export function pickTopError(errors: ValidationError[]): string | undefined {
  if (errors.length === 0) return undefined;
  const sorted = [...errors].sort((a, b) => ERROR_PRIORITY[a.type] - ERROR_PRIORITY[b.type]);
  const msg = sorted[0].message;
  // §1.3 30자 제한 — 초과 시 자르기
  return msg.length > ERROR_MAX_CHARS ? msg.slice(0, ERROR_MAX_CHARS) : msg;
}

/**
 * §1.2 검증 타이밍별 검증 함수 팩토리
 *
 * - onChange: 형식 보정(formatting)만, 에러 노출 금지
 * - onBlur: 형식 검증 + 에러 노출 (1개만)
 * - submit: 서버 검증 포함 최종 검증, 첫 에러 필드로 스크롤/포커스
 */
export interface FieldValidationRules {
  required?: boolean;
  requiredMessage?: string;
  /** 형식 검증 정규식 */
  pattern?: RegExp;
  patternMessage?: string;
  /** 범위/정책 커스텀 검증 */
  validate?: (value: string) => string | undefined;
  /** 최대 길이 */
  maxLength?: number;
  /** 최소 길이 */
  minLength?: number;
  minLengthMessage?: string;
}

/**
 * §1.2 onBlur 검증 — 형식 검증 + 에러 노출 (우선순위: 필수>형식>범위)
 */
export function validateOnBlur(value: string, rules: FieldValidationRules): string | undefined {
  const errors: ValidationError[] = [];

  // 1) 필수
  if (rules.required && (!value || value.trim() === '')) {
    errors.push({ type: 'required', message: rules.requiredMessage || '필수 입력 항목이에요' });
  }

  // 2) 형식 (빈 값이면 형식 검증 건너뛰기)
  if (value && rules.pattern && !rules.pattern.test(value)) {
    errors.push({ type: 'format', message: rules.patternMessage || '올바른 형식을 입력하세요' });
  }

  // 2-1) 최소 길이
  if (value && rules.minLength && value.length < rules.minLength) {
    errors.push({ type: 'format', message: rules.minLengthMessage || `${rules.minLength}자 이상 입력하세요` });
  }

  // 3) 범위/정책
  if (value && rules.validate) {
    const msg = rules.validate(value);
    if (msg) errors.push({ type: 'range', message: msg });
  }

  return pickTopError(errors);
}

/**
 * §1.2 submit 검증 — 전체 필드 검증, 첫 에러 필드 ID 반환
 */
export function validateOnSubmit(
  fields: { id: string; value: string; rules: FieldValidationRules }[],
): { valid: boolean; firstErrorId?: string; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const error = validateOnBlur(field.value, field.rules);
    if (error) {
      errors[field.id] = error;
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    valid: errorKeys.length === 0,
    firstErrorId: errorKeys.length > 0 ? errorKeys[0] : undefined,
    errors,
  };
}

/**
 * §1.2 제출 실패 시 첫 에러 필드로 스크롤/포커스 이동
 */
export function focusFirstErrorField(fieldId: string): void {
  const el = document.getElementById(fieldId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus();
  }
}

/* ===== §1.4 자동 포맷 유틸리티 ===== */

/** §1.4 숫자/금액 포맷: 표시용 (콤마) → 저장용 (숫자만) */
export function formatNumber(value: string): { display: string; raw: string } {
  const raw = value.replace(/[^0-9]/g, '');
  if (!raw) return { display: '', raw: '' };
  const num = parseInt(raw, 10);
  return {
    display: num.toLocaleString('ko-KR'),
    raw,
  };
}

/** §1.4 전화번호 포맷: 3-4-4 (표시용), 숫자만 (저장용) */
export function formatPhone(value: string): { display: string; raw: string } {
  const raw = value.replace(/[^0-9]/g, '');
  if (raw.length <= 3) return { display: raw, raw };
  if (raw.length <= 7) return { display: `${raw.slice(0, 3)}-${raw.slice(3)}`, raw };
  return { display: `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`, raw: raw.slice(0, 11) };
}

/** §1.4 카드번호 포맷: 4-4-4-4 (마스킹 포함) */
export function formatCard(value: string, mask = true): { display: string; raw: string } {
  const raw = value.replace(/[^0-9]/g, '').slice(0, 16);
  const groups = raw.match(/.{1,4}/g) || [];
  if (mask && groups.length >= 3) {
    // 가운데 그룹 마스킹
    const masked = groups.map((g, i) => (i === 1 || i === 2) ? '****' : g);
    return { display: masked.join('-'), raw };
  }
  return { display: groups.join('-'), raw };
}

/**
 * §2.5 (확장7) 생년월일 포맷: YYYY.MM.DD, 유효 범위 1900~현재
 */
export function formatBirthDate(value: string): { display: string; raw: string; valid: boolean } {
  const raw = value.replace(/[^0-9]/g, '').slice(0, 8);
  if (raw.length <= 4) return { display: raw, raw, valid: false };
  if (raw.length <= 6) return { display: `${raw.slice(0, 4)}.${raw.slice(4)}`, raw, valid: false };

  const display = `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
  const year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10);
  const day = parseInt(raw.slice(6, 8), 10);

  const currentYear = new Date().getFullYear();
  const valid =
    year >= 1900 && year <= currentYear &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31;

  return { display, raw, valid };
}

/* ===== §2.4 (확장7) 권장 입력 길이 기본값 — 기존 INPUT_MAX_LENGTH 보완 ===== */

/** §2.4 권장 입력 길이 기본값 (확장7 §2.4) */
export const RECOMMENDED_MAX_LENGTH = {
  /** 이름: 최대 20자 */
  name: 20,
  /** 검색어: 최대 50자 (기존과 일치) */
  search: 50,
  /** 메모/요청사항: 최대 200자 */
  memo: 200,
} as const;

/* ===== §2.6 (확장7) 제출 중 UX — 2초 초과 규칙 ===== */

/** §2.6 제출 응답 시간 임계치 (ms) — 초과 시 진행 상태 문구 표시 */
export const SUBMIT_SLOW_THRESHOLD_MS = 2000;

export interface SubmitProgressState {
  /** 현재 상태 */
  phase: 'idle' | 'submitting' | 'slow' | 'done' | 'cancelled';
  /** 진행 상태 문구 (2초 초과 시) */
  progressMessage?: string;
  /** 취소 가능 여부 */
  canCancel: boolean;
}

/**
 * §2.6 제출 진행 상태 계산
 *
 * @param elapsedMs 제출 시작 후 경과 시간
 * @param isCancellable 취소 가능 작업 여부
 */
export function getSubmitProgressState(
  elapsedMs: number,
  isCancellable: boolean = false,
): SubmitProgressState {
  if (elapsedMs <= 0) {
    return { phase: 'idle', canCancel: false };
  }
  if (elapsedMs < SUBMIT_SLOW_THRESHOLD_MS) {
    return { phase: 'submitting', canCancel: false };
  }
  return {
    phase: 'slow',
    progressMessage: '저장하고 있어요',
    canCancel: isCancellable,
  };
}

/* ===== §1.5 키보드/포커스 유틸리티 ===== */

/** §1.5 7개 이상 필드면 그룹/섹션 분리 필요 */
export const FIELDS_GROUP_THRESHOLD = 7;

/** §1.6 3개 이상 필드면 '전체 지우기' CTA 필요 */
export const CLEAR_ALL_THRESHOLD = 3;

/** §1.5 다음 필드로 포커스 이동 */
export function focusNextField(currentId: string, fieldIds: string[]): void {
  const idx = fieldIds.indexOf(currentId);
  if (idx >= 0 && idx < fieldIds.length - 1) {
    const nextEl = document.getElementById(fieldIds[idx + 1]);
    nextEl?.focus();
  }
}