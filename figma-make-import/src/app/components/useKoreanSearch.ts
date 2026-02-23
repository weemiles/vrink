/**
 * useKoreanSearch.ts
 * ────────────────────────────────────────────────
 * 한글 초성(자음) 검색 + 혼합 검색 유틸리티.
 *
 * 지원 패턴:
 *  1) 정확한 부분 문자열 ("홍길")
 *  2) 초성만 검색 ("ㅎㄱ" → "홍길동")
 *  3) 혼합 검색 ("홍ㄱ" → "홍길동")
 *  4) 전화번호 검색 ("1234" → "010-1234-5678")
 *  5) 대소문자 무시 영문 검색
 */

/* ═══════════════════════════════════════════════
   한글 유니코드 상수
   ═══════════════════════════════════════════════ */

const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

/** 초성 19자 (유니코드 순) */
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

/** 중성 21자 */
const JUNGSUNG_COUNT = 21;
/** 종성 28자 (없음 포함) */
const JONGSUNG_COUNT = 28;

/** 자음 문자 집합 (초성으로 사용 가능한 자음) */
const JAMO_SET = new Set<string>([
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]);

/* ═══════════════════════════════════════════════
   유틸리티 함수
   ═══════════════════════════════════════════════ */

/** 완성형 한글인지 판별 */
function isHangulSyllable(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

/** 자음(자모)인지 판별 */
function isJamo(ch: string): boolean {
  return JAMO_SET.has(ch);
}

/** 완성형 한글에서 초성 인덱스 추출 */
function getChosungIndex(ch: string): number {
  return Math.floor((ch.charCodeAt(0) - HANGUL_START) / (JUNGSUNG_COUNT * JONGSUNG_COUNT));
}

/** 완성형 한글에서 초성 문자 추출 */
export function getChosung(ch: string): string {
  if (!isHangulSyllable(ch)) return ch;
  return CHOSUNG_LIST[getChosungIndex(ch)];
}

/** 문자열의 초성만 추출 (비한글은 원본 유지) */
export function extractChosung(text: string): string {
  return Array.from(text).map(getChosung).join('');
}

/**
 * 자모 → 초성 인덱스 매핑.
 * 입력된 자음이 어떤 초성 인덱스에 해당하는지 반환.
 */
function jamoToChosungIndex(jamo: string): number {
  return CHOSUNG_LIST.indexOf(jamo as any);
}

/**
 * 쿼리의 단일 문자가 텍스트의 단일 문자와 매칭되는지 판별.
 * - 자음(ㅎ) → 텍스트 글자의 초성이 ㅎ이면 매칭
 * - 완성형(홍) → 정확히 같거나, 초성/중성이 같고 종성이 없는 경우(부분 매칭)
 * - 비한글 → 대소문자 무시 비교
 */
function charMatch(textChar: string, queryChar: string): boolean {
  // 1) 쿼리가 자음이면 초성 비교
  if (isJamo(queryChar)) {
    if (isHangulSyllable(textChar)) {
      return getChosung(textChar) === queryChar;
    }
    return false;
  }

  // 2) 정확히 같은 문자
  if (textChar === queryChar) return true;

  // 3) 대소문자 무시 비교 (비한글)
  if (textChar.toLowerCase() === queryChar.toLowerCase()) return true;

  // 4) 쿼리가 완성형 한글이고 종성이 없으면 → 초성+중성만 비교
  //    예: "홍" = 초성(ㅎ) + 중성(ㅗ) + 종성(ㅇ) → 이건 종성 있음, 정확 비교만
  //    이 로직은 charMatch에서 불필요 — exact match로 충분
  return false;
}

/* ═══════════════════════════════════════════════
   핵심 검색 함수
   ═══════════════════════════════════════════════ */

/**
 * 초성/혼합 검색 — 쿼리가 텍스트와 매칭되는 위치(시작 인덱스) 배열 반환.
 * 매칭되지 않으면 빈 배열.
 *
 * 예: matchKorean("홍길동", "ㅎㄱ") → [{start: 0, length: 2}]
 * 예: matchKorean("홍길동", "홍ㄱ") → [{start: 0, length: 2}]
 */
export interface MatchRange {
  start: number;
  length: number;
}

export function matchKorean(text: string, query: string): MatchRange[] {
  if (!text || !query) return [];

  const textChars = Array.from(text);
  const queryChars = Array.from(query);
  const ranges: MatchRange[] = [];

  for (let i = 0; i <= textChars.length - queryChars.length; i++) {
    let matched = true;
    for (let j = 0; j < queryChars.length; j++) {
      if (!charMatch(textChars[i + j], queryChars[j])) {
        matched = false;
        break;
      }
    }
    if (matched) {
      ranges.push({ start: i, length: queryChars.length });
    }
  }

  return ranges;
}

/**
 * 통합 검색 — 여러 필드에 대해 매칭 여부와 하이라이트 범위를 반환.
 */
export interface SearchResult {
  matched: boolean;
  /** 이름 필드 매칭 범위 (charIndex 기반) */
  nameRanges: MatchRange[];
  /** 메모 필드 매칭 범위 */
  memoRanges: MatchRange[];
  /** 전화번호 매칭 여부 */
  phoneMatched: boolean;
}

export function searchContact(
  name: string,
  memo: string,
  phone: string | undefined,
  query: string,
): SearchResult {
  const result: SearchResult = {
    matched: false,
    nameRanges: [],
    memoRanges: [],
    phoneMatched: false,
  };

  if (!query) return result;

  // 1) 이름 매칭 (초성/혼합 지원)
  result.nameRanges = matchKorean(name, query);

  // 2) 메모 매칭 (초성/혼합 지원)
  result.memoRanges = matchKorean(memo, query);

  // 3) 전화번호 매칭 (숫자만 비교)
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    const queryDigits = query.replace(/\D/g, '');
    if (queryDigits.length >= 2 && phoneDigits.includes(queryDigits)) {
      result.phoneMatched = true;
    }
  }

  result.matched = result.nameRanges.length > 0
    || result.memoRanges.length > 0
    || result.phoneMatched;

  return result;
}

/**
 * 쿼리가 전부 자음(초성)인지 판별.
 * 검색 placeholder 힌트에 사용.
 */
export function isAllChosung(query: string): boolean {
  return Array.from(query).every(isJamo);
}

/**
 * 하이라이트용: MatchRange[] → {start, end}[] 변환 (최대 maxCount개).
 * 기존 getHighlightRanges와 호환되는 형식.
 */
export function matchRangesToHighlightRanges(
  ranges: MatchRange[],
  maxCount: number = 3,
): Array<{ start: number; end: number }> {
  return ranges
    .slice(0, maxCount)
    .map(r => ({ start: r.start, end: r.start + r.length }));
}
