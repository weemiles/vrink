/**
 * TDS 제품 품질/운영 확장 규칙 9, §3 — 콘텐츠/카피 시스템
 * + UX/UI 확장 운영 규칙 30, §6 — UX Writing / 마이크로카피 규칙
 *
 * §3.1 문장 길이 제한: 제목 18자, 본문 60자, 주요 CTA 2~6자, 보조 CTA 2~8자, 토스트 20자
 * §3.2 금지 패턴: "잠시 후"→"다시 시도", "문제가 발생"→원인 카테고리, "잘못하셨"→"다시 확인"
 * §3.3 에러 문구 3파트 템플릿: 결과 + 원인 카테고리 + 다음 행동
 * §3.4 성공 문구: 감탄/과장 금지, 상태 변화 동사 ("저장했어요", "변경했어요")
 * §3.5 카피 ID: screenName.sectionName.messageName (수정 시 버전 올림)
 *
 * [확장30 §6 신규]
 * §6.1 에러 문장 구조(고정): 1) 무엇이 안 됐는지(사실) 2) 사용자가 지금 할 수 있는 행동(1개) 3) 필요한 경우에만 원인(추정 표현)
 * §6.2 길이/문장 수: 토스트 1문장 20자 이내, 다이얼로그 본문 2문장 이내
 * §6.3 금지 패턴: 사용자 탓 표현 금지, 모호한 표현 단독 사용 금지
 */

/* ─── §3.1 문장 길이 제한 ─── */
const COPY_LIMITS = {
  title: 18,
  description: 60,
  ctaPrimary: { min: 2, max: 6 },
  ctaSecondary: { min: 2, max: 8 },
  toast: 20,
} as const;

type CopyType = keyof typeof COPY_LIMITS;

/** §3.1 문장 길이 검증 */
export function validateCopyLength(
  text: string,
  type: CopyType,
): { valid: boolean; message?: string } {
  const limit = COPY_LIMITS[type];
  if (typeof limit === 'number') {
    if (text.length > limit) {
      return {
        valid: false,
        message: `${type}은(는) 최대 ${limit}자까지 가능합니다 (현재 ${text.length}자)`,
      };
    }
  } else {
    if (text.length < limit.min) {
      return { valid: false, message: `최소 ${limit.min}자 이상 필요합니다` };
    }
    if (text.length > limit.max) {
      return { valid: false, message: `최대 ${limit.max}자까지 가능합니다` };
    }
  }
  return { valid: true };
}

/* ─── §3.2 금지 패턴 ─── */
const BANNED_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /잠시\s*후/g, replacement: '다시 시도해주세요' },
  { pattern: /문제가\s*발생/g, replacement: '요청을 처리할 수 없어요' },
  { pattern: /잘못하셨/g, replacement: '다시 확인해주세요' },
  { pattern: /오류가\s*있/g, replacement: '확인이 필요해요' },
  { pattern: /에러/g, replacement: '문제' },
  { pattern: /실패하였/g, replacement: '완료할 수 없었어요' },
  { pattern: /불가능/g, replacement: '할 수 없어요' },
  { pattern: /올바르지\s*않/g, replacement: '다시 확인해주세요' },
];

/** §3.2 금지 패턴 치환 */
export function sanitizeCopy(text: string): string {
  let result = text;
  for (const { pattern, replacement } of BANNED_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/* ─── §3.3 에러 문구 3파트 템플릿 ─── */
export type ErrorCause = 'network' | 'permission' | 'input' | 'server' | 'unknown';

export interface ErrorTemplate {
  /** 무엇이 안 됐는지 (결과) */
  title: string;
  /** 왜 (원인 카테고리) */
  description: string;
  /** 다음 행동 — 주요 CTA */
  primaryCTA: string;
  /** 다음 행동 — 보조 CTA (선택) */
  secondaryCTA?: string;
  /** §3.5 카피 ID */
  copyId: string;
}

const ERROR_CAUSE_LABELS: Record<ErrorCause, string> = {
  network: '네트워크 연결이 불안정해요. 다시 시도해주세요.',
  permission: '접근 권한이 필요해요. 설정에서 확인해주세요.',
  input: '입력 정보를 확인해주세요.',
  server: '서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요.',
  unknown: '일시적인 문제가 있어요. 다시 시도해주세요.',
};

const ERROR_PRIMARY_CTA: Record<ErrorCause, string> = {
  network: '다시 시도',
  permission: '설정 열기',
  input: '다시 입력',
  server: '다시 시도',
  unknown: '다시 시도',
};

/** §3.3 에러 문구 3파트 템플릿 생성 */
export function buildErrorMessage(
  screenName: string,
  sectionName: string,
  cause: ErrorCause,
  customTitle?: string,
): ErrorTemplate {
  return {
    title: customTitle || '요청을 완료할 수 없어요',
    description: ERROR_CAUSE_LABELS[cause],
    primaryCTA: ERROR_PRIMARY_CTA[cause],
    secondaryCTA: undefined,
    copyId: `${screenName}.${sectionName}.error_${cause}`,
  };
}

/* ─── §3.4 성공 문구 규칙 ─── */
const SUCCESS_ACTION_MAP: Record<string, string> = {
  save: '저장했어요',
  edit: '수정했어요',
  delete: '삭제했어요',
  submit: '신청했어요',
  change: '변경했어요',
  add: '추가했어요',
  send: '보냈어요',
  cancel: '취소했어요',
  register: '등록했어요',
  connect: '연결했어요',
  disconnect: '연결을 해제했어요',
  enable: '켰어요',
  disable: '껐어요',
};

/** §3.4 성공 문구 — 감탄 금지, 상태 변화 동사 사용 */
export function buildSuccessMessage(action: string): string {
  return SUCCESS_ACTION_MAP[action] || `${action}했어요`;
}

/* ─── §3.5 카피 ID ─── */
/** 카피 ID 생성: screenName.sectionName.messageName */
export function makeCopyId(
  screenName: string,
  sectionName: string,
  messageName: string,
): string {
  return `${screenName}.${sectionName}.${messageName}`;
}

/** §3.5 카피 ID + 버전 관리: 수정 시 ID 버전을 올림 */
export function makeCopyIdVersioned(
  screenName: string,
  sectionName: string,
  messageName: string,
  version: number = 1,
): string {
  return `${screenName}.${sectionName}.${messageName}.v${version}`;
}

/** §3.2 금지 패턴 감지 (치환 없이 검사만) */
export function detectBannedPatterns(text: string): string[] {
  const found: string[] = [];
  for (const { pattern } of BANNED_PATTERNS) {
    // RegExp는 stateful이므로 lastIndex 리셋
    const regex = new RegExp(pattern.source, pattern.flags);
    if (regex.test(text)) {
      found.push(pattern.source);
    }
  }
  return found;
}

/* ─── §4.3 문의 CTA 기준 (확장 3-11 연동) ─── */
const ERROR_CONSECUTIVE_FOR_CS = 3;

/** 동일 에러 연속 N회 시 "문의하기" CTA 노출 여부 */
export function shouldShowContactCTA(consecutiveErrors: number): boolean {
  return consecutiveErrors >= ERROR_CONSECUTIVE_FOR_CS;
}

/* ═══════════════════════════════════════════════════════════
   확장30 §6 — UX Writing / 마이크로카피 규칙 (신규 추가)
   ═══════════════════════════════════════════════════════════ */

/* ─── §6.1 에러 문장 구조(고정) ─── */

/**
 * [운영 가드레일] 에러 메시지 순서 고정:
 * 1) 무엇이 안 됐는지 (사실)
 * 2) 사용자가 지금 할 수 있는 행동 (1개)
 * 3) 필요한 경우에만 원인 (추정 표현)
 */
export interface MicrocopyError {
  /** 1) 무엇이 안 됐는지 — 사실 */
  fact: string;
  /** 2) 사용자가 지금 할 수 있는 행동 */
  action: string;
  /** 3) 원인 (선택적, 추정 표현) */
  cause?: string;
}

/** §6.1 에러 메시지 조합 */
export function composeMicrocopyError(error: MicrocopyError): string {
  const parts = [error.fact, error.action];
  if (error.cause) {
    parts.push(error.cause);
  }
  return parts.join(' ');
}

/* ─── §6.2 길이/문장 수 제한 ─── */

export const MICROCOPY_LIMITS = {
  /** [운영 가드레일] 토스트/짧은 피드백: 1문장, 20자 이내 기본 */
  toast: { maxSentences: 1, maxChars: 20 },
  /** [운영 가드레일] 다이얼로그 본문: 2문장 이내 */
  dialog: { maxSentences: 2, maxChars: 120 },
} as const;

type MicrocopyType = keyof typeof MICROCOPY_LIMITS;

/** §6.2 마이크로카피 길이 검증 */
export function validateMicrocopy(
  text: string,
  type: MicrocopyType,
): { valid: boolean; warnings: string[] } {
  const limit = MICROCOPY_LIMITS[type];
  const warnings: string[] = [];

  // 문장 수 체크 (마침표/느낌표/물음표 기준)
  const sentences = text.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > limit.maxSentences) {
    warnings.push(`${type}: ${limit.maxSentences}문장 이내여야 해요 (현재 ${sentences.length}문장)`);
  }

  // 글자 수 체크
  if (text.length > limit.maxChars) {
    warnings.push(`${type}: ${limit.maxChars}자 이내여야 해요 (현재 ${text.length}자)`);
  }

  return { valid: warnings.length === 0, warnings };
}

/* ─── §6.3 금지 패턴 (확장) ─── */

/**
 * [운영 가드레일] 사용자 탓 표현 금지:
 * - "올바르게 입력하세요" 단독 사용 금지
 * - "다시 확인하세요" 단독 사용 금지 (구체적 행동 포함해야 함)
 *
 * [운영 가드레일] 모호한 표현 금지:
 * - "오류가 발생했습니다" 단독 사용 금지 → 다음 행동 포함
 */
const BLAME_PATTERNS: RegExp[] = [
  /^올바르게 입력하세요\.?$/,
  /^다시 확인하세요\.?$/,
];

const VAGUE_PATTERNS: RegExp[] = [
  /^오류가 발생했습니다\.?$/,
  /^오류가 발생했어요\.?$/,
  /^에러가 발생했습니다\.?$/,
  /^문제가 생겼습니다\.?$/,
  /^문제가 생겼어요\.?$/,
];

/** §6.3 사용자 탓/모호 표현 감지 */
export function detectMicrocopyViolations(text: string): {
  hasBlame: boolean;
  hasVague: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const trimmed = text.trim();

  const hasBlame = BLAME_PATTERNS.some((p) => p.test(trimmed));
  if (hasBlame) violations.push('사용자 탓 표현이 감지되었어요. 구체적 안내를 추가해주세요.');

  const hasVague = VAGUE_PATTERNS.some((p) => p.test(trimmed));
  if (hasVague) violations.push('모호한 표현이에요. 사용자가 할 수 있는 다음 행동을 포함해주세요.');

  return { hasBlame, hasVague, violations };
}

/** §6.1+§6.3 통합 검증: 에러 메시지가 올바른 구조/길이/패턴인지 확인 */
export function validateErrorCopy(
  text: string,
  type: MicrocopyType = 'dialog',
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // §6.2 길이/문장 수 검증
  const lengthResult = validateMicrocopy(text, type);
  issues.push(...lengthResult.warnings);

  // §6.3 금지 패턴 검증
  const violations = detectMicrocopyViolations(text);
  issues.push(...violations.violations);

  // §3.2 기존 금지 패턴 검증
  const bannedResults = detectBannedPatterns(text);
  if (bannedResults.length > 0) {
    issues.push('금지 패턴이 포함되어 있어요. sanitizeCopy()로 치환해주세요.');
  }

  return { valid: issues.length === 0, issues };
}