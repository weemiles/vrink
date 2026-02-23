import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, CloudOff, Loader2, CheckCircle2 } from 'lucide-react';
import { type SyncState } from './useOfflineSync';
import { type OfflineErrorMessage } from './useOfflineSync';

/**
 * TDS 제품 운영 확장 5-13, §3 — 오프라인/네트워크 상태 배너
 *
 * §3.4 에러 메시지 규칙
 *   - 항상 2가지 포함: 현재 상태 + 사용자가 할 수 있는 다음 행동
 *
 * §1.2 모션 규칙
 *   - 작은 전환(펼침/접기): 150~200ms
 *
 * Reduce Motion 대응
 *   - 이동 애니메이션 → opacity only
 */

interface OfflineBannerProps {
  state: SyncState;
  pendingCount: number;
  retryCount: number;
  isRetryExhausted: boolean;
  errorMessage: OfflineErrorMessage | null;
  onManualRetry: () => void;
}

const STATE_CONFIG: Record<
  SyncState,
  {
    icon: React.ReactNode;
    bgClass: string;
    textClass: string;
    label: string;
  }
> = {
  online: {
    icon: <CheckCircle2 size={16} aria-hidden="true" />,
    bgClass: 'bg-toss-green-50',
    textClass: 'text-toss-green-600',
    label: '연결됨',
  },
  offline: {
    icon: <WifiOff size={16} aria-hidden="true" />,
    bgClass: 'bg-toss-orange-50',
    textClass: 'text-toss-orange-600',
    label: '오프라인',
  },
  syncPending: {
    icon: <CloudOff size={16} aria-hidden="true" />,
    bgClass: 'bg-toss-blue-50',
    textClass: 'text-toss-blue-600',
    label: '동기화 대기',
  },
  syncing: {
    icon: <Loader2 size={16} className="animate-spin" aria-hidden="true" />,
    bgClass: 'bg-toss-blue-50',
    textClass: 'text-toss-blue-600',
    label: '동기화 중',
  },
  syncFailed: {
    icon: <CloudOff size={16} aria-hidden="true" />,
    bgClass: 'bg-toss-red-50',
    textClass: 'text-toss-red-600',
    label: '동기화 실패',
  },
};

export function OfflineBanner({
  state,
  pendingCount,
  retryCount,
  isRetryExhausted,
  errorMessage,
  onManualRetry,
}: OfflineBannerProps) {
  // online이고 pending 없으면 숨김
  const isVisible = state !== 'online';

  const config = STATE_CONFIG[state];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.175 }} // §1.2 작은 전환 175ms
          className={`${config.bgClass} overflow-hidden`}
          role="status"
          aria-live="polite"
          aria-label={config.label}
        >
          <div
            className="flex items-center gap-2.5"
            style={{ padding: '10px 24px' }}
          >
            <span className={config.textClass}>{config.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`${config.textClass}`} style={{ fontSize: 13, fontWeight: 600 }}>
                {errorMessage?.status || config.label}
                {pendingCount > 0 && state !== 'online' && (
                  <span className="ml-1" style={{ fontWeight: 400, opacity: 0.7 }}>
                    ({pendingCount}건 대기 중)
                  </span>
                )}
              </p>
              {errorMessage?.nextAction && (
                <p
                  className={`${config.textClass} mt-0.5`}
                  style={{ fontSize: 12, opacity: 0.7 }}
                >
                  {errorMessage.nextAction}
                </p>
              )}
            </div>

            {/* §3.2 수동 재시도 버튼 (5회 소진 시 표시) */}
            {isRetryExhausted && (
              <button
                onClick={onManualRetry}
                className="flex items-center gap-1 shrink-0 rounded-full"
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  color: 'var(--toss-grey-700)',
                  minHeight: 32,
                  minWidth: 44,
                }}
                aria-label="수동 재시도"
              >
                <RefreshCw size={12} aria-hidden="true" />
                <span>재시도</span>
              </button>
            )}

            {/* 동기화 중이면 재시도 횟수 표시 */}
            {state === 'syncing' && retryCount > 0 && (
              <span
                className={config.textClass}
                style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}
                aria-label={`${retryCount}번째 시도`}
              >
                {retryCount}/5
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}