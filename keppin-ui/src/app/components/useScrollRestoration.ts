/**
 * useScrollRestoration.ts
 * ────────────────────────────────────────────────
 * 하단 탭 전환 시 스크롤 위치를 보존합니다.
 *
 * ── 동작 ──
 * 1) 현재 탭 경로가 변경되면 이전 탭의 scrollY를 저장
 * 2) 새 탭이 마운트되면 이전에 저장된 scrollY로 복원
 * 3) 탭 경로만 추적 (상세페이지 이동은 무시)
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/** 탭 경로 목록 — 이 경로들만 스크롤 보존 대상 */
const TAB_PATHS = new Set(['/app', '/app/contacts', '/app/calendar', '/app/mypage', '/app/settings']);

/** 경로별 스크롤 위치 캐시 (세션 동안 유지) */
const scrollCache = new Map<string, number>();

export function useScrollRestoration() {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    // 같은 경로면 무시
    if (currentPath === prevPath) return;

    // 이전 경로가 탭이었으면 스크롤 위치 저장
    if (TAB_PATHS.has(prevPath)) {
      scrollCache.set(prevPath, window.scrollY);
    }

    // 현재 경로 업데이트
    prevPathRef.current = currentPath;

    // 현재 경로가 탭이면 저장된 스크롤 위치 복원
    if (TAB_PATHS.has(currentPath)) {
      const saved = scrollCache.get(currentPath);
      if (saved !== undefined && saved > 0) {
        // requestAnimationFrame으로 레이아웃 완료 후 복원
        requestAnimationFrame(() => {
          // 두 번 래핑: 첫 rAF에서 페인트, 두 번째에서 실제 스크롤
          requestAnimationFrame(() => {
            window.scrollTo(0, saved);
          });
        });
      } else {
        // 처음 방문하는 탭은 맨 위로
        window.scrollTo(0, 0);
      }
    } else {
      // 탭이 아닌 페이지(상세 등)는 항상 맨 위
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return { scrollCache };
}

/** 특정 탭의 스크롤 캐시 초기화 (데이터가 크게 바뀌었을 때) */
export function resetScrollCache(path?: string) {
  if (path) {
    scrollCache.delete(path);
  } else {
    scrollCache.clear();
  }
}
