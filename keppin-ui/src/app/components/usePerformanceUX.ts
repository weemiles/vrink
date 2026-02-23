import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TDS 제품 품질/운영 확장 규칙 9, §5 — 퍼포먼스 UX 훅
 *
 * §1.3 Reduce Motion 지원
 *   - prefers-reduced-motion 반응형 훅
 *   - 필수 정보 전달이 애니메이션에 의존하지 않아야 함
 *   - 화면 전환 애니메이션 제거 시 레이아웃 점프 최대 1회
 *
 * §5.1 프레임/응답성 목표
 *   - 200ms 이내: 로딩 표기 생략
 *   - 200~700ms: 로더(점/스피너) 표시
 *   - 700ms+: 스켈레톤/플레이스홀더
 *
 * §5.2 이미지 로딩
 *   - Above the fold 최대 12개 즉시 로드
 *   - 나머지 스크롤 진입 시 로드
 *   - 저해상도(blur) → 고해상도 2단계 업그레이드
 *
 * §5.3 프리패치
 *   - CTR 30% 이상인 아이템만 프리패치
 *   - 동시 최대 2개 요청
 *
 * §5.4 캐시/갱신 UX
 *   - 갱신 중 화면 흔들지 않음
 *   - 갱신 실패 시 "조용한 실패" 기본
 */

/* ─── §1.3 Reduce Motion ─── */

/** prefers-reduced-motion 미디어 쿼리 반응형 훅 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/** Reduce Motion 환경에서 안전한 transition 값을 반환 */
export function getMotionSafeTransition(
  prefersReduced: boolean,
  normalTransition: object = { type: 'spring', damping: 20, stiffness: 200 },
): object {
  if (prefersReduced) {
    return { duration: 0.01 }; // 즉시 전환 (점프 최소화)
  }
  return normalTransition;
}

/* ─── §5.1 스켈레톤/로더 전환 판단 ─── */

export type LoadingDisplay = 'none' | 'spinner' | 'skeleton';

const LOADING_SKIP_MS = 200;     // §5.1 로딩 표기 생략 ms
const SKELETON_THRESHOLD_MS = 700; // §5.1 스켈레톤 전환 기준 ms

/**
 * 로딩 경과 시간에 따른 표시 타입을 결정하는 훅
 *
 * - 0~200ms: 'none' (표기 생략)
 * - 200~700ms: 'spinner' (점/스피너)
 * - 700ms+: 'skeleton' (스켈레톤/플레이스홀더)
 */
export function useLoadingDisplay(isLoading: boolean): LoadingDisplay {
  const [display, setDisplay] = useState<LoadingDisplay>('none');
  const startTimeRef = useRef<number | null>(null);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skeletonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setDisplay('none');

      spinnerTimerRef.current = setTimeout(() => {
        setDisplay('spinner');
      }, LOADING_SKIP_MS);

      skeletonTimerRef.current = setTimeout(() => {
        setDisplay('skeleton');
      }, SKELETON_THRESHOLD_MS);

      return () => {
        if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
        if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
      };
    } else {
      setDisplay('none');
      startTimeRef.current = null;
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
      if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    }
  }, [isLoading]);

  return display;
}

/* ─── §5.2 이미지 레이지 로딩 ─── */

const ABOVE_FOLD_MAX = 12; // §5.2 첫 화면 즉시 로드 최대 수

/**
 * 리스트/피드 이미지에서 above-the-fold 여부를 판단하는 헬퍼
 * @param index 이미지 인덱스 (0-based)
 * @returns true이면 즉시 로드, false이면 lazy load
 */
export function isAboveFold(index: number): boolean {
  return index < ABOVE_FOLD_MAX;
}

/** loading 속성 결정 헬퍼 */
export function getImageLoading(index: number): 'eager' | 'lazy' {
  return isAboveFold(index) ? 'eager' : 'lazy';
}

/* ─── §5.3 프리패치 제한기 ─── */

const PREFETCH_MAX = 2; // §5.3 동시 최대 2개

/** 동시 프리패치 수를 제한하는 훅 */
export function usePrefetchLimiter() {
  const activeRef = useRef(0);
  const queueRef = useRef<Array<() => Promise<void>>>([]);

  const processQueue = useCallback(() => {
    while (activeRef.current < PREFETCH_MAX && queueRef.current.length > 0) {
      const task = queueRef.current.shift();
      if (task) {
        activeRef.current += 1;
        task().finally(() => {
          activeRef.current -= 1;
          processQueue();
        });
      }
    }
  }, []);

  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current.push(task);
    processQueue();
  }, [processQueue]);

  return { enqueue, activeCount: activeRef.current };
}

/* ─── §5.4 조용한 갱신 (Silent Refresh) ─── */

interface UseSilentRefreshOptions<T> {
  /** 데이터 fetch 함수 */
  fetchFn: () => Promise<T>;
  /** 캐시 stale time (기본 60s) */
  staleTime?: number;
  /** 갱신 실패 시 콜백 (기본: 무시) */
  onRefreshError?: (err: unknown) => void;
}

interface UseSilentRefreshReturn<T> {
  data: T | null;
  isStale: boolean;
  isRefreshing: boolean;
  refresh: () => void;
}

const DEFAULT_STALE_TIME = 60000; // 60s (§2.4 캐시 stale time)

/**
 * §5.4 갱신 UX: 화면을 흔들지 않는 조용한 갱신
 *
 * - 갱신 중 스피너/로더가 화면을 흔들지 않음
 * - 갱신 실패 시 "조용한 실패" (사용자 행동이 필요한 경우에만 알림)
 */
export function useSilentRefresh<T>(
  options: UseSilentRefreshOptions<T>,
): UseSilentRefreshReturn<T> {
  const { fetchFn, staleTime = DEFAULT_STALE_TIME, onRefreshError } = options;
  const [data, setData] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const isStale = Date.now() - lastFetchRef.current > staleTime;

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const result = await fetchFn();
      setData(result);
      lastFetchRef.current = Date.now();
    } catch (err) {
      // §5.4 조용한 실패 — 사용자 행동이 필요한 경우에만 알림
      onRefreshError?.(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn, isRefreshing, onRefreshError]);

  return { data, isStale, isRefreshing, refresh };
}
