/**
 * 소비자 앱 UX/UI 확장 규칙 (비중복) — 페이지 31
 * 가격/플랜 · 피드/타임라인 · 개인화 · 검색결과 UI · 신뢰 UI 가드레일
 *
 * TDS 철학을 소비자 앱 UI 설계에 적용하기 위한 확장 가드레일입니다.
 * 컴포넌트 Props/토큰 수치가 아닌, 화면을 실제로 그릴 때 필요한 UI 규칙만 정의합니다.
 */

/* ═══════════════════════════════════════════════
   §1 가격/플랜(유료화) UI — 비교표/가격표 가드레일
   ═══════════════════════════════════════════════ */

export const PRICING_GUARD = {
  /** §1.1 한 화면에서 비교하는 플랜 수: 최대 3개 */
  MAX_PLAN_COUNT: 3,
  /** §1.1 각 플랜 카드 핵심 정보 줄 수: 최대 6줄 */
  MAX_PLAN_CARD_LINES: 6,
  /** §1.1 '추천 플랜' 강조: 1개만 허용 */
  MAX_RECOMMENDED_PLANS: 1,

  /** §1.2 비교표(테이블) 행 수: 최대 10행 */
  MAX_COMPARISON_ROWS: 10,
  /** §1.2 10행 초과 시 카테고리 탭: 최대 3탭 */
  MAX_COMPARISON_TABS: 3,
  /** §1.2 표 셀당 줄 수: 최대 2줄 */
  MAX_CELL_LINES: 2,

  /** §1.3 할인/체험 배지 수: 카드당 최대 2개 */
  MAX_DISCOUNT_BADGES: 2,
  /** §1.3 숨겨진 비용 고지 문구 최대 길이: 18자(한글) */
  MAX_HIDDEN_COST_CHARS: 18,

  /** §1.4 결제 전 확인 화면 필수 필드 */
  CHECKOUT_REVIEW_FIELDS: [
    'planName',       // 플랜 이름
    'billingCycle',   // 결제 주기(월/연)
    'amount',         // 결제 금액
    'nextBillingDate', // 다음 결제일
  ] as const,
} as const;

/** §1.1 플랜 수 초과 검증 */
export function isPlanCountValid(count: number): boolean {
  return count <= PRICING_GUARD.MAX_PLAN_COUNT;
}

/** §1.2 비교표 행 수 초과 시 분리 전략 */
export type ComparisonOverflowStrategy =
  | { type: 'summary'; summaryRows: number; detailLink: boolean }
  | { type: 'tabs'; tabCount: number };

export function getComparisonOverflowStrategy(
  totalRows: number,
): ComparisonOverflowStrategy | null {
  if (totalRows <= PRICING_GUARD.MAX_COMPARISON_ROWS) return null;
  // 기본: 핵심 10개 + 전체 혜택 상세 링크
  return { type: 'summary', summaryRows: PRICING_GUARD.MAX_COMPARISON_ROWS, detailLink: true };
}

/** §1.3 할인 배지 개수 검증 */
export function isDiscountBadgeCountValid(count: number): boolean {
  return count <= PRICING_GUARD.MAX_DISCOUNT_BADGES;
}

/** §1.4 결제 전 확인 화면 필수 필드 검증 */
export function validateCheckoutReview(fields: Record<string, unknown>): {
  valid: boolean;
  missingFields: string[];
} {
  const missing = PRICING_GUARD.CHECKOUT_REVIEW_FIELDS.filter(
    (f) => !fields[f] && fields[f] !== 0,
  );
  return { valid: missing.length === 0, missingFields: [...missing] };
}

/* ═══════════════════════════════════════════════
   §2 피드/타임라인 UI — 슬롯/중복/완독 가드레일
   ═══════════════════════════════════════════════ */

export const FEED_GUARD = {
  /** §2.1 첫 화면(above the fold)에서 즉시 구분되는 카드 수: 최대 6개 */
  MAX_ABOVE_FOLD_CARDS: 6,
  /** §2.1 카드 1개당 행동 버튼: 최대 1개 (2개 이상 → '더보기' 접기) */
  MAX_CARD_ACTIONS: 1,
  /** §2.1 카드 2개 이상 액션 시 더보기 메뉴 사용 */
  MORE_MENU_THRESHOLD: 2,

  /** §2.2 같은 content_id 세션 내 최대 노출: 1회 */
  MAX_SAME_CONTENT_PER_SESSION: 1,
  /** §2.2 같은 content_id 24시간 내 최대 노출: 2회 */
  MAX_SAME_CONTENT_PER_24H: 2,

  /** §2.3 기본 정렬: 1개만 허용 */
  MAX_DEFAULT_SORTS: 1,
  /** §2.3 정렬/필터 컨트롤 슬롯: 최대 2개 */
  MAX_SORT_FILTER_SLOTS: 2,

  /** §2.4 저장/나중에 보기: 첫 N개 중 최대 M개만 1차 노출 */
  SAVE_FIRST_N_ITEMS: 10,
  SAVE_MAX_SHOWN: 3,
} as const;

/** §2.2 세션 내 콘텐츠 노출 추적 (새로고침 시 리셋) */
const sessionContentViews = new Map<string, number>();

/** §2.2 24시간 내 콘텐츠 노출 추적 (localStorage 기반) */
const CONTENT_VIEW_STORAGE_KEY = '__feed_content_views_24h';

interface ContentViewRecord {
  contentId: string;
  timestamps: number[];
}

function getContentViewRecords(): ContentViewRecord[] {
  try {
    const raw = localStorage.getItem(CONTENT_VIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContentViewRecords(records: ContentViewRecord[]) {
  try {
    localStorage.setItem(CONTENT_VIEW_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 무시
  }
}

/** §2.2 콘텐츠 노출 가능 여부 확인 */
export function canShowContentInFeed(contentId: string): boolean {
  // 세션 내 체크
  const sessionCount = sessionContentViews.get(contentId) ?? 0;
  if (sessionCount >= FEED_GUARD.MAX_SAME_CONTENT_PER_SESSION) return false;

  // 24시간 내 체크
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const records = getContentViewRecords();
  const record = records.find((r) => r.contentId === contentId);
  if (record) {
    const recentCount = record.timestamps.filter((t) => now - t < h24).length;
    if (recentCount >= FEED_GUARD.MAX_SAME_CONTENT_PER_24H) return false;
  }

  return true;
}

/** §2.2 콘텐츠 노출 기록 */
export function markContentShown(contentId: string) {
  // 세션 기록
  sessionContentViews.set(
    contentId,
    (sessionContentViews.get(contentId) ?? 0) + 1,
  );

  // 24시간 기록
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const records = getContentViewRecords();
  const record = records.find((r) => r.contentId === contentId);

  if (record) {
    record.timestamps = record.timestamps.filter((t) => now - t < h24);
    record.timestamps.push(now);
  } else {
    records.push({ contentId, timestamps: [now] });
  }

  // 오래된 기록 정리
  const cleaned = records
    .map((r) => ({
      ...r,
      timestamps: r.timestamps.filter((t) => now - t < h24),
    }))
    .filter((r) => r.timestamps.length > 0);

  saveContentViewRecords(cleaned);
}

/** §2.2 '이미 본 콘텐츠' 상태 계산 */
export type SeenContentDisplay = 'normal' | 'muted' | 'badge';

export function getSeenContentDisplay(contentId: string): SeenContentDisplay {
  const sessionCount = sessionContentViews.get(contentId) ?? 0;
  if (sessionCount > 0) return 'muted';
  return 'normal';
}

/** 세션 리셋 (로그아웃 등) */
export function resetFeedSession() {
  sessionContentViews.clear();
}

/* ═══════════════════════════════════════════════
   §3 개인화(추천/설정) UI — 조절 가능 항목만 노출
   ═══════════════════════════════════════════════ */

export const PERSONALIZATION_GUARD = {
  /** §3.1 설정 찾는 단계(탭 이동 포함): 최대 3스텝 */
  MAX_SETTING_STEPS: 3,

  /** §3.2 '왜 이걸 보나요?' 진입점: 상단 첫 5개 카드 중 1개에만 노출 */
  EXPLAINABILITY_TOP_N: 5,
  EXPLAINABILITY_MAX_SHOWN: 1,
  /** §3.2 설명 텍스트: 기본 1문장, 최대 2문장 */
  EXPLAIN_MIN_SENTENCES: 1,
  EXPLAIN_MAX_SENTENCES: 2,
  /** §3.2 문장당 최대 글자(한글): 20자 */
  EXPLAIN_MAX_CHARS_PER_SENTENCE: 20,

  /** §3.3 차단/관심없음 액션: 카드당 1개만 */
  MAX_BLOCK_ACTIONS_PER_CARD: 1,
  /** §3.3 차단 적용 시 Undo 기본 제공: 10초 */
  UNDO_TIMEOUT_MS: 10_000,
} as const;

/** §3.2 설명 텍스트 길이 검증 */
export function validateExplainText(text: string): {
  valid: boolean;
  sentenceCount: number;
  overLimitSentences: number[];
} {
  const sentences = text.split(/[.!?。]\s*/g).filter(Boolean);
  const overLimit = sentences
    .map((s, i) => (s.length > PERSONALIZATION_GUARD.EXPLAIN_MAX_CHARS_PER_SENTENCE ? i : -1))
    .filter((i) => i >= 0);

  return {
    valid:
      sentences.length <= PERSONALIZATION_GUARD.EXPLAIN_MAX_SENTENCES &&
      overLimit.length === 0,
    sentenceCount: sentences.length,
    overLimitSentences: overLimit,
  };
}

/* ═══════════════════════════════════════════════
   §4 검색 결과 UI — 정보 구조/스니펫/하이라이트 가드레일
   ═══════════════════════════════════════════════ */

export const SEARCH_RESULT_GUARD = {
  /** §4.1 결과 1개에 노출하는 텍스트 줄 수 상한 */
  MAX_TITLE_LINES: 1,
  MAX_META_LINES: 1,
  MAX_SNIPPET_LINES: 2,
  /** 합계: 최대 4줄 */
  MAX_TOTAL_LINES: 4,

  /** §4.2 하이라이트되는 단어 수: 최대 3개 */
  MAX_HIGHLIGHT_WORDS: 3,
  /** §4.2 하이라이트 스타일: 1가지만 (bold OR color, 동시 사용 금지) */
  HIGHLIGHT_STYLE: 'bold' as 'bold' | 'color',

  /** §4.3 검색 결과 리스트 바로 행동: 화면당 최대 1종 */
  MAX_INLINE_ACTIONS: 1,
} as const;

/** §4.2 검색어 하이라이트 유틸 — 최대 3개 단어만 하이라이트, bold만 사용 */
export function getHighlightRanges(
  text: string,
  query: string,
): Array<{ start: number; end: number }> {
  if (!query || !text) return [];

  const ranges: Array<{ start: number; end: number }> = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let searchFrom = 0;
  while (ranges.length < SEARCH_RESULT_GUARD.MAX_HIGHLIGHT_WORDS) {
    const idx = lowerText.indexOf(lowerQuery, searchFrom);
    if (idx === -1) break;
    ranges.push({ start: idx, end: idx + query.length });
    searchFrom = idx + query.length;
  }

  return ranges;
}

/* ═══════════════════════════════════════════════
   §5 신뢰 UI(사용자용) — 최근 활동/승인 내역/보안 이벤트
   ═══════════════════════════════════════════════ */

export const TRUST_UI_GUARD = {
  /** §5.1 활동 1행 고정 필드: 무엇, 언제, 어디서, 결과 */
  ACTIVITY_FIELDS: ['action', 'time', 'device', 'result'] as const,
  /** §5.1 화면 내 활동 타입(카테고리) 수: 최대 6개 */
  MAX_ACTIVITY_CATEGORIES: 6,

  /** §5.2 민감 이벤트 최소 보관 노출 기간: 7일 */
  SENSITIVE_EVENT_RETENTION_DAYS: 7,
  /** §5.2 민감 이벤트 종류 */
  SENSITIVE_EVENTS: [
    'password_change',
    'email_change',
    'phone_change',
    'new_device_login',
    'payment_method_change',
  ] as const,

  /** §5.3 '내가 한 활동이 아님' 흐름: 행동 1개로 고정 */
  MAX_NOT_ME_ACTIONS: 1,
  /** §5.3 추가 정보 입력: 최대 2개 필드 */
  MAX_NOT_ME_INPUT_FIELDS: 2,
} as const;

export type ActivityField = (typeof TRUST_UI_GUARD.ACTIVITY_FIELDS)[number];
export type SensitiveEventType = (typeof TRUST_UI_GUARD.SENSITIVE_EVENTS)[number];

export interface ActivityRecord {
  id: string;
  /** 무엇(행동명) */
  action: string;
  /** 언제(시간) */
  time: string;
  /** 어디서(디바이스/환경) */
  device: string;
  /** 결과(성공/실패) */
  result: 'success' | 'failure';
  /** 민감 이벤트 여부 */
  isSensitive: boolean;
  /** 이벤트 타입 */
  eventType?: SensitiveEventType | string;
  /** 타임스탬프 (정렬/보관 계산용) */
  timestamp: number;
}

/** §5.2 민감 이벤트 보관 기간 내인지 확인 */
export function isSensitiveEventVisible(record: ActivityRecord): boolean {
  if (!record.isSensitive) return true;
  const retentionMs = TRUST_UI_GUARD.SENSITIVE_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - record.timestamp < retentionMs;
}

/** §5.1 활동 카테고리 초과 시 필터링 — 최대 6개 */
export function limitActivityCategories<T extends { category: string }>(
  items: T[],
): { items: T[]; totalCategories: number; visibleCategories: string[] } {
  const categorySet = new Set(items.map((i) => i.category));
  const allCategories = Array.from(categorySet);

  if (allCategories.length <= TRUST_UI_GUARD.MAX_ACTIVITY_CATEGORIES) {
    return {
      items,
      totalCategories: allCategories.length,
      visibleCategories: allCategories,
    };
  }

  const visibleCategories = allCategories.slice(0, TRUST_UI_GUARD.MAX_ACTIVITY_CATEGORIES);
  return {
    items: items.filter((i) => visibleCategories.includes(i.category)),
    totalCategories: allCategories.length,
    visibleCategories,
  };
}

/* ═══════════════════════════════════════════════
   §6 적용 우선순위 — 현실적 최소 루트
   ═══════════════════════════════════════════════ */

export const IMPLEMENTATION_PRIORITY = [
  '1) 가격/플랜: 3플랜 상한 + 비교표 10행 상한',
  '2) 피드: content_id 중복 캡(세션 1회/24시간 2회)',
  '3) 개인화: 설정 3스텝 이내 + Undo 10초',
  '4) 검색 결과 UI: 결과 1개 4줄 상한 + 하이라이트 3개 상한',
  '5) 신뢰 UI: 최근 활동 4필드 고정 + 민감 이벤트 7일 노출',
] as const;
