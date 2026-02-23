import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * TDS 제품 운영 확장 3-11, §1.2 — 로그인 보안 가드
 *
 * - 동일 계정 5회 연속 실패 → 10분 잠금
 * - 잠금 시간 카운트다운 표시
 * - 로그인 성공 시 카운터 리셋
 */

const LOGIN_FAIL_MAX = 5; // §1.2
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10분

export interface UseLoginGuardReturn {
  /** 연속 실패 횟수 */
  failCount: number;
  /** 잠금 여부 */
  isLocked: boolean;
  /** 남은 잠금 시간(초) */
  remainingLockTime: number;
  /** 실패 기록 */
  recordFailure: () => void;
  /** 성공 기록 (카운터 리셋) */
  recordSuccess: () => void;
  /** 수동 리셋 */
  reset: () => void;
}

export function useLoginGuard(): UseLoginGuardReturn {
  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [remainingLockTime, setRemainingLockTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = lockUntil !== null && Date.now() < lockUntil;

  // 카운트다운 타이머
  useEffect(() => {
    if (lockUntil && Date.now() < lockUntil) {
      const update = () => {
        const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
        setRemainingLockTime(remaining);
        if (remaining <= 0) {
          setLockUntil(null);
          setFailCount(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      };
      update();
      intervalRef.current = setInterval(update, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setRemainingLockTime(0);
    }
  }, [lockUntil]);

  const recordFailure = useCallback(() => {
    setFailCount((prev) => {
      const next = prev + 1;
      if (next >= LOGIN_FAIL_MAX) {
        setLockUntil(Date.now() + LOCK_DURATION_MS);
      }
      return next;
    });
  }, []);

  const recordSuccess = useCallback(() => {
    setFailCount(0);
    setLockUntil(null);
  }, []);

  const reset = useCallback(() => {
    setFailCount(0);
    setLockUntil(null);
  }, []);

  return {
    failCount,
    isLocked,
    remainingLockTime,
    recordFailure,
    recordSuccess,
    reset,
  };
}
