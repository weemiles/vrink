/**
 * TDS 제품 운영 확장 3-11, §4.2 — 지원 코드 시스템
 *
 * - 길이: 8~12자 (기본 10자)
 * - 형식: 대문자 + 숫자 혼합 (모호한 문자 I, O, 0, 1 제외)
 * - 유효기간: 30일
 * - CS 확인 가능 최소 정보: 상태, 실패 사유 코드, 타임스탬프
 * - 개인 식별 정보(PII) 비노출
 */

const SUPPORT_CODE_LENGTH = 10;
const SUPPORT_CODE_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** 모호한 문자(I, O, 0, 1) 제거 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface SupportCode {
  code: string;
  createdAt: number;
  status: 'success' | 'failure';
  reason?: string;
  screenName: string;
}

/** 랜덤 지원 코드 생성 */
export function generateSupportCode(length: number = SUPPORT_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/** 지원 코드 유효기간 검사 */
export function isSupportCodeValid(createdAt: number): boolean {
  return Date.now() - createdAt < SUPPORT_CODE_VALIDITY_MS;
}

/** 표시용 포맷 (4자리 그룹핑): ABCD-EFGH-JK */
export function formatSupportCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') || code;
}

/** 메타데이터와 함께 지원 코드 생성 */
export function createSupportCode(
  screenName: string,
  status: 'success' | 'failure',
  reason?: string,
): SupportCode {
  return {
    code: generateSupportCode(),
    createdAt: Date.now(),
    status,
    reason,
    screenName,
  };
}
