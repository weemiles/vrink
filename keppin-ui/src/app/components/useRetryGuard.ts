import { useState, useCallback, useRef } from 'react';

/**
 * TDS 컴포넌트 시스템화 보강판 — §2.3 Retry UX 수치 규칙
 *
 * 재시도 버튼 연속 탭 방지 표준 훅:
 * - 요청 중에는 disabled 처리
 * - 쿨다운(디바운스) 시간 동안 같은 요청 중복 발사 금지
 * - 연속 실패 횟수 추적 → 최대 횟수 도달 시 Dialog 격상 신호
 *
 * 사용 예:
 * ```tsx
 * const retry = useRetryGuard({ cooldownMs: 1000, maxConsecutive: 3 });
 *
 * <button
 *   onClick={() => retry.execute(async () => { await fetchData(); })}
 *   disabled={retry.disabled}
 * >
 *   {retry.loading ? '재시도 중...' : '재시도'}
 * </button>
 *
 * {retry.shouldEscalate && <p>문제가 지속됩니다. 고객센터에 문의해주세요.</p>}
 * ```
 */

interface UseRetryGuardOptions {
  /** 재시도 쿨다운 ms (기본 1000) — --tds-retry-debounce-ms */
  cooldownMs?: number;
  /** 연속 재시도 최대 횟수 (기본 3) — --tds-retry-max-consecutive */
  maxConsecutive?: number;
  /** 성공 시 카운터 리셋 (기본 true) */
  resetOnSuccess?: boolean;
}

interface UseRetryGuardReturn {
  /** 현재 요청 진행 중 */
  loading: boolean;
  /** 버튼 비활성화 여부 (쿨다운 또는 로딩 중) */
  disabled: boolean;
  /** 연속 실패 횟수 */
  consecutiveFailures: number;
  /** 최대 연속 실패 도달 → Dialog/에스컬레이션 필요 */
  shouldEscalate: boolean;
  /** 재시도 실행 함수 */
  execute: (fn: () => Promise<void>) => Promise<void>;
  /** 수동 리셋 */
  reset: () => void;
}

export function useRetryGuard(options: UseRetryGuardOptions = {}): UseRetryGuardReturn {
  const {
    cooldownMs = 1000,
    maxConsecutive = 3,
    resetOnSuccess = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>();

  const shouldEscalate = consecutiveFailures >= maxConsecutive;
  const disabled = loading || coolingDown;

  const execute = useCallback(
    async (fn: () => Promise<void>) => {
      if (loading || coolingDown) return;

      setLoading(true);
      try {
        await fn();
        // 성공 시 카운터 리셋
        if (resetOnSuccess) {
          setConsecutiveFailures(0);
        }
      } catch {
        setConsecutiveFailures((prev) => prev + 1);
      } finally {
        setLoading(false);
        // §2.3 쿨다운 시작
        setCoolingDown(true);
        cooldownTimer.current = setTimeout(() => {
          setCoolingDown(false);
        }, cooldownMs);
      }
    },
    [loading, coolingDown, cooldownMs, resetOnSuccess],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setCoolingDown(false);
    setConsecutiveFailures(0);
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
    }
  }, []);

  return {
    loading,
    disabled,
    consecutiveFailures,
    shouldEscalate,
    execute,
    reset,
  };
}
