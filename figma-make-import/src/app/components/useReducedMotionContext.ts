/**
 * §1.3 Reduce Motion 컨텍스트 + §3 오프라인 동기화 컨텍스트
 *
 * RootLayout에서 분리하여 순환 참조(circular dependency)를 방지합니다.
 * - useMotionConfig, LoadingSpinner, Loader 등 여러 컴포넌트에서 안전하게 import 가능
 */
import { createContext, useContext } from 'react';

/* ─── Reduce Motion ─── */
export const ReducedMotionContext = createContext(false);

export function useReducedMotionContext() {
  return useContext(ReducedMotionContext);
}

/* ─── Offline Sync (타입은 useOfflineSync에서 가져옴) ─── */
export const OfflineSyncContext = createContext<any>(null);

export function useOfflineSyncContext() {
  return useContext(OfflineSyncContext);
}
