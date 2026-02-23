import { useCallback, useRef } from 'react';

/**
 * TDS 제품 운영 확장 5-13, §2 — 딥링크/푸시/알림 설계
 * + UX/UI 확장 운영 규칙 30, §8 — 알림(푸시/인앱) UX 운영 규칙
 *
 * §2.1 딥링크 기본 정책
 *   - "최종 목적지"만 표현, 중간 화면 강제 금지
 *   - 실패 시 폴백: 홈 → 랜딩 → 웹 대체
 *
 * §2.2 딥링크 실패 원인별 UX
 *   - 로그인 필요: 로그인 후 원래 목적지 자동 복귀(1회)
 *   - 권한 필요: 보기 모드 진입 (가능 시)
 *   - 앱 버전 미지원: 업데이트 유도 또는 웹 대체
 *
 * §2.3 푸시 빈도 상한
 *   - [확장30 §8.1] 프로모션/마케팅: 주 2회 (기존 3회에서 변경)
 *   - 제품/운영 공지: 주 1회
 *   - 보안/결제/인증: 예외(필수), 단 동일 이벤트 중복 발송 금지
 *
 * §2.4 푸시 발송 시간대
 *   - 기본: 09:00~20:00
 *   - 야간(20:00~09:00): 긴급/보안만
 *
 * §2.5 푸시 메시지 길이
 *   - 제목: 최대 20자
 *   - 본문: 최대 50자
 *   - CTA: 1개만
 *
 * §2.6 알림 권한 요청 타이밍
 *   - 설치 직후 금지
 *   - "가치 행동" 1회 완료 후 요청
 *   - 거절 후 재요청: 7일 후
 *
 * [확장30 §8 신규]
 * §8.1 빈도 상한 변경: 마케팅/프로모션 주 2회
 * §8.2 묶음/중복 방지: 동일 주제 알림 10분 내 2건 이상이면 마지막 알림 1건으로 병합
 */

/* ─── §2.1 딥링크 폴백 ─── */

export type DeepLinkFailure = 'loginRequired' | 'permissionRequired' | 'versionUnsupported' | 'notFound';

export interface DeepLinkFallback {
  /** §2.1 폴백 우선순위 */
  targets: Array<{
    type: 'appHome' | 'featureLanding' | 'webFallback';
    path: string;
  }>;
}

const DEFAULT_FALLBACK: DeepLinkFallback = {
  targets: [
    { type: 'appHome', path: '/app' },
    { type: 'featureLanding', path: '/app' },
    { type: 'webFallback', path: '/' },
  ],
};

/** §2.2 실패 원인별 처리 전략 */
export function getDeepLinkStrategy(failure: DeepLinkFailure): {
  action: string;
  path: string;
  message: string;
} {
  switch (failure) {
    case 'loginRequired':
      return {
        action: 'redirectLogin',
        path: '/login',
        message: '로그인 후 이동합니다',
      };
    case 'permissionRequired':
      return {
        action: 'viewMode',
        path: '/app',
        message: '보기 모드로 진입합니다',
      };
    case 'versionUnsupported':
      return {
        action: 'updatePrompt',
        path: '/app',
        message: '최신 버전으로 업데이트해주세요',
      };
    case 'notFound':
    default:
      return {
        action: 'fallback',
        path: DEFAULT_FALLBACK.targets[0].path,
        message: '페이지를 찾을 수 없어요',
      };
  }
}

/* ─── §2.3~2.5 푸시 설정 ─── */

export type PushCategory = 'marketing' | 'ops' | 'security';

export const PUSH_LIMITS = {
  marketing: { weeklyMax: 2 },   // §2.3
  ops: { weeklyMax: 1 },          // §2.3
  security: { weeklyMax: Infinity }, // §2.3 예외(필수)
} as const;

export const PUSH_SEND_WINDOW = {
  startHour: 9,   // §2.4
  endHour: 20,     // §2.4
} as const;

export const PUSH_MESSAGE_LIMITS = {
  titleMaxChars: 20,  // §2.5
  bodyMaxChars: 50,    // §2.5
  ctaMax: 1,            // §2.5
} as const;

/** §2.4 현재 시간이 발송 허용 시간대인지 확인 */
export function isInSendWindow(hour?: number): boolean {
  const currentHour = hour ?? new Date().getHours();
  return currentHour >= PUSH_SEND_WINDOW.startHour && currentHour < PUSH_SEND_WINDOW.endHour;
}

/** §2.5 메시지 길이 검증 */
export function validatePushMessage(title: string, body: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (title.length > PUSH_MESSAGE_LIMITS.titleMaxChars) {
    warnings.push(`제목이 ${title.length}자 (최대 ${PUSH_MESSAGE_LIMITS.titleMaxChars}자)`);
  }
  if (body.length > PUSH_MESSAGE_LIMITS.bodyMaxChars) {
    warnings.push(`본문이 ${body.length}자 (최대 ${PUSH_MESSAGE_LIMITS.bodyMaxChars}자)`);
  }
  return { valid: warnings.length === 0, warnings };
}

/* ─── §2.6 알림 권한 요청 타이밍 ─── */

const PERMISSION_STORAGE_KEY = '__push_permission';
const RE_ASK_DAYS = 7;

interface PushPermissionRecord {
  deniedAt: number;
  coreActionCompleted: boolean;
}

function getPermissionRecord(): PushPermissionRecord | null {
  try {
    const raw = localStorage.getItem(PERMISSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePermissionRecord(record: PushPermissionRecord) {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

/** §2.6 알림 권한 요청 가능 여부 */
export function canRequestPushPermission(): boolean {
  const record = getPermissionRecord();

  // 설치 직후 → 아직 가치 행동 안 함
  if (!record?.coreActionCompleted) return false;

  // 거절 후 7일 미경과
  if (record.deniedAt) {
    const suppressUntil = record.deniedAt + RE_ASK_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() < suppressUntil) return false;
  }

  return true;
}

/** §2.6 가치 행동 완료 기록 */
export function markCoreActionCompleted() {
  const record = getPermissionRecord() || { deniedAt: 0, coreActionCompleted: false };
  record.coreActionCompleted = true;
  savePermissionRecord(record);
}

/** §2.6 알림 권한 거절 기록 */
export function markPushPermissionDenied() {
  const record = getPermissionRecord() || { deniedAt: 0, coreActionCompleted: false };
  record.deniedAt = Date.now();
  savePermissionRecord(record);
}

/* ─── 딥링크 훅 ─── */

interface UseDeepLinkOptions {
  navigate: (path: string, opts?: { replace?: boolean }) => void;
  isLoggedIn: () => boolean;
  hasPermission?: (feature: string) => boolean;
}

export function useDeepLink(options: UseDeepLinkOptions) {
  const { navigate, isLoggedIn, hasPermission } = options;
  const pendingTargetRef = useRef<string | null>(null);

  /** §2.1 딥링크 해석 + 폴백 */
  const resolveDeepLink = useCallback(
    (targetPath: string) => {
      // §2.2 로그인 필요
      if (!isLoggedIn()) {
        pendingTargetRef.current = targetPath;
        const strategy = getDeepLinkStrategy('loginRequired');
        navigate(strategy.path, { replace: true });
        return;
      }

      // §2.2 권한 필요 (옵션)
      if (hasPermission && !hasPermission(targetPath)) {
        const strategy = getDeepLinkStrategy('permissionRequired');
        navigate(strategy.path, { replace: true });
        return;
      }

      // 목적지 직행
      navigate(targetPath);
    },
    [navigate, isLoggedIn, hasPermission],
  );

  /** §2.2 로그인 성공 후 원래 목적지 복귀 (1회) */
  const resumeAfterLogin = useCallback(() => {
    const target = pendingTargetRef.current;
    pendingTargetRef.current = null;
    if (target) {
      navigate(target, { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  return { resolveDeepLink, resumeAfterLogin };
}

/* ═══════════════════════════════════════════════════════════
   확장30 §8 — 알림(푸시/인앱) UX 운영 규칙 (신규 추가)
   ═══════════════════════════════════════════════════════════ */

/* ─── §8.1 빈도 상한(기본) ─── */

/**
 * [운영 가드레일] 사용자 1인 기준
 * - 프로모션/마케팅: 주 2회 상한 (PUSH_LIMITS.marketing.weeklyMax로 적용)
 * - 거래/보안/필수: 상한 없음(단, 동일 이벤트 중복 발송 금지)
 */

/* ─── §8.2 묶음/중복 방지 ─── */

/**
 * [운영 가드레일] 동일 주제 알림은 10분 내 2건 이상이면 마지막 알림 1건으로 병합
 */
export const NOTIFICATION_MERGE_WINDOW_MS = 10 * 60 * 1000; // 10분
export const NOTIFICATION_MERGE_THRESHOLD = 2;

interface NotificationRecord {
  topic: string;
  timestamp: number;
  eventId: string;
}

const notificationHistory: NotificationRecord[] = [];

/** §8.2 동일 주제 알림 병합 여부 판단 */
export function shouldMergeNotification(
  topic: string,
  eventId: string,
): { shouldMerge: boolean; existingCount: number; isDuplicate: boolean } {
  const now = Date.now();

  // 동일 이벤트 중복 발송 금지 (§8.1)
  const isDuplicate = notificationHistory.some(
    (r) => r.eventId === eventId && now - r.timestamp < NOTIFICATION_MERGE_WINDOW_MS,
  );
  if (isDuplicate) {
    return { shouldMerge: false, existingCount: 0, isDuplicate: true };
  }

  // 10분 내 동일 주제 알림 카운트
  const recentSameTopic = notificationHistory.filter(
    (r) => r.topic === topic && now - r.timestamp < NOTIFICATION_MERGE_WINDOW_MS,
  );

  // 기록 추가
  notificationHistory.push({ topic, timestamp: now, eventId });

  // 오래된 기록 정리 (10분 초과)
  while (
    notificationHistory.length > 0 &&
    now - notificationHistory[0].timestamp > NOTIFICATION_MERGE_WINDOW_MS
  ) {
    notificationHistory.shift();
  }

  return {
    shouldMerge: recentSameTopic.length >= NOTIFICATION_MERGE_THRESHOLD - 1,
    existingCount: recentSameTopic.length,
    isDuplicate: false,
  };
}

/** §8.2 알림 이력 초기화 (테스트용) */
export function resetNotificationHistory(): void {
  notificationHistory.length = 0;
}