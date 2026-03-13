import { Outlet } from 'react-router';
import { DialogProvider } from '../components/useDialog';
import { BottomSheetProvider } from '../components/useBottomSheet';
import { ToastProvider } from '../components/useToast';
import { useReducedMotion } from '../components/usePerformanceUX';
import { useOfflineSync } from '../components/useOfflineSync';
import { OfflineBanner } from '../components/OfflineBanner';
import { useFeatureFlag, type FlagDefinition } from '../components/useFeatureFlag';
import { ThemeContext, useThemeProvider } from '../components/useTheme';
import { LanguageProvider } from '../components/useLanguage';
import { ReducedMotionContext, OfflineSyncContext } from '../components/useReducedMotionContext';
import { AuthProvider } from '../components/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Re-export hooks for backward compatibility (기존 import를 유지하는 소비자가 있을 수 있음)
export { useReducedMotionContext, useOfflineSyncContext } from '../components/useReducedMotionContext';

/**
 * 기본 Feature Flag 목록 (모의 데이터)
 * 실제 운영 시 서버에서 가져옵니다.
 */
const DEFAULT_FLAGS: FlagDefinition[] = [
  {
    key: 'contact_edit_v2',
    defaultValue: true,
    source: 'default',
    rolloutPercentage: 100,
  },
  {
    key: 'dark_mode',
    defaultValue: false,
    source: 'experiment',
    rolloutPercentage: 5,
    isInExperiment: false,
    experimentValue: true,
  },
  {
    key: 'push_notification',
    defaultValue: true,
    source: 'default',
    rolloutPercentage: 100,
  },
];

/**
 * Root layout that provides all global context providers
 * inside the React Router tree (RouterProvider creates an isolated tree).
 *
 * §1.4 (제품 운영 확장 2-10): aria-live 영역을 전역에 배치하여
 * 스크린리더 동적 공지를 지원합니다.
 *
 * §3 (제품 운영 확장 5-13): 오프라인 배너를 전역 상단에 배치합니다.
 * §6 (제품 운영 확장 5-13): Feature Flag Provider를 전역에 배치합니다.
 */
export function RootLayout() {
  const prefersReducedMotion = useReducedMotion();

  // 다크모드 테마 컨텍스트
  const themeCtx = useThemeProvider();

  // §3 오프라인/네트워크 상태 머신
  const offlineSync = useOfflineSync({
    onStateChange: (state) => {
      // §3.4 상태 변경 시 스크린리더 공지는 OfflineBanner의 aria-live로 처리
      if (process.env.NODE_ENV === 'development') {
        console.log('[OfflineSync] state:', state);
      }
    },
  });

  // §6 Feature Flag
  const featureFlags = useFeatureFlag(DEFAULT_FLAGS);

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeContext.Provider value={themeCtx}>
          <ReducedMotionContext.Provider value={prefersReducedMotion}>
            <featureFlags.Provider value={featureFlags.contextValue}>
              <OfflineSyncContext.Provider value={offlineSync}>
                <DialogProvider>
                  <BottomSheetProvider>
                    <ToastProvider>
                      <div id="app-shell">
                        {/* A11y: Skip navigation — 키보드 사용자가 반복 내비게이션 건너뛰기 */}
                        <a href="#main-content" className="skip-nav">
                          본문으로 건너뛰기
                        </a>
                        {/* §3 오프라인 배너 — 전역 최상단 */}
                        <OfflineBanner
                          state={offlineSync.state}
                          pendingCount={offlineSync.pendingCount}
                          retryCount={offlineSync.retryCount}
                          isRetryExhausted={offlineSync.isRetryExhausted}
                          errorMessage={offlineSync.errorMessage}
                          onManualRetry={offlineSync.manualRetry}
                        />
                        <ErrorBoundary>
                          <main id="main-content">
                            <Outlet />
                          </main>
                        </ErrorBoundary>
                        {/* §1.4 스크린리더 라이브 영역 — 동적 콘텐츠 공지용 */}
                        <div
                          id="a11y-live-polite"
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          className="sr-only"
                          style={{
                            position: 'absolute',
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: 'hidden',
                            clip: 'rect(0, 0, 0, 0)',
                            whiteSpace: 'nowrap',
                            border: 0,
                          }}
                        />
                        <div
                          id="a11y-live-assertive"
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          className="sr-only"
                          style={{
                            position: 'absolute',
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: 'hidden',
                            clip: 'rect(0, 0, 0, 0)',
                            whiteSpace: 'nowrap',
                            border: 0,
                          }}
                        />
                      </div>
                    </ToastProvider>
                  </BottomSheetProvider>
                </DialogProvider>
              </OfflineSyncContext.Provider>
            </featureFlags.Provider>
          </ReducedMotionContext.Provider>
        </ThemeContext.Provider>
      </LanguageProvider>
    </AuthProvider>
  );
}
