import { useState, useEffect } from 'react';

/* TDS 실무 운영 규칙 7, §1.4 — Debounce Hook
 * + 제품 운영 확장 (수치 중심) 6, §2.2 — 디바운스 기본값 300ms
 *
 * - 로컬 필터: 100ms 이내 (§2.1)
 * - 서버 검색: 300ms 디바운스 + 응답 2초 이내 (§2.1/§2.2)
 * - 최소 글자 수 가드: 2자 이상 (일반 검색)
 */

/**
 * 입력값을 지정된 시간(ms)만큼 지연시킨 뒤 반환합니다.
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms), 기본 300ms (§2.2 서버 검색 기준)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * 로딩 표시를 200ms 이후에만 보여주는 훅 (§1.5 & §3.1)
 * 0~200ms 구간에서 로딩 깜빡임 방지
 */
export function useDelayedLoading(isLoading: boolean, delay: number = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  return showLoading;
}