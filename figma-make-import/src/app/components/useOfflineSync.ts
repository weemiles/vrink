import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * TDS 제품 운영 확장 5-13, §3 — 오프라인/네트워크 불안정 UX
 *
 * §3.1 상태 정의(최소)
 *   - Online / Offline / SyncPending / Syncing / SyncFailed
 *
 * §3.2 재시도(backoff) 기본값
 *   - 즉시 재시도: 1회
 *   - 이후: 1s → 2s → 4s → 8s → 16s
 *   - 최대 간격 상한: 30s
 *   - 자동 재시도 최대: 5회
 *   - 5회 실패 → "수동 재시도" 버튼 + 실패 원인 1줄
 *
 * §3.3 오프라인에서도 가능한 행동
 *   - 작성/편집 → 오프라인에서 로컬 저장 허용 + SyncPending 노출
 *   - 금전/인증/민감 변경 → 오프라인 실행 금지
 *
 * §3.4 에러 메시지 규칙
 *   - 현재 상태(오프라인/지연) + 사용자가 할 수 있는 다음 행동
 */

/* ─── §3.1 상태 정의 ─── */

export type SyncState =
  | 'online'
  | 'offline'
  | 'syncPending'
  | 'syncing'
  | 'syncFailed';

/* ─── §3.2 Backoff 상수 ─── */

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000]; // §3.2
const MAX_INTERVAL = 30000;  // §3.2 최대 30초
const MAX_AUTO_RETRIES = 5;  // §3.2 최대 5회

/* ─── §3.3 행동 분류 ─── */

export type OfflineAction = 'safe' | 'sensitive';

/** §3.3 오프라인에서 실행 가능한 행동인지 판단 */
export function canPerformOffline(action: OfflineAction): boolean {
  return action === 'safe'; // 금전/인증 → 'sensitive' → 불가
}

/* ─── §3.4 에러 메시지 빌더 ─── */

export type FailureCause = 'network' | 'server' | 'permission' | 'unknown';

export interface OfflineErrorMessage {
  status: string;    // 현재 상태 설명
  nextAction: string; // 사용자 다음 행동
}

export function buildOfflineErrorMessage(
  cause: FailureCause,
  retryExhausted: boolean,
): OfflineErrorMessage {
  const statusMap: Record<FailureCause, string> = {
    network: '인터넷에 연결할 수 없어요',
    server: '서버에 일시적인 문제가 있어요',
    permission: '접근 권한이 필요해요',
    unknown: '일시적인 오류가 발생했어요',
  };

  const status = statusMap[cause];

  if (retryExhausted) {
    return {
      status,
      nextAction: cause === 'network'
        ? 'Wi-Fi 또는 데이터를 확인하고 다시 시도해주세요'
        : '잠시 후 다시 시도해주세요',
    };
  }

  return {
    status,
    nextAction: '자동으로 다시 시도하고 있어요',
  };
}

/* ─── 로컬 대기열 (SyncPending) ─── */

interface PendingItem {
  id: string;
  action: string;
  data: unknown;
  createdAt: number;
}

/* ─── 메인 훅 ─── */

interface UseOfflineSyncOptions {
  /** 동기화 실행 함수 */
  syncFn?: (items: PendingItem[]) => Promise<void>;
  /** 실패 원인 감지 */
  detectCause?: (error: unknown) => FailureCause;
  /** 상태 변경 콜백 */
  onStateChange?: (state: SyncState) => void;
}

interface UseOfflineSyncReturn {
  /** §3.1 현재 동기화 상태 */
  state: SyncState;
  /** 네트워크 연결 여부 */
  isOnline: boolean;
  /** 대기 중인 항목 수 */
  pendingCount: number;
  /** §3.2 자동 재시도 횟수 */
  retryCount: number;
  /** 자동 재시도 소진 여부 */
  isRetryExhausted: boolean;
  /** §3.4 현재 에러 메시지 */
  errorMessage: OfflineErrorMessage | null;
  /** §3.3 오프라인 로컬 저장 (safe actions만) */
  queueAction: (id: string, action: string, data: unknown) => boolean;
  /** §3.2 수동 재시도 */
  manualRetry: () => void;
  /** 대기열 비우기 */
  clearPending: () => void;
}

export function useOfflineSync(
  options: UseOfflineSyncOptions = {},
): UseOfflineSyncReturn {
  const { syncFn, detectCause, onStateChange } = options;

  const [networkOnline, setNetworkOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [syncState, setSyncState] = useState<SyncState>('online');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [failureCause, setFailureCause] = useState<FailureCause>('unknown');

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  // 상태 변경 통지
  const updateState = useCallback(
    (newState: SyncState) => {
      setSyncState(newState);
      onStateChange?.(newState);
    },
    [onStateChange],
  );

  // 네트워크 감지
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
      // 온라인 복귀 시 대기열이 있으면 Syncing 시작
      if (pendingItems.length > 0) {
        updateState('syncing');
      } else {
        updateState('online');
      }
    };
    const handleOffline = () => {
      setNetworkOnline(false);
      updateState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingItems.length, updateState]);

  // §3.2 자동 재시도 실행
  const attemptSync = useCallback(
    async (attempt: number) => {
      if (abortRef.current || !syncFn || pendingItems.length === 0) return;

      updateState('syncing');

      try {
        await syncFn(pendingItems);
        // 성공
        setPendingItems([]);
        setRetryCount(0);
        updateState('online');
      } catch (err) {
        const cause = detectCause ? detectCause(err) : 'unknown';
        setFailureCause(cause);

        if (attempt >= MAX_AUTO_RETRIES) {
          // §3.2 5회 실패 → 수동 재시도
          updateState('syncFailed');
          return;
        }

        setRetryCount(attempt);
        updateState('syncPending');

        // §3.2 backoff 스케줄
        const delay = Math.min(
          BACKOFF_DELAYS[attempt] ?? BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1],
          MAX_INTERVAL,
        );

        retryTimerRef.current = setTimeout(() => {
          if (!abortRef.current) {
            attemptSync(attempt + 1);
          }
        }, delay);
      }
    },
    [syncFn, pendingItems, detectCause, updateState],
  );

  // §3.3 오프라인 로컬 저장
  const queueAction = useCallback(
    (id: string, action: string, data: unknown): boolean => {
      // 금전/인증은 오프라인 금지
      if (!networkOnline) {
        // 오프라인이지만 safe action이면 큐에 추가
        const newItem: PendingItem = { id, action, data, createdAt: Date.now() };
        setPendingItems((prev) => [...prev, newItem]);
        updateState('syncPending');
        return true;
      }

      // 온라인이면 바로 큐에 넣고 동기화 시도
      const newItem: PendingItem = { id, action, data, createdAt: Date.now() };
      setPendingItems((prev) => [...prev, newItem]);
      return true;
    },
    [networkOnline, updateState],
  );

  // §3.2 수동 재시도
  const manualRetry = useCallback(() => {
    abortRef.current = false;
    setRetryCount(0);
    attemptSync(0);
  }, [attemptSync]);

  // 대기열 비우기
  const clearPending = useCallback(() => {
    abortRef.current = true;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    setPendingItems([]);
    setRetryCount(0);
    updateState(networkOnline ? 'online' : 'offline');
  }, [networkOnline, updateState]);

  // §3.4 에러 메시지
  const isRetryExhausted = retryCount >= MAX_AUTO_RETRIES || syncState === 'syncFailed';
  const errorMessage =
    syncState === 'syncFailed' || syncState === 'syncPending'
      ? buildOfflineErrorMessage(failureCause, isRetryExhausted)
      : null;

  // Cleanup
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  return {
    state: syncState,
    isOnline: networkOnline,
    pendingCount: pendingItems.length,
    retryCount,
    isRetryExhausted,
    errorMessage,
    queueAction,
    manualRetry,
    clearPending,
  };
}
