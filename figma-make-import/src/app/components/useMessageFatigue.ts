import { useState, useCallback } from 'react';

/**
 * TDS 제품 운영 확장 3-11, §5.3 — 메시지 피로도 관리
 * + UX/UI 확장 운영 규칙 30, §8 — 알림(푸시/인앱) UX 운영 규칙
 *
 * - 인앱 팝업/배너: 동일 캠페인 세션당 1회
 * - 사용자가 닫으면 7일 재노출 금지
 * - [확장30 §8.1] 프로모션/마케팅 알림: 주 2회 상한
 *   - 거래/보안/필수: 상한 없음(단, 동일 이벤트 중복 발송 금지)
 * - [확장30 §8.2] 동일 주제 알림 10분 내 2건 이상 → 마지막 1건으로 병합
 */

const SUPPRESS_DAYS = 7; // §5.3
const DISMISS_STORAGE_KEY = '__msg_fatigue_dismiss';
const WEEKLY_COUNT_STORAGE_KEY = '__msg_fatigue_weekly';

/* ═══════════════════════════════════════════════
   §8.1 주간 빈도 상한
   ═══════════════════════════════════════════════ */

export type NotificationCategory = 'marketing' | 'transactional' | 'security';

export const NOTIFICATION_WEEKLY_LIMITS: Record<NotificationCategory, number> = {
  /** [운영 가드레일] 프로모션/마케팅: 주 2회 상한 */
  marketing: 2,
  /** 거래/보안/필수: 상한 없음 */
  transactional: Infinity,
  security: Infinity,
};

interface WeeklyCountRecord {
  category: string;
  weekStart: number; // 주 시작 타임스탬프 (월요일 00:00)
  count: number;
}

/** 현재 주의 시작 타임스탬프 (월요일 00:00 UTC+9) */
function getCurrentWeekStart(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일, 1=월 ...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

function getWeeklyCountRecords(): WeeklyCountRecord[] {
  try {
    const raw = localStorage.getItem(WEEKLY_COUNT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWeeklyCountRecords(records: WeeklyCountRecord[]) {
  try {
    localStorage.setItem(WEEKLY_COUNT_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 무시
  }
}

/** §8.1 주간 발송 횟수 조회 */
export function getWeeklyCount(category: NotificationCategory): number {
  const weekStart = getCurrentWeekStart();
  const records = getWeeklyCountRecords();
  const record = records.find((r) => r.category === category && r.weekStart === weekStart);
  return record?.count ?? 0;
}

/** §8.1 주간 상한 도달 여부 */
export function isWeeklyLimitReached(category: NotificationCategory): boolean {
  return getWeeklyCount(category) >= NOTIFICATION_WEEKLY_LIMITS[category];
}

/** §8.1 주간 발송 카운트 증가 */
export function incrementWeeklyCount(category: NotificationCategory): number {
  const weekStart = getCurrentWeekStart();
  const records = getWeeklyCountRecords();
  const existing = records.find((r) => r.category === category && r.weekStart === weekStart);

  if (existing) {
    existing.count += 1;
  } else {
    // 오래된 기록 정리 (2주 이전)
    const twoWeeksAgo = weekStart - 14 * 24 * 60 * 60 * 1000;
    const cleaned = records.filter((r) => r.weekStart >= twoWeeksAgo);
    cleaned.push({ category, weekStart, count: 1 });
    saveWeeklyCountRecords(cleaned);
    return 1;
  }

  saveWeeklyCountRecords(records);
  return existing.count;
}

/** §8.1 주간 남은 횟수 */
export function getRemainingWeeklyQuota(category: NotificationCategory): number {
  const limit = NOTIFICATION_WEEKLY_LIMITS[category];
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - getWeeklyCount(category));
}

/* ═══════════════════════════════════════════════
   §8.2 동일 주제 알림 병합
   ═══════════════════════════════════════════════ */

/** [운영 가드레일] 동일 주제 10분 내 2건 이상 → 병합 */
export const NOTIFICATION_MERGE_WINDOW_MS = 10 * 60 * 1000;
export const NOTIFICATION_MERGE_THRESHOLD = 2;

interface TopicRecord {
  topic: string;
  timestamps: number[];
}

const topicHistory: Map<string, number[]> = new Map();

/** §8.2 동일 주제 알림 병합 여부 판단 */
export function shouldMergeByTopic(topic: string): {
  shouldMerge: boolean;
  recentCount: number;
} {
  const now = Date.now();
  const timestamps = topicHistory.get(topic) || [];

  // 10분 이내 기록만 필터
  const recent = timestamps.filter((t) => now - t < NOTIFICATION_MERGE_WINDOW_MS);

  // 현재 알림 기록
  recent.push(now);
  topicHistory.set(topic, recent);

  return {
    shouldMerge: recent.length >= NOTIFICATION_MERGE_THRESHOLD,
    recentCount: recent.length,
  };
}

/** §8.2 병합된 알림 메시지 생성 */
export function getMergedNotificationMessage(topic: string, count: number): string {
  return `${topic} 관련 알림 ${count}건`;
}

/** §8.2 이력 초기화 (테스트용) */
export function resetTopicHistory(): void {
  topicHistory.clear();
}

/* ═══════════════════════════════════════════════
   §5.3 세션/7일 억제 (기존)
   ═══════════════════════════════════════════════ */

/** 세션 레벨 추적 (새로고침 시 리셋) */
const sessionShown = new Set<string>();

interface DismissRecord {
  campaignId: string;
  dismissedAt: number;
}

function getDismissRecords(): DismissRecord[] {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDismissRecords(records: DismissRecord[]) {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 스토리지 접근 불가 시 무시
  }
}

/** 특정 캠페인을 현재 세션/7일 내에 보여줄 수 있는지 확인 */
export function canShowCampaign(campaignId: string): boolean {
  // 세션 내 중복 방지
  if (sessionShown.has(campaignId)) return false;

  // 7일 억제 체크
  const records = getDismissRecords();
  const record = records.find((r) => r.campaignId === campaignId);
  if (record) {
    const suppressUntil =
      record.dismissedAt + SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() < suppressUntil) return false;
  }

  return true;
}

/**
 * §8.1 + §5.3 통합 확인: 카테고리 상한 + 세션/7일 억제 모두 통과해야 표시
 */
export function canShowNotification(
  campaignId: string,
  category: NotificationCategory = 'transactional',
): boolean {
  // §8.1 주간 상한 체크 (마케팅만 해당)
  if (category === 'marketing' && isWeeklyLimitReached(category)) {
    return false;
  }

  // §5.3 기존 세션/7일 억제
  return canShowCampaign(campaignId);
}

/** 캠페인 표시 기록 (세션 레벨) */
export function markCampaignShown(campaignId: string) {
  sessionShown.add(campaignId);
}

/** 캠페인 닫기 기록 (7일 억제) */
export function dismissCampaign(campaignId: string) {
  sessionShown.add(campaignId);
  const records = getDismissRecords().filter(
    (r) => r.campaignId !== campaignId,
  );
  records.push({ campaignId, dismissedAt: Date.now() });
  saveDismissRecords(records);
}

/** React hook — 캠페인 표시/닫기 관리 */
export function useMessageFatigue(campaignId: string) {
  const [visible, setVisible] = useState(() => canShowCampaign(campaignId));

  const show = useCallback(() => {
    if (canShowCampaign(campaignId)) {
      markCampaignShown(campaignId);
      setVisible(true);
    }
  }, [campaignId]);

  const dismiss = useCallback(() => {
    dismissCampaign(campaignId);
    setVisible(false);
  }, [campaignId]);

  return { visible, show, dismiss };
}

/**
 * §8.1 + §8.2 통합 알림 UX 훅
 *
 * - 주간 상한 체크 (마케팅 주 2회)
 * - 동일 주제 병합 판단
 * - 세션/7일 억제 체크
 */
export function useNotificationUX(
  campaignId: string,
  options?: {
    category?: NotificationCategory;
    topic?: string;
  },
) {
  const category = options?.category ?? 'transactional';
  const topic = options?.topic;

  const [visible, setVisible] = useState(() =>
    canShowNotification(campaignId, category),
  );
  const [mergeInfo, setMergeInfo] = useState<{
    merged: boolean;
    count: number;
  }>({ merged: false, count: 0 });

  const show = useCallback(() => {
    // §8.1 주간 상한
    if (!canShowNotification(campaignId, category)) {
      setVisible(false);
      return;
    }

    // §8.2 병합 체크
    if (topic) {
      const { shouldMerge, recentCount } = shouldMergeByTopic(topic);
      setMergeInfo({ merged: shouldMerge, count: recentCount });
    }

    // §8.1 마케팅 카운트 증가
    if (category === 'marketing') {
      incrementWeeklyCount(category);
    }

    markCampaignShown(campaignId);
    setVisible(true);
  }, [campaignId, category, topic]);

  const dismiss = useCallback(() => {
    dismissCampaign(campaignId);
    setVisible(false);
  }, [campaignId]);

  return {
    visible,
    show,
    dismiss,
    mergeInfo,
    weeklyRemaining: getRemainingWeeklyQuota(category),
    isWeeklyLimitReached: isWeeklyLimitReached(category),
  };
}

/** 세션 리셋 (로그아웃 등) */
export function resetMessageFatigueSession() {
  sessionShown.clear();
  resetTopicHistory();
}