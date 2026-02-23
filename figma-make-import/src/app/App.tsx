import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * App entry point — keppin
 *
 * createBrowserRouter + RouterProvider (Data Router) 패턴을 사용합니다.
 * Figma Make에서 페이지 목록을 올바르게 감지하려면 이 패턴이 필요합니다.
 *
 * React 인스턴스 중복 문제는 vite.config.ts의
 * resolve.dedupe + optimizeDeps.include 설정으로 해결합니다.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
